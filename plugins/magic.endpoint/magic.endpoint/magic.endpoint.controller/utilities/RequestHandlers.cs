/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using magic.node;
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
            var encoding = GetEncoding(request);

            // Reading body as JSON from request as a Stream, with correctly applied encoding.
            var args = new Node("", request.Body);
            args.Add(new Node("encoding", encoding));
            await signaler.SignalAsync("json2lambda-stream", args);
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
        static string GetEncoding(HttpRequest request)
        {
            return request.ContentType?
                .Split(';')
                .Select(x => x.Trim())
                .FirstOrDefault(x => x.StartsWith("char-set"))?
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
