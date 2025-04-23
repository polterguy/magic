/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Newtonsoft.Json.Linq;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.json.utilities
{
    /*
     * Internal helper/implementation class, doing the heavy lifting.
     */
    internal static class Lambda2JsonTransformer
    {
        /*
         * Returns "source node" for [lambda2xxx] conversions.
         */
        internal static Node GetSourceNode(Node input)
        {
            // Figuring out what to convert.
            var result = new Node();
            if (input.Value != null)
                result.AddRange(input.Evaluate().Select(x => x.Clone()));
            else
                result.AddRange(input.Children.Select(x => x.Clone()));
            return result;
        }

        /*
         * Creates a JContainer from the specified lambda/node object.
         */
        internal static JContainer ToJson(Node node)
        {
            return Node2JContainer(node);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Recursively transforms the given node to a JContainer,
         * and returns the results to caller.
         */
        static JContainer Node2JContainer(Node root)
        {
            if (root.Children.Any(x => x.Name.Length > 0 && x.Name != "."))
                return new JObject(root.Children.Select(x => Node2JProperty(x))); // JObject with properties
            else if (root.Children.Any())
                return new JArray(root.Children.Select(x => Node2JToken(x))); // Array
            return new JObject();
        }

        /*
         * Recursively transforms the given node to a JProperty,
         * and returns the results to caller.
         */
        static JProperty Node2JProperty(Node idx)
        {
            if (idx.Children.Any())
                return new JProperty(idx.Name, Node2JContainer(idx));
            return new JProperty(idx.Name, Node2JValue(idx));
        }

        /*
         * Recursively transforms the given node to a JToken,
         * and returns the results to caller.
         */
        static JToken Node2JToken(Node idx)
        {
            if (idx.Children.Any())
                return Node2JContainer(idx);
            else
                return Node2JValue(idx);
        }

        /*
         * Transforms the given node to a JValue,
         * and returns the results to caller.
         */
        static JValue Node2JValue(Node idx)
        {
            var val = idx.GetEx<object>();
            if (val is DateTime dateVal && Converter.DefaultTimeZone != "none" && dateVal.Kind == DateTimeKind.Unspecified)
            {
                if (Converter.DefaultTimeZone == "utc")
                    val = DateTime.SpecifyKind(dateVal, DateTimeKind.Utc);
                else if (Converter.DefaultTimeZone == "local")
                    val = DateTime.SpecifyKind(dateVal, DateTimeKind.Local);
            }
            return new JValue(val);
        }

        #endregion
    }
}
