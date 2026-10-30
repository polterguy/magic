/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.html.signatures
{
    public abstract class HtmlSignature : ISlotSignature
    {
        public virtual IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();

        protected static SlotChild Option(string name, string type, string description, string defaultValue = null, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = false,
                DefaultValue = defaultValue,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }
    }

    public class Html2MarkdownSignature : HtmlSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("url", "string", "Base URL used when resolving links", kind: "url"),
            Option("images", "bool", "Whether images should be emitted", "true"),
            Option("code", "bool", "Whether code blocks should be emitted", "true"),
            Option("lists", "bool", "Whether lists should be emitted", "true"),
        };
    }

    public class Markdown2HtmlSignature : HtmlSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("media", "bool", "Whether media link extensions should be enabled"),
        };
    }

    public class Lambda2HtmlSignature : HtmlSignature
    { }
}
