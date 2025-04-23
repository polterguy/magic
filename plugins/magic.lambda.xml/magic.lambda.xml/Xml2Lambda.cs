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
    [Slot(Name = "xml2lambda")]
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

            // Creating XML document by loading string content.
            var doc = new XmlDocument();
            doc.LoadXml(xml);

            // Creating result node and adding as child to input node.
            var result = new Node();
            ParseXmlNode(result, doc.DocumentElement);
            input.Add(result);
        }

        #region [ -- Private helper methods -- ]

        static void ParseXmlNode(Node resultNode, XmlNode xmlNode)
        {
            // Making sure we apply name of node.
            resultNode.Name = xmlNode.Name;

            // Checking if this is a simple "text node".
            if (xmlNode.Name == "#text")
            {
                // This is a "simple node", with no children, only HTML content
                resultNode.Value = HttpUtility.HtmlDecode(xmlNode.InnerText);
            }
            else
            {
                // Adding all attributes.
                if (xmlNode.Attributes != null)
                {
                    foreach (XmlAttribute idx in xmlNode.Attributes)
                    {
                        resultNode.Add(new Node("@" + idx.Name, HttpUtility.HtmlDecode(idx.Value)));
                    }
                }

                if (xmlNode.Name == "#cdata-section")
                {
                    resultNode.Value = ((XmlCDataSection)xmlNode).Data;
                    return;
                }

                // Then looping through each child HTML element
                foreach (XmlNode idxChild in xmlNode.ChildNodes)
                {
                    // We don't add comments or empty elements
                    if (idxChild.Name != "#comment")
                    {
                        if (idxChild.Name == "#text" && string.IsNullOrEmpty(idxChild.InnerText.Trim()))
                            continue;
                        resultNode.Add(new Node());
                        ParseXmlNode(resultNode.Children.Last(), idxChild);
                    }
                }
            }
        }

        #endregion
    }
}
