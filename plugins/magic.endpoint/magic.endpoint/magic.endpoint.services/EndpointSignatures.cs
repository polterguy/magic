/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.endpoint.services.signatures
{
    public abstract class EndpointSignature : ISlotSignature
    {
        public virtual IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();

        protected static SlotChild Option(string name, string type, string description, bool required = false, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = required,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = required ? SlotChildCardinality.ExactlyOne : SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }
    }

    public class ResponseHeadersSetSignature : EndpointSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "string",
                Kind = "http-response-header-value",
                Description = "Response header name and value",
                Required = true,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.OneOrMore,
                Role = SlotChildRole.DynamicMap,
                Projection = SlotChildProjection.Value,
                // Header-name → catalog dispatch lives in rules.yaml under
                // `dispatch-rules:` (target-kind: http-response-header-
                // value). The synth picks it up by Kind at child-emit time
                // — no schema-side declaration needed here.
            },
        };
    }

    public class ResponseCookieSetSignature : EndpointSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            // 'text' added: a cookie [value] is arbitrary text content (session ids, user tokens, serialized state, free-form strings) — any `text` producer should be wirable. `cookie-value` stays first for catalog selection.
            Option("value", "string", "Cookie value", true, "cookie-value,text"),
            Option("expires", "DateTime", "Cookie expiration"),
            Option("http-only", "bool", "Whether the cookie is HTTP-only"),
            Option("secure", "bool", "Whether the cookie is secure"),
            Option("domain", "string", "Cookie domain", kind: "cookie-domain"),
            Option("path", "string", "Cookie path", kind: "cookie-path"),
            Option("same-site", "string", "Cookie SameSite mode: Strict, Lax, None, or Unspecified", kind: "cookie-same-site"),
        };
    }

    public class MimeAddSignature : EndpointSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = ".",
                Type = "string",
                Kind = "mime-type",
                Description = "MIME type value for the extension/key",
                Required = true,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ExactlyOne,
                Role = SlotChildRole.SourceExpression,
                Evaluation = SlotChildEvaluation.EvalSelf,
                Projection = SlotChildProjection.Value,
            },
        };
    }

    public class IpVersionSignature : EndpointSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("version", "string", "IP version to return, either ipv4 or ipv6", kind: "ip-version"),
        };
    }
}
