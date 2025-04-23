/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Text;
using System.Collections.Generic;

namespace magic.node.extensions.hyperlambda
{
    /// <summary>
    /// Class that allows you to create Hyperlambda from a Lambda/Node-list.
    /// </summary>
    public static class HyperlambdaGenerator
    {
        /// <summary>
        /// Returns Hyperlambda for the specified collection of nodes.
        /// </summary>
        /// <param name="nodes">Nodes to create Hyperlambda from</param>
        /// <param name="comments">Whether or not not keep comments or not</param>
        /// <returns>Hyperlambda representing the specified list of nodes</returns>
        public static string GetHyperlambda(IEnumerable<Node> nodes, bool comments = false)
        {
            var result = new StringBuilder();
            GetHyper(result, nodes, 0, comments);
            return result.ToString();
        }

        #region [ -- Private helper methods -- ]

        /*
         * Creates Hyperlambda for the specified level for the given nodes and appends
         * the Hyperlambda into the specified StringBuilder.
         */
        static void GetHyper(
            StringBuilder builder,
            IEnumerable<Node> nodes,
            int level,
            bool comments)
        {
            foreach (var idx in nodes)
            {
                /*
                 * Serializing name into builder.
                 * Notice unless this returns true we don't try to append the value into the StringBuilder,
                 * which might happen if the node actually is supposed to be semantically persisted as a
                 * comment into the StringBuilder.
                 */
                if (AppendName(builder, idx, idx.Name, comments, level))
                    AppendValue(builder, idx); // Serializing value into builder, if any.

                // Adding Carriage Return, and serializing children, if any.
                builder.Append("\r\n");
                GetHyper(builder, idx.Children, level + 1, comments);
            }
        }

        /*
         * Appends the name for the specified node into the StringBuilder and returns true
         * if the caller should append the value of the node - Otherwise it returns false.
         */
        static bool AppendName(
            StringBuilder builder,
            Node node,
            string name,
            bool comments,
            int level)
        {
            if (comments && node.Name == ".." && node.Value is string)
            {
                // Appending comment.
                AppendComment(builder, node, level);
                return false;
            }
            else
            {
                // Indenting correctly.
                PrependSpacing(builder, level);

                // Checking if we need to escape the name, or wrap it in double quotes, etc.
                if (name.Contains("\n"))
                    name = "@\"" + name.Replace("\"", "\"\"") + "\"";
                else if (name.Contains("\"") ||
                    name.Contains(":") ||
                    name.StartsWith(" ") ||
                    name.EndsWith(" "))
                    name = "\"" + name.Replace("\"", "\\\"") + "\"";
                else if (node.Value == null && name == "")
                    name = @"""""";
                builder.Append(name);
                return true;
            }
        }

        /*
         * Appends a comment into the specified StringBuilder, where the comment is the value
         * of the specified Node.
         */
        static void AppendComment(StringBuilder builder, Node node, int level)
        {
            // Adding spacing for comment.
            builder.Append("\r\n");

            // Indenting correctly.
            PrependSpacing(builder, level);

            // Retrieving comment value.
            var value = node.Get<string>();

            // Checking comment type.
            var splits = value.Split(new string[] { "\r\n", "\n", "\r" }, System.StringSplitOptions.None);
            if (splits.Length == 1)
            {
                // Single line comment.
                builder.Append("// ").Append(value.Trim());
            }
            else
            {
                // Multi line comment.
                builder.Append("/*\r\n");
                foreach (var idxComment in splits)
                {
                    // Indenting correctly.
                    PrependSpacing(builder, level);
                    if (idxComment == " ")
                        builder
                            .Append(" * ")
                            .Append("\r\n");
                    else
                        builder
                            .Append(" * ")
                            .Append(idxComment)
                            .Append("\r\n");
                }

                // Closing comment.
                PrependSpacing(builder, level);
                builder.Append(" */");
            }
        }

        /*
         * Adds the correct number of SP characters into the specified StringBuilder for
         * the specified level.
         */
        static void PrependSpacing(StringBuilder builder, int level)
        {
            int idxLevel = level;
            while (idxLevel-- > 0)
                builder.Append("   ");
        }

        /*
         * Appends the value for the specified node into the specified StringBuilder.
         */
        static void AppendValue(StringBuilder builder, Node node)
        {
            if (node.Value != null)
            {
                // Converting type to string.
                var value = Converter.ToString(node.Value);
                builder.Append(":");

                // Checking if we need to provide an explicit type declaration.
                if (!string.IsNullOrEmpty(value.Item1) && value.Item1 != "string")
                    builder
                        .Append(value.Item1)
                        .Append(":"); // Persisting type declaration into StringBuilder
                if (value.Item1 == "node" && value.Item2 == "")
                    builder.Append(@"""""");
                else
                    builder.Append(CreateStringLiteral(value.Item2));
            }
        }

        /*
         * Creates a string literal from the specified content and returns to caller.
         */
        static string CreateStringLiteral(string content)
        {
            var builder = new StringBuilder(content.Length + 10);
            if (content.Contains("\r\n"))
            {
                builder.Append("@\"");
                foreach (var idx in content)
                {
                    switch (idx)
                    {
                        case '"':
                            builder.Append("\"\"");
                            break;

                        default:
                            builder.Append(idx);
                            break;
                    }
                }
                builder.Append("\"");
            }
            else
            {
                var hasControlChar = content.StartsWith(" ") || content.EndsWith(" ");
                foreach (var idx in content)
                {
                    switch (idx)
                    {
                        case '\n':
                            hasControlChar = true;
                            builder.Append("\\n");
                            break;

                        case '\r':
                            hasControlChar = true;
                            builder.Append("\\r");
                            break;

                        case '\t':
                            hasControlChar = true;
                            builder.Append("\\t");
                            break;

                        case '\\':
                            hasControlChar = true;
                            builder.Append("\\\\");
                            break;

                        case ':':
                            hasControlChar = true;
                            builder.Append(":");
                            break;

                        case '"':
                            hasControlChar = true;
                            builder.Append("\\\"");
                            break;

                        case '\'':
                            hasControlChar = true;
                            builder.Append("'");
                            break;

                        default:
                            builder.Append(idx);
                            break;
                    }
                }
                if (hasControlChar)
                {
                    builder.Insert(0, "\"");
                    builder.Append("\"");
                }
            }
            return builder.ToString();
        }

        #endregion
    }
}
