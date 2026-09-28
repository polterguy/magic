/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Web;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.http.services.helpers
{
    /*
     * Helper class to transform an HTTP response content object to a semantic lambda object.
     */
    internal static class ResponseTransformers
    {
        /*
         * Transforms from JSON string to lambda object.
         */
        internal static async Task<Node> TransformFromJson(ISignaler signaler, HttpContent content)
        {
            var json = await content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(json))
                return new Node("content");

            try
            {
                using var document = JsonDocument.Parse(json);
                switch (document.RootElement.ValueKind)
                {
                    case JsonValueKind.Object:
                    case JsonValueKind.Array:
                    {
                        var tmpNode = new Node("content", json);
                        signaler.Signal("json2lambda", tmpNode, skipWhitelist: true);
                        return tmpNode;
                    }

                    case JsonValueKind.String:
                        return new Node("content", document.RootElement.GetString());

                    default:
                        return new Node("content", document.RootElement.GetRawText());
                }
            }
            catch (JsonException)
            {
                // Preserve the response body even if the server mislabeled invalid content as JSON.
                return new Node("content", json);
            }
        }

        /*
         * Transforms from Hyperlambda string to lambda object.
         */
        internal static async Task<Node> TransformFromHyperlambda(ISignaler signaler, HttpContent content)
        {
            var hl = await content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(hl))
                return new Node("content");
            var tmpNode = new Node("content", hl);
            signaler.Signal("hyper2lambda", tmpNode, skipWhitelist: true);
            return tmpNode;
        }

        /*
         * Transforms from URL encoded string to lambda object.
         */
        internal static async Task<Node> TransformFromUrlEncoded(ISignaler signaler, HttpContent content)
        {
            var args = (await content.ReadAsStringAsync()).Split('&');
            var result = new Node("content");
            foreach (var idxArg in args)
            {
                var cur = idxArg.Split('=');
                var curNode = new Node(cur.First());
                if (cur.Count() > 1)
                    curNode.Value = HttpUtility.UrlDecode(cur.Skip(1).First());
                result.Add(curNode);
            }
            return result;
        }
    }
}
