/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Text;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.logging.helpers
{
    /*
     * Internal utility class.
     */
    internal static class Utilities
    {
        /*
         * Utility method to create new log item from specified node.
         */
        public static (string Content, Dictionary<string, string> Meta) GetLogContent(Node node, ISignaler signaler)
        {
            if (node.Value != null)
                return (node.GetEx<string>(), node.Children.ToDictionary(x => x.Name, x => x.GetEx<string>()));

            signaler.Signal("eval", node);
            var builder = new StringBuilder();
            foreach (var idx in node.Children)
            {
                builder.Append(idx.GetEx<string>());
            }
            return (builder.ToString(), null);
        }
    }
}
