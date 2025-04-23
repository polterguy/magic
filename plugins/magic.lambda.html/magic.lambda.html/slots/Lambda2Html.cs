/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using HtmlAgilityPack;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.html.slots
{
    /// <summary>
    /// [lambda2html] slot for transforming a lambda object to its equivalent HTML string.
    /// </summary>
    [Slot(Name = "lambda2html")]
    public class Lambda2Html : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var srcNode = GetSourceNode(input);
            var htmlDoc = new HtmlDocument();
            var found = false;
            foreach (var idxSrc in srcNode.Children)
            {
                found = true;
                CreateElement(idxSrc, htmlDoc.DocumentNode, htmlDoc);
            }
            if (found)
                input.Value = htmlDoc.DocumentNode.OuterHtml;
            else
                input.Value = "";
        }

        #region [ -- Private helper methods -- ]

        /*
         * Creates an element according to specified node, and appends to currently iterated HTML node.
         */
        static void CreateElement(Node srcNode, HtmlNode html, HtmlDocument doc)
        {
            var cur = doc.CreateElement(srcNode.Name);
            foreach (var idx in srcNode.Children.Where(x => x.Name.StartsWith("@")))
            {
                cur.Attributes.Add(idx.Name.Substring(1), idx.GetEx<string>());
            }
            foreach (var idx in srcNode.Children.Where(x => !x.Name.StartsWith("@")))
            {
                if (idx.Name == "#text")
                    cur.AppendChild(doc.CreateTextNode(idx.GetEx<string>()));
                else
                    CreateElement(idx, cur, doc);
            }
            html.AppendChild(cur);
        }

        /*
         * Returns "source node" for [lambda2html] conversions.
         */
        static Node GetSourceNode(Node input)
        {
            // Figuring out what to convert.
            var result = new Node();
            if (input.Value != null)
                result.AddRange(input.Evaluate().Select(x => x.Clone()));
            else
                result.AddRange(input.Children.Select(x => x.Clone()));
            return result;
        }

        #endregion
    }
}
