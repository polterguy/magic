/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Web;
using HtmlAgilityPack;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.html.slots
{
    /// <summary>
    /// [html2lambda] slot for transforming a piece of HTML to a lambda hierarchy.
    /// </summary>
    [Slot(Name = "html2lambda")]
    public class Html2Lambda : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var html = input.GetEx<string>();
            input.Value = null;
            var doc = new HtmlDocument ();
            doc.LoadHtml (html);
            ParseHtmlDocument(input, doc.DocumentNode);
        }

        #region [ -- Private helper methods -- ]

        static Html2Lambda ()
        {
            // Making sure "form" element conforms to relational DOM structure
            HtmlNode.ElementsFlags.Remove ("form");
        }

        static void ParseHtmlDocument(Node resultNode, HtmlNode htmlNode)
        {
            // Skipping document node
            if (htmlNode.Name != "#document")
            {
                // Adding all attributes
                resultNode.AddRange(
                    htmlNode.Attributes
                        .Select(ix => new Node("@" + ix.Name, HttpUtility.HtmlDecode(ix.Value))));

                // Then the name of HTML element
                resultNode.Name = htmlNode.Name;
                if (htmlNode.Name == "#text")
                {
                    // This is a "simple node", with no children, only HTML content
                    resultNode.Value = HttpUtility.HtmlDecode(htmlNode.InnerText);
                }
            }

            // Then looping through each child HTML element
            foreach (var idxChild in htmlNode.ChildNodes)
            {
                // We don't add comments or empty elements
                if (idxChild.Name != "#comment")
                {
                    if (idxChild.Name == "#text" && string.IsNullOrEmpty(idxChild.InnerText.Trim()))
                        continue;
                    resultNode.Add(new Node());
                    ParseHtmlDocument(resultNode.Children.Last(), idxChild);
                }
            }
        }

        #endregion
    }
}
