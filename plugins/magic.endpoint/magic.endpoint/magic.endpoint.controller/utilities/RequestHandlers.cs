/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Text;
using System.Linq;
using System.Buffers;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.endpoint.controller.utilities
{
    /*
     * Default Content-Type request handlers responsible for parametrising IExecutorAsync invocation according
     * to Content-Type specified by client.
     */
    internal static class RequestHandlers
    {
        /*
         * Default JSON handler, simply de-serialising JSON and creating a
         * Node/Lambda argument collection.
         */
        internal static async Task<Node> JsonHandler(ISignaler signaler, HttpRequest request)
        {
            // Figuring out encoding of request.
            var encoding = Encoding.GetEncoding(GetEncoding(request));

            /*
             * Reading the body, and parsing it directly into a lambda object.
             *
             * Notice, when the client has told us how long the body is, and it is not huge, we read it into a buffer of exactly
             * that size, instead of copying it to a stream that has to grow to fit it.
             */
            var args = new Node("");
            var length = request.ContentLength;
            if (length.HasValue && length.Value > 0 && length.Value <= MaxBufferedBody)
            {
                var buffer = ArrayPool<byte>.Shared.Rent((int)length.Value);
                try
                {
                    await request.Body.ReadExactlyAsync(buffer.AsMemory(0, (int)length.Value));
                    ParseJson(args, new ReadOnlySpan<byte>(buffer, 0, (int)length.Value), encoding);
                }
                finally
                {
                    ArrayPool<byte>.Shared.Return(buffer);
                }
            }
            else
            {
                using (var buffer = new MemoryStream())
                {
                    await request.Body.CopyToAsync(buffer);
                    ParseJson(args, new ReadOnlySpan<byte>(buffer.GetBuffer(), 0, (int)buffer.Length), encoding);
                }
            }
            return args;
        }

        /*
         * URL encoded handler, de-serialising URL encoded data from body and
         * creating a Node/Lambda argument collection.
         */
        internal static async Task<Node> UrlEncodedHandler(ISignaler signaler, HttpRequest request)
        {
            // URL encoded transmission, reading arguments as such.
            return (await ReadForm(request)).Args;
        }

        /*
         * Multipart (MIME) form data handler, de-serialising MIME, but avoids reading files into memory,
         * and rather keeping these as raw streams, building a Node/Lambda argument collection.
         */
        internal static async Task<Node> FormDataHandler(ISignaler signaler, HttpRequest request)
        {
            // MIME content, reading arguments as such first.
            var collection = await ReadForm(request);

            /*
             * Then reading files.
             *
             * Notice, we don't read files into memory, but simply transfer these as Stream
             * objects to Hyperlambda.
             */
            foreach (var idxFile in collection.Collection.Files)
            {
                var tmp = new Node("file");
                tmp.Add(new Node("name", idxFile.FileName));
                tmp.Add(new Node("stream", idxFile.OpenReadStream()));
                collection.Args.Add(tmp);
            }
            return collection.Args;
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns encoding of HTTP request to caller in string format.
         */
        const int MaxBufferedBody = 1024 * 1024;

        /*
         * Parses JSON in the specified encoding into the specified node.
         */
        static void ParseJson(Node args, ReadOnlySpan<byte> content, Encoding encoding)
        {
            if (encoding.CodePage == 65001)
                NodeJson.FromUtf8(args, content, false);
            else
                NodeJson.FromUtf8(args, Encoding.UTF8.GetBytes(encoding.GetString(content)), false);
        }

        static string GetEncoding(HttpRequest request)
        {
            return request.ContentType?
                .Split(';')
                .Select(x => x.Trim())
                .FirstOrDefault(x => x.StartsWith("charset", StringComparison.Ordinal))?
                .Split('=')
                .Skip(1)
                .FirstOrDefault()?
                .Trim('"') ?? "utf-8";
        }

        /*
         * Helper method to read form and return as Node/Lambda object, in addition to IFormCollection.
         */
        static async Task<(IFormCollection Collection, Node Args)> ReadForm(HttpRequest request)
        {
            var collection = await request.ReadFormAsync();
            var args = new Node();
            foreach (var idx in collection)
            {
                args.Add(new Node(idx.Key, idx.Value.ToString()));
            }
            return (collection, args);
        }

        #endregion
    }
}
