/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Web;
using System.Linq;
using System.Text;
using System.Globalization;
using System.Collections.Generic;
using HtmlAgilityPack;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.html.slots.helpers
{
    /// <summary>
    /// Helper class to create Markdown from HTML documents and snippets.
    /// </summary>
    public class Html2MarkdownParser
    {
        readonly HtmlDocument _doc;
        readonly string _url;
        readonly Node _input;
        readonly (string DocBaseUrl, string DocUrl) _baseUrl;
        readonly bool _images;
        readonly bool _code;
        readonly bool _lists;

        /*
         * Node handlers responsible for handling first recursive occurrency of element with specified name.
         */
        readonly static Dictionary<string, Func<Html2MarkdownParser, HtmlNode, (string DocBaseUrl, string DocUrl), StringBuilder, bool>> _handlers = new()
        {
            {"h1", (self, node, baseUrl, builder)           =>   HeaderElementHandler(self, node, baseUrl, builder, "# ")},
            {"h2", (self, node, baseUrl, builder)           =>   HeaderElementHandler(self, node, baseUrl, builder, "## ")},
            {"h3", (self, node, baseUrl, builder)           =>   HeaderElementHandler(self, node, baseUrl, builder, "### ")},
            {"h4", (self, node, baseUrl, builder)           =>   HeaderElementHandler(self, node, baseUrl, builder, "#### ")},
            {"h5", (self, node, baseUrl, builder)           =>   HeaderElementHandler(self, node, baseUrl, builder, "##### ")},
            {"h6", (self, node, baseUrl, builder)           =>   HeaderElementHandler(self, node, baseUrl, builder, "###### ")},

            {"p", (self, node, baseUrl, builder)            =>   BlockElementHandler(self, node, baseUrl, builder)},
            {"blockquote", (self, node, baseUrl, builder)   =>   BlockElementHandler(self, node, baseUrl, builder, "> ")},

            {"i", (self, node, baseUrl, builder)            =>   InlineElementHandler(self, node, baseUrl, builder, "*")},
            {"em", (self, node, baseUrl, builder)           =>   InlineElementHandler(self, node, baseUrl, builder, "*")},
            {"b", (self, node, baseUrl, builder)            =>   InlineElementHandler(self, node, baseUrl, builder, "**")},
            {"strong", (self, node, baseUrl, builder)       =>   InlineElementHandler(self, node, baseUrl, builder, "**")},

            {"ul", (self, node, baseUrl, builder)           =>
            {
                if (self._lists)
                    return NewSectionElementHandler(self, node, baseUrl, builder);
                return false;
            }},

            {"ol", (self, node, baseUrl, builder)           =>
            {
                if (self._lists)
                    return NewSectionElementHandler(self, node, baseUrl, builder);
                return false;
            }},
            {"li", (self, node, baseUrl, builder)           =>
            {
                if (self._lists)
                    return ListItemElementHandler(self, node, baseUrl, builder);
                return true;
            }},

            {"pre", (self, node, baseUrl, builder)          =>
            {
                if (self._code)
                    return CodeElementHandler(self, node, baseUrl, builder);
                return false;
            }},
            {"code", (self, node, baseUrl, builder)         =>
            {
                if (self._code)
                    return InlineElementHandler(self, node, baseUrl, builder, "`");
                return false;
            }},

            {"section", DivElementHandler},
            {"main", DivElementHandler},
            {"article", DivElementHandler},
            {"navbar", DivElementHandler},

            {"img", (self, node, baseUrl, builder)          =>
            {
                if (self._images)
                    return ImgElementHandler(self, node, baseUrl, builder);
                return false;
            }},
            {"a", AnchorElementHandler},

            {"div", DivElementHandler},
            {"span", DivElementHandler},

            {"head", HeadElementHandler},
        };

        /// <summary>
        /// Creates an instance of your class.
        /// </summary>
        /// <param name="doc">HtmlDocument fromHTMLAgility Pack to convert.</param>
        /// <param name="url">Optional URL where document was fetched. Used to resolve relative URLs.</param>
        /// <param name="input">Node where we should put meta information, such as title and description.</param>
        /// <param name="images">If true will import images.</param>
        /// <param name="code">If true will import code.</param>
        /// <param name="lists">If true will import lists.</param>
        public Html2MarkdownParser(
            HtmlDocument doc,
            string url,
            Node input,
            bool images,
            bool code,
            bool lists)
        {
            _doc = doc ?? throw new NullReferenceException(nameof(doc));
            _url = url ?? "";
            _input = input;
            _baseUrl = GetDocUrls(_doc, url);
            _images = images;
            _code = code;
            _lists = lists;
            if (!string.IsNullOrEmpty(_url))
                _input.Add(new Node("url", _url));
        }


        /// <summary>
        /// Converts the HtmlDocument specified in CTOR to Markdown.
        /// </summary>
        public string Markdown()
        {
            var builder = new StringBuilder();
            ParseNode(builder, _doc.DocumentNode);
            return builder.ToString().Trim();
        }

        #region [ -- Private helper methods -- ]

        /*
         * Parses the specified document HTML node and renders it into the specified StringBuilder.
         */
        void ParseNode(StringBuilder builder, HtmlNode htmlNode)
        {
            // Defaulting continuing to since we might not have a handler.
            var cont = true;

            // Checking if we've got a handler for currently specified HTML node.
            if (_handlers.TryGetValue(htmlNode.Name, out var handler))
                cont = handler(this, htmlNode, _baseUrl, builder);

            // Checking if handler wants us to recursively traverse children nodes.
            if (cont)
            {
                // Iterating through each children and recursively calling self.
                foreach (var idxChild in htmlNode.ChildNodes)
                {
                    ParseNode(builder, idxChild);
                }
            }
        }

        #region [ HTML element handlers ]

        /*
         * Generic block level HTML element handler.
         */
        static bool BlockElementHandler(
            Html2MarkdownParser self,
            HtmlNode htmlNode,
            (string DocBaseUrl, string DocUrl) baseUrl,
            StringBuilder builder,
            string prefix = null)
        {
            // Rendering children.
            var tmpBuilder = new StringBuilder();
            self.RenderChildren(htmlNode, tmpBuilder, baseUrl);

            // Making sure something was rendered.
            var content = TrimText(tmpBuilder.ToString());
            if (!string.IsNullOrEmpty(content))
            {
                EnsureDoubleNewLine(builder);
                if (!string.IsNullOrEmpty(prefix))
                    builder.Append(prefix);
                builder.Append(content);
                EnsureDoubleNewLine(builder);
            }
            return false;
        }

        /*
         * Inline level HTML element handler.
         */
        static bool InlineElementHandler(
            Html2MarkdownParser self,
            HtmlNode htmlNode,
            (string DocBaseUrl, string DocUrl) baseUrl,
            StringBuilder builder,
            string wrapper = null)
        {
            // Rendering children.
            var tmpBuilder = new StringBuilder();
            self.RenderChildren(htmlNode, tmpBuilder, baseUrl);

            // Making sure something was rendered.
            var content = TrimText(tmpBuilder.ToString());
            if (!string.IsNullOrEmpty(content))
            {
                EnsureSpace(builder);
                if (!string.IsNullOrEmpty(wrapper))
                {
                    builder
                        .Append(wrapper)
                        .Append(content)
                        .Append(wrapper);
                }
                else
                {
                    builder.Append(content);
                }
            }
            return false;
        }

        /*
         * DIV HTML element handler.
         */
        static bool DivElementHandler(
            Html2MarkdownParser self,
            HtmlNode htmlNode,
            (string DocBaseUrl, string DocUrl) baseUrl,
            StringBuilder builder)
        {
            var oldLength = builder.Length;
            foreach (var idxChild in htmlNode.ChildNodes)
            {
                switch (idxChild.Name)
                {
                    case "#text":
                        var txt = HttpUtility.HtmlDecode(TrimText(idxChild.InnerText));
                        if (!string.IsNullOrEmpty(txt))
                        {
                            EnsureSpace(builder);
                            builder.Append(txt);
                        }
                        break;

                    default:

                        // Recursively handling children.
                        self.ParseNode(builder, idxChild);
                        break;
                }
            }
            if (builder.Length > oldLength)
                EnsureDoubleNewLine(builder);
            return false;
        }

        /*
         * UL/OL HTML element handler.
         */
        static bool NewSectionElementHandler(
            Html2MarkdownParser self,
            HtmlNode htmlNode,
            (string DocBaseUrl, string DocUrl) baseUrl,
            StringBuilder builder)
        {
            EnsureDoubleNewLine(builder);
            return true;
        }

        /*
         * PRE HTML element handler.
         */
        static bool CodeElementHandler(
            Html2MarkdownParser self,
            HtmlNode htmlNode,
            (string DocBaseUrl, string DocUrl) baseUrl,
            StringBuilder builder)
        {
            EnsureDoubleNewLine(builder);
            builder.Append("```\r\n");
            var first = true;
            foreach(var idxChild in htmlNode.Descendants().Where(x => x.Name == "#text"))
            {
                if (first)
                {
                    builder.Append(HttpUtility.HtmlDecode(TrimText(idxChild.InnerText.TrimStart(), false)));
                    first = false;
                }
                else
                {
                    builder.Append(HttpUtility.HtmlDecode(TrimText(idxChild.InnerText, false)));
                }
            }
            EnsureSingleNewLine(builder);
            builder.Append("```\r\n\r\n");
            return false;
        }

        /*
         * HEAD HTML element handler.
         */
        static bool HeadElementHandler(
            Html2MarkdownParser self,
            HtmlNode htmlNode,
            (string DocBaseUrl, string DocUrl) baseUrl,
            StringBuilder builder)
        {
            foreach(var idx in htmlNode.Descendants().Where(x => x.Name == "title" || x.Name == "meta"))
            {
                if (idx.Name == "meta")
                {
                    var name = idx.GetAttributeValue("name", idx.GetAttributeValue("property", string.Empty));
                    if (!string.IsNullOrEmpty(name))
                    {
                        var content = TrimText(idx.GetAttributeValue("content", string.Empty));
                        if (!string.IsNullOrEmpty(content))
                            self._input.Add(new Node(name, content));
                    }
                }
                else if (idx.Name == "title")
                {
                    self._input.Add(new Node(idx.Name, HttpUtility.HtmlDecode(TrimText(idx.InnerText))));
                }
            }
            return false;
        }

        /*
         * LI HTML element handler.
         */
        static bool ListItemElementHandler(
            Html2MarkdownParser self,
            HtmlNode htmlNode,
            (string DocBaseUrl, string DocUrl) baseUrl,
            StringBuilder builder)
        {
            // Rendering children.
            var tmpBuilder = new StringBuilder();
            self.RenderChildren(htmlNode, tmpBuilder, baseUrl);

            // Making sure something was rendered.
            var content = TrimText(tmpBuilder.ToString());
            if (!string.IsNullOrEmpty(content))
            {
                EnsureSingleNewLine(builder);
                builder
                    .Append("* ")
                    .Append(content)
                    .Append("\r\n");
                return false; // If list item contains text content we don't traverse inwards.
            }
            return true; // If list item does not contain text we traverse inwards.
        }

        /*
         * Hx HTML element handler.
         */
        static bool HeaderElementHandler(
            Html2MarkdownParser self,
            HtmlNode htmlNode,
            (string DocBaseUrl, string DocUrl) baseUrl,
            StringBuilder builder,
            string prefix)
        {
            // Rendering children.
            var txt = string.Join(" ", htmlNode.Descendants().Where(x => x.Name == "#text").Select(x => HttpUtility.HtmlDecode(TrimText(x.InnerText))));

            // Making sure something was rendered.
            var content = TrimText(txt);
            if (!string.IsNullOrEmpty(content))
            {
                EnsureDoubleNewLine(builder);
                builder.Append(prefix);
                builder.Append(content);
                EnsureDoubleNewLine(builder);
            }
            return false;
        }

        /*
         * Image HTML element handler.
         */
        static bool ImgElementHandler(
            Html2MarkdownParser self,
            HtmlNode htmlNode,
            (string DocBaseUrl, string DocUrl) baseUrl,
            StringBuilder builder)
        {
            var srcAtr = htmlNode.GetAttributeValue("src", "");
            if (!string.IsNullOrEmpty(srcAtr) && !srcAtr.StartsWith("data:"))
            {
                EnsureSpace(builder);
                var altAtr = htmlNode.GetAttributeValue("alt", "Image");
                if (string.IsNullOrEmpty(altAtr))
                    altAtr = "Image";
                builder
                    .Append("![")
                    .Append(altAtr.Replace("(", "\\(").Replace(")", "\\)").Replace("[", "\\[").Replace("]", "\\]"))
                    .Append("](")
                    .Append(self.NormalizeUrl(srcAtr, false, baseUrl)?.Replace("(", "\\(").Replace(")", "\\)").Replace("[", "\\[").Replace("]", "\\]"))
                    .Append(')');
            }
            return false;
        }

        /*
         * Anchor (hyperlink) HTML element handler.
         */
        static bool AnchorElementHandler(
            Html2MarkdownParser self,
            HtmlNode htmlNode,
            (string DocBaseUrl, string DocUrl) baseUrl,
            StringBuilder builder)
        {
            var hrefAtr = htmlNode.GetAttributeValue("href", "");
            if (!string.IsNullOrEmpty(hrefAtr) && !hrefAtr.StartsWith("javascript:") && hrefAtr != "#")
            {
                EnsureSpace(builder);
                builder.Append('[');
                var hasRenderedTxt = false;
                var hasRenderedImage = false;
                var oldLength = builder.Length;
                foreach (var idx in htmlNode.Descendants())
                {
                    switch (idx.Name)
                    {
                        case "#text":
                            if (!hasRenderedImage)
                            {
                                var txt = HttpUtility.HtmlDecode(TrimText(idx.InnerText));
                                if (!string.IsNullOrEmpty(txt))
                                {
                                    if (hasRenderedTxt)
                                        builder
                                            .Append(" ")
                                            .Append(txt);
                                    else
                                        builder.Append(txt);
                                    hasRenderedTxt = true;
                                }
                            }
                            break;

                        case "img":
                            if (self._images && !hasRenderedTxt && !hasRenderedImage)
                            {
                                hasRenderedImage = true;
                                ImgElementHandler(self, idx, baseUrl, builder);
                            }
                            break;
                    }
                }
                if (oldLength == builder.Length)
                    builder.Append("link");
                builder
                    .Append("](")
                    .Append(self.NormalizeUrl(hrefAtr, true, baseUrl))
                    .Append(')');
            }
            return false;
        }

        #endregion

        /*
         * Ensures a single SP character is appended if it makes sense to do so.
         */
        static void EnsureSpace(StringBuilder builder)
        {
            if (builder.Length == 0)
                return;
            var lastChar = builder.ToString(builder.Length - 1, 1);
            if (lastChar == "[")
                return;
            if (lastChar != "\n")
                builder.Append(' ');
        }

        /*
         * Ensures two CR/LF sequences are appended if it makes sense to do so.
         */
        static void EnsureDoubleNewLine(StringBuilder builder)
        {
            if (builder.Length == 0)
                return;

            if (builder.Length > 3)
            {
                if (builder.ToString(builder.Length  - 4, 4) != "\r\n\r\n")
                {
                    if (builder.ToString(builder.Length - 2, 2) == "\r\n")
                        builder.Append("\r\n");
                    else
                        builder.Append("\r\n\r\n");
                }
            }
            else
            {
                builder.Append("\r\n\r\n");
            }
        }

        /*
         * Ensures one CR/LF sequence is appended if it makes sense to do so.
         */
        static void EnsureSingleNewLine(StringBuilder builder)
        {
            if (builder.Length == 0)
                return;

            if (builder.Length > 1)
            {
                if (builder.ToString(builder.Length  - 2, 2) != "\r\n")
                    builder.Append("\r\n");
            }
            else
            {
                builder.Append("\r\n");
            }
        }

        /*
         * Iterates through all children elements of specified HtmlNode.
         */
        void RenderChildren(
            HtmlNode htmlNode,
            StringBuilder builder,
            (string DocBaseUrl, string DocUrl) baseUrl)
        {
            foreach (var idxChild in htmlNode.ChildNodes)
            {
                switch (idxChild.Name)
                {
                    case "#text":
                        var txt = HttpUtility.HtmlDecode(idxChild.InnerText.Trim());
                        if (!string.IsNullOrEmpty(txt))
                        {
                            if (builder.Length > 0)
                                builder.Append(' ');
                            builder.Append(TrimText(txt));
                        }
                        break;

                    case "b":
                    case "strong":
                        RenderElement(idxChild, builder, "**");
                        break;

                    case "i":
                    case "em":
                        RenderElement(idxChild, builder, "*");
                        break;

                    case "section":
                    case "nav":
                    case "span":
                    case "p":
                    case "div":
                        RenderElement(idxChild, builder);
                        break;

                    case "img":
                        if (_images)
                            ImgElementHandler(this, idxChild, baseUrl, builder);
                        break;

                    case "a":
                        AnchorElementHandler(this, idxChild, baseUrl, builder);
                        break;
                }
            }
        }

        /*
         * Renders a single text element by recursively rendering children,
         * optionally with wrapper character(s) surrounding it.
         */
        void RenderElement(
            HtmlNode htmlNode,
            StringBuilder builder,
            string wrapper = null)
        {
            // Rendering element.
            var tmpBuilder = new StringBuilder();
            RenderChildren(htmlNode, tmpBuilder, _baseUrl);

            // Making sure element has content.
            var result = tmpBuilder.ToString();
            if (!string.IsNullOrEmpty(result))
            {
                if (string.IsNullOrEmpty(wrapper))
                {
                    builder
                        .Append(' ')
                        .Append(TrimText(result));
                }
                else
                {
                    builder
                        .Append(' ')
                        .Append(wrapper)
                        .Append(TrimText(result))
                        .Append(wrapper);
                }
            }
        }

        /*
         * Extracts the base element tag, in addition to the document URL, and normalizes
         * these such that we can use them later when handling relative URLs.
         */
        static (string DocBaseUrl, string DocUrl) GetDocUrls(HtmlDocument doc, string url)
        {
            // Finding base tag, if existing.
            var baseUrl = doc
                .DocumentNode
                .Descendants()
                .FirstOrDefault(x => x.Name == "base")?
                .GetAttributeValue("href", string.Empty);

            // Defaulting to empty URL.
            url = url ?? "";

            // Removing # parts.
            if (url?.IndexOf('#') != -1)
                url = url.Substring(0, url.IndexOf('#'));

            // Returning result to caller.
            return (baseUrl, url);
        }

        /*
         * Normalizes a URL that's supposed to be added to the Markdown document.
         *
         * Notice, we might not have a document URL here, if caller transforms just some random Markdown,
         * so we try to accommodate for a lot more cases then the RFC for URLs in HTML documents.
         */
        string NormalizeUrl(
            string url,
            bool addUrl,
            (string DocBaseUrl, string DocUrl) baseUrl)
        {
            // Decode HTML entities & trim whitespace
            url = url.Replace("&amp;", "&").Trim();
            url = url.Replace(" ", "%20");

            // Local helper method to ensure we add URL if we're supposed to.
            string ensureUrl(string curUrl)
            {
                if (addUrl)
                {
                    var idxOfHash = curUrl.IndexOf('#');
                    if (idxOfHash != -1)
                        curUrl = curUrl.Substring(0, idxOfHash);
                    var urlsNode = _input.Children.FirstOrDefault(x => x.Name == "urls");
                    if (urlsNode == null)
                    {
                        urlsNode = new Node("urls");
                        _input.Add(urlsNode);
                    }
                    if (!curUrl.StartsWith("mailto:") && !curUrl.StartsWith("tel:") && !urlsNode.Children.Any(x => x.Get<string>() == curUrl))
                        urlsNode.Add(new Node(".", curUrl));
                }
                if (curUrl == "")
                    curUrl = "/";
                return curUrl;
            }

            // Early return for absolute URLs and special schemes
            if (url.StartsWith("http://") || url.StartsWith("https://") ||
                url.StartsWith("mailto:") || url.StartsWith("tel:"))
                return ensureUrl(url.Replace(" ", ""));

            // Determine the base URL: Prefer DocBaseUrl, fallback to DocUrl if necessary
            string baseUriString = !string.IsNullOrEmpty(baseUrl.DocBaseUrl) ? baseUrl.DocBaseUrl : baseUrl.DocUrl;

            // Handle protocol-relative URLs by prepending the scheme of the base URL
            if (url.StartsWith("//"))
            {
                if (string.IsNullOrEmpty(baseUriString))
                {
                    var tmp = "https:" + url;
                    return ensureUrl(tmp);
                }

                // Extract the scheme from baseUriString
                var baseUri = new Uri(baseUriString);
                var res = $"{baseUri.Scheme}:{url}";
                return ensureUrl(res);
            }

            // If baseUriString is not set, there's not much we can do to resolve a relative URL
            if (string.IsNullOrEmpty(baseUriString))
                return ensureUrl(url);

            // Use Uri class to resolve relative URLs against the base URL
            try
            {
                var baseUri = new Uri(baseUriString);
                var resolvedUri = new Uri(baseUri, url).ToString();
                return ensureUrl(resolvedUri);
            }
            catch (UriFormatException)
            {
                // In case of a UriFormatException, return the original URL.
                return ensureUrl(url);
            }
        }

        /*
         * Normalizes text, trimming, and replacing double spaces, etc.
         */
        static string TrimText(string text, bool trimSpaces = true)
        {
            if (trimSpaces)
            {
                text = text.Trim();
                text = text.Replace("\n", " ");
                text = text.Replace("\r", " ");
                text = text.Replace("\t", " ");
                while (text.Contains("  ", StringComparison.InvariantCulture))
                {
                    text = text.Replace("  ", " ", true, CultureInfo.InvariantCulture);
                }
                text = text.Replace(" ,", ",");
                text = text.Replace(" .", ".");
            }
            text = text.Replace("&nbsp;", " ");
            text = text.Replace("&gt;", ">");
            text = text.Replace("&lt;", "<");
            text = text.Replace("&amp;", "&");
            return text;
        }

        #endregion
    }
}
