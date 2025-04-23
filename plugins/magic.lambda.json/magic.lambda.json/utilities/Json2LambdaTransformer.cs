/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using Newtonsoft.Json.Linq;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.json.utilities
{
    /*
     * Internal helper/implementation class, doing the heavy lifting.
     */
    internal static class Json2LambdaTransformer
    {
        /*
         * Transforms the given JContainer to a lambda object,
         * and injects into the given node.
         */
        internal static void ToNode(Node node, JToken token)
        {
            if (token is JArray array)
                JArray2Node(node, array);
            else if (token is JObject obj)
                JObject2Node(node, obj);
            else if (token is JValue val)
            {
                var val2 = val.Value;
                if (val2 is DateTime dateVal && Converter.DefaultTimeZone != "none" && dateVal.Kind == DateTimeKind.Unspecified)
                {
                    if (Converter.DefaultTimeZone == "utc")
                        val2 = DateTime.SpecifyKind(dateVal, DateTimeKind.Utc);
                    else if (Converter.DefaultTimeZone == "local")
                        val2 = DateTime.SpecifyKind(dateVal, DateTimeKind.Local);
                }
                node.Value = val2;
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Transforms a JObject to a node, and puts result into specified node.
         */
        static void JObject2Node(Node node, JObject obj)
        {
            foreach (var idx in obj)
            {
                var cur = new Node(idx.Key);
                node.Add(cur);
                ToNode(cur, idx.Value);
            }
        }

        /*
         * Transforms a JArray to a node, and puts result into specified node.
         */
        static void JArray2Node(Node node, JArray arr)
        {
            foreach (var idx in arr)
            {
                var cur = new Node(".");
                node.Add(cur);
                ToNode(cur, idx);
            }
        }

        #endregion
    }
}
