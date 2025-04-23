/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using HtmlAgilityPack;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.html.slots.helpers;

namespace magic.lambda.html.slots
{
    /// <summary>
    /// [html2markdown] slot for transforming a piece of HTML to Markdown.
    /// </summary>
    [Slot(Name = "html2markdown")]
    public class Html2Markdown : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Getting HTML.
            var html = input.GetEx<string>();

            // Loading HTML document.
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // Figuring out document URL.
            var url = input.Children.FirstOrDefault(x => x.Name == "url")?.GetEx<string>();

            // Figuring out settings we should apply.
            var images = input.Children.FirstOrDefault(x => x.Name == "images")?.GetEx<bool>() ?? true;
            var code = input.Children.FirstOrDefault(x => x.Name == "code")?.GetEx<bool>() ?? true;
            var lists = input.Children.FirstOrDefault(x => x.Name == "lists")?.GetEx<bool>() ?? true;

            // House cleaning.
            input.Clear();

            // Parsing document creating our Markdown.
            var parser = new Html2MarkdownParser(
                doc,
                url,
                input,
                images,
                code,
                lists);

            // Returning result to caller.
            input.Value = parser.Markdown()?.Replace("{{", "\\{\\{").Replace("}}", "\\}\\}");
        }
    }
}
