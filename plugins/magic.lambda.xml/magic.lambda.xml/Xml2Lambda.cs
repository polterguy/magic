/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Web;
using System.Xml;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.xml
{
    /// <summary>
    /// [xml2lambda] slot for transforming a piece of XML to a lambda hierarchy.
    /// </summary>
    [Slot(
        Name = "xml2lambda",
        Description = "Transforms XML into a lambda hierarchy",
        ValueKind = "xml",
        ValueDescription = "XML text to transform",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "xml-tree",
        ReturnsElementKind = "xml-element",
        ReturnsDescription = "Resolves to the parsed XML hierarchy as child nodes; attributes are emitted as @name child nodes, text as #text child nodes, and comments/whitespace-only text nodes are omitted")]
    public class Xml2Lambda : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Getting XML content.
            var xml = input.GetEx<string>();

            // House cleaning
            input.Value = null;
            input.Clear();

            /*
             * Creating XML document by loading string content.
             *
             * DTD processing is prohibited and the resolver is nulled, so a malicious
             * document cannot exhaust memory through internal entity expansion
             * ("billion laughs") or reach external resources (XXE). The slot only ever
             * needs to transform a plain XML tree into lambda, never a DTD.
             */
            var doc = new XmlDocument();
            var settings = new XmlReaderSettings
            {
                DtdProcessing = DtdProcessing.Prohibit,
                XmlResolver = null,
            };
            using (var reader = XmlReader.Create(new System.IO.StringReader(xml), settings))
            {
                doc.Load(reader);
            }

            // Creating result node and adding as child to input node.
            var result = new Node();
            ParseXmlNode(result, doc.DocumentElement);
            input.Add(result);
        }

        #region [ -- Private helper methods -- ]

        // Upper bound on element nesting, guarding against a stack overflow from a maliciously deep document.
        const int MaxDepth = 256;

        static void ParseXmlNode(Node resultNode, XmlNode xmlNode, int depth = 0)
        {
            if (depth > MaxDepth)
                throw new HyperlambdaException("XML document is nested too deeply");

            // Making sure we apply name of node.
            resultNode.Name = xmlNode.Name;

            // Checking if this is a simple "text node", with no children, only HTML content.
            if (xmlNode.Name == "#text")
            {
                resultNode.Value = HttpUtility.HtmlDecode(xmlNode.InnerText);
                return;
            }

            AddAttributes(resultNode, xmlNode);

            if (xmlNode.Name == "#cdata-section")
            {
                resultNode.Value = ((XmlCDataSection)xmlNode).Data;
                return;
            }

            // Then looping through each child HTML element
            foreach (XmlNode idxChild in xmlNode.ChildNodes)
            {
                if (IsIgnored(idxChild))
                    continue;
                resultNode.Add(new Node());
                ParseXmlNode(resultNode.Children.Last(), idxChild, depth + 1);
            }
        }

        static void AddAttributes(Node resultNode, XmlNode xmlNode)
        {
            if (xmlNode.Attributes == null)
                return;
            foreach (XmlAttribute idx in xmlNode.Attributes)
            {
                resultNode.Add(new Node("@" + idx.Name, HttpUtility.HtmlDecode(idx.Value)));
            }
        }

        // We don't add comments or empty elements.
        static bool IsIgnored(XmlNode xmlNode)
        {
            return xmlNode.Name == "#comment" ||
                (xmlNode.Name == "#text" && string.IsNullOrEmpty(xmlNode.InnerText.Trim()));
        }

        #endregion
    }
}
