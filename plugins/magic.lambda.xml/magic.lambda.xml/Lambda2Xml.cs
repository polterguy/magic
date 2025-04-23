/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Xml;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.xml
{
    /// <summary>
    /// [lambda2xml] slot for transforming a piece of lambda to an XML snippet.
    /// </summary>
    [Slot(Name = "lambda2xml")]
    public class Lambda2Xml : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving document node.
            var docNode = GetNodes(input).Single();

            // Creating options.
            var options = new XmlWriterSettings();
            options.Indent = true;
            options.IndentChars = "  ";
            options.CloseOutput = true;
            options.OmitXmlDeclaration = true;
            options.NewLineChars = "\r\n";

            // Creating our stream to hold XML.
            using (var stream = new MemoryStream())
            {
                using (var writer = XmlWriter.Create(stream, options))
                {
                    WriteNode(docNode, writer);
                    writer.Flush();
                    stream.Position = 0;
                    using (var reader = new StreamReader(stream,new UTF8Encoding(false)))
                    {
                        input.Value = reader.ReadToEnd();
                    }
                }
            }

            // House cleaning
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        static void WriteNode(Node node, XmlWriter writer)
        {
            if (node.Name.StartsWith("@"))
            {
                writer.WriteAttributeString(node.Name.Substring(1), node.GetEx<string>());
            }
            else if (node.Name == "#text")
            {
                writer.WriteString(node.GetEx<string>());
            }
            else
            {
                writer.WriteStartElement(node.Name);
                foreach (var idx in node.Children)
                {
                    WriteNode(idx, writer);
                }
                writer.WriteEndElement();
            }
        }

        /*
         * Helper to retrieve execution nodes for slot.
         */
        IEnumerable<Node> GetNodes(Node input)
        {
            // Sanity checking invocation. Notice non [eval] keywords might have expressions and children.
            if (input.Value != null && input.Children.Any())
                throw new HyperlambdaException("[lambda2xml] cannot handle both expression values and children at the same time");

            // Children have precedence, in case invocation is from a non [eval] keyword.
            if (input.Children.Any())
                return input.Children;

            if (input.Value != null)
                return input.Evaluate();

            // Nothing to evaluate here.
            return Array.Empty<Node>();
        }

        #endregion
    }
}
