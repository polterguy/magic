/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Web;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.http.services.helpers
{
    /*
     * Helper class to transform an HTTP response content object to a semantic lambda object.
     */
    internal static class ResponseTransformers
    {
        const string ContentName = "content";

        /*
         * Transforms from JSON string to lambda object.
         */
        internal static async Task<Node> TransformFromJson(ISignaler signaler, HttpContent content)
        {
            /*
             * Most JSON is UTF8, and is an object or an array, which we parse directly from the bytes we receive, in
             * one pass, without ever creating a string out of it.
             */
            var charset = content.Headers.ContentType?.CharSet?.Trim('"');
            if (charset == null || string.Equals(charset, "utf-8", StringComparison.OrdinalIgnoreCase))
            {
                var bytes = await content.ReadAsByteArrayAsync();
                if (bytes.Length == 0)
                    return new Node(ContentName);
                var start = FirstSignificant(bytes);
                if (start < bytes.Length && (bytes[start] == '{' || bytes[start] == '['))
                {
                    var result = new Node(ContentName);
                    try
                    {
                        // Strict, since the JSON must be valid JSON for us to accept it as JSON.
                        NodeJson.FromUtf8(result, bytes, true, true, true);
                        return result;
                    }
                    catch (HyperlambdaException)
                    {
                        // Not valid JSON, hence preserving the response body below.
                    }
                }
            }
            return await TransformFromJsonText(signaler, await content.ReadAsStringAsync());
        }

        /*
         * Index of the first byte that is not a byte order mark or white space.
         */
        static int FirstSignificant(byte[] bytes)
        {
            var idx = bytes.Length >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF ? 3 : 0;
            while (idx < bytes.Length && (bytes[idx] == ' ' || bytes[idx] == '\t' || bytes[idx] == '\r' || bytes[idx] == '\n'))
            {
                idx++;
            }
            return idx;
        }

        /*
         * Transforms from JSON string to lambda object.
         */
        static Task<Node> TransformFromJsonText(ISignaler signaler, string json)
        {
            if (string.IsNullOrEmpty(json))
                return Task.FromResult(new Node(ContentName));

            try
            {
                using var document = JsonDocument.Parse(json);
                switch (document.RootElement.ValueKind)
                {
                    case JsonValueKind.Object:
                    case JsonValueKind.Array:
                    {
                        var tmpNode = new Node(ContentName, json);
                        signaler.Signal("json2lambda", tmpNode, skipWhitelist: true);
                        return Task.FromResult(tmpNode);
                    }

                    case JsonValueKind.String:
                        return Task.FromResult(new Node(ContentName, document.RootElement.GetString()));

                    default:
                        return Task.FromResult(new Node(ContentName, document.RootElement.GetRawText()));
                }
            }
            catch (JsonException)
            {
                // Preserve the response body even if the server mislabeled invalid content as JSON.
                return Task.FromResult(new Node(ContentName, json));
            }
        }

        /*
         * Transforms from Hyperlambda string to lambda object.
         */
        internal static async Task<Node> TransformFromHyperlambda(ISignaler signaler, HttpContent content)
        {
            var hl = await content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(hl))
                return new Node(ContentName);
            var tmpNode = new Node(ContentName, hl);
            await signaler.SignalAsync("hyper2lambda", tmpNode, skipWhitelist: true);
            return tmpNode;
        }

        /*
         * Transforms from URL encoded string to lambda object.
         */
        internal static async Task<Node> TransformFromUrlEncoded(ISignaler signaler, HttpContent content)
        {
            var args = (await content.ReadAsStringAsync()).Split('&');
            var result = new Node(ContentName);
            foreach (var idxArg in args)
            {
                var cur = idxArg.Split('=');
                var curNode = new Node(cur[0]);
                if (cur.Length > 1)
                    curNode.Value = HttpUtility.UrlDecode(cur.Skip(1).First());
                result.Add(curNode);
            }
            return result;
        }
    }
}
