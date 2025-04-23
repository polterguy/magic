/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Markdig;
using Markdig.Syntax;
using Markdig.Extensions.Yaml;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.html.slots
{
    /// <summary>
    /// [markdown2html] slot for transforming a piece of Markdown to an HTML snippet.
    /// </summary>
    [Slot(Name = "markdown2html")]
    public class Markdown2Html : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Creating our builder.
            var builder = new MarkdownPipelineBuilder()
                .ConfigureNewLine("\r\n")
                .UseAdvancedExtensions()
                .UseYamlFrontMatter();
            var media = input.Children.FirstOrDefault(x => x.Name == "media");
            if (media != null)
                builder = builder.UseMediaLinks();

            // Creating our pipeline
            var pipeline = builder.Build();

            // Clearing children nodes.
            input.Clear();

            // Parsing our Markdown creating our HTML.
            var context = new MarkdownParserContext();
            var markdown = input.GetEx<string>();
            var parsed = Markdown.Parse(markdown, pipeline, context);
            input.Value = parsed.ToHtml(pipeline);

            // Checking if document has front matter block.
            var block = parsed
                .Descendants<YamlFrontMatterBlock>()
                .FirstOrDefault();
            if (block != null)
            {
                // Retrieving YAML from frontmatter parts.
                var yaml = block
                    .Lines
                    .Lines
                    .OrderByDescending(x => x.Line)
                    .Select(x => $"{x}\n")
                    .ToList()
                    .Select(x => x.Replace("---", string.Empty))
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Aggregate((s, agg) => agg + s);

                // Forwarding to [yaml2lambda] slot.
                var yamlNode = new Node("", yaml);
                signaler.Signal("yaml2lambda", yamlNode);

                // Adding result of [yaml2lambda] invocation to input node.
                input.AddRange(yamlNode.Children);
            }
        }
    }
}
