/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.http.signatures
{
    /// <summary>
    /// Child signature for HTTP slots.
    /// </summary>
    public abstract class HttpSignature : ISlotSignature
    {
        /// <inheritdoc />
        public abstract IEnumerable<SlotChild> Children { get; }

        /// <inheritdoc />
        public virtual IEnumerable<SlotConstraint> Constraints => new SlotConstraint[0];

        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> OutputChildren => new[]
        {
            // [content] (the payload) is declared FIRST so wiring prefers the body over [headers] when a
            // consumer matches both (the synthesizer enumerates output children in declaration order).
            new SlotChild
            {
                Name = "content",
                Type = "string|byte[]|lambda",
                Kind = "http-response-content,lambda-tree,text",
                Description = "HTTP response body; text responses are returned as string, binary responses as byte[], and converted known content types as child nodes when [convert] is true",
                Required = false,
                Mode = SlotChildMode.Value,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Payload,
                Projection = SlotChildProjection.Self,
            },
            new SlotChild
            {
                Name = "headers",
                Type = "lambda",
                Kind = "http-header-list",
                Description = "HTTP response headers returned by the server",
                Required = false,
                Mode = SlotChildMode.Value,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.StructuredTree,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "string",
                        Kind = "http-header-value",
                        Description = "HTTP response header value; child name is the header name",
                        Required = false,
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ZeroOrMore,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                },
            },
        };

        internal static SlotChild Option(string name, string type, string description, string defaultValue = null, string kind = null)
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

        internal static SlotChild DynamicMap(string name, string description)
        {
            var childDescription = name switch
            {
                "query" => "Query parameter value",
                "url-params" => "URL placeholder replacement value",
                "headers" => "HTTP header value",
                _ => "Named value",
            };
            var childKind = name switch
            {
                "query" => "query-parameter-value",
                "url-params" => "url-parameter-value",
                "headers" => "http-header-value",
                _ => null,
            };
            var kind = name switch
            {
                "query" => "query-parameter-list",
                "url-params" => "url-parameter-list",
                "headers" => "http-header-list",
                _ => null,
            };
            return new SlotChild
            {
                Name = name,
                Type = "lambda",
                Kind = kind,
                Description = description,
                Required = false,
                Mode = SlotChildMode.DynamicNamedValues,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.DynamicMap,
                Projection = SlotChildProjection.StructuredTree,
                // [url-params] children are NOT independent — their names
                // must match the `{token}` placeholders in the parent slot's
                // url-template Input value. Mark the link so tooling derives
                // child names from the parsed URL rather than picking from a
                // generic catalog.
                LinkedToValueKind = name == "url-params" ? "url-template" : null,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = "string",
                        Kind = childKind,
                        Description = childDescription,
                        Required = false,
                        Mode = SlotChildMode.ValueOrExpression,
                        Cardinality = SlotChildCardinality.ZeroOrMore,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                        // Header-name → catalog dispatch lives in rules.yaml
                        // under `dispatch-rules:` (target-kind:
                        // http-header-value). The synth picks it up by Kind
                        // at child-emit time — no schema-side declaration
                        // needed here. Query and URL-params children share
                        // this schema but use different Kind tags
                        // (`query-parameter-value`, `url-parameter-value`)
                        // which have no dispatch ruleset, so they fall
                        // through to the generic catalog draw, same as
                        // before.
                    },
                },
            };
        }

        internal static SlotChild Sse()
        {
            // The HTTP client (MagicHttp.cs) reads the response body one line
            // at a time, builds [.arguments] = { [message]: "<line text>" },
            // inserts it as the first child of a clone of [.sse], and evals.
            // Declaring Arguments here surfaces @.arguments/message inside
            // the body for the synthesizer's path enumeration — slot
            // consumers wire it the same way [for-each] body slots wire
            // @.dp/#/<col>. The runtime contract and the schema agree.
            var result = new SlotChild
            {
                Name = ".sse",
                Type = "lambda",
                Kind = "sse-callback",
                Description = "Callback executed once per server-sent event line; receives the line in [.arguments/message]",
                Required = false,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Callback,
                Evaluation = SlotChildEvaluation.EvalBlock,
                Projection = SlotChildProjection.Self,
            };
            result.Arguments.Add(new SlotChild
            {
                Name = "message",
                Type = "string",
                Kind = "sse-message,text-line,text",
                Description = "One server-sent event line as delivered by the HTTP stream reader",
                Mode = SlotChildMode.Value,
                Cardinality = SlotChildCardinality.ExactlyOne,
                Role = SlotChildRole.Payload,
                Projection = SlotChildProjection.Value,
            });
            return result;
        }

        internal static IEnumerable<SlotChild> Common()
        {
            return new[]
            {
                DynamicMap("query", "Query string parameters"),
                DynamicMap("url-params", "Named replacements for {placeholders} in the URL"),
                DynamicMap("headers", "HTTP request headers"),
                Option("token", "string", "Bearer token to add as Authorization header", kind: "bearer-token"),
                Option("timeout", "int", "Request timeout in seconds", kind: "timeout-seconds"),
                Option("convert", "bool", "Whether to convert known response content types to lambda", "false", "boolean"),
                Sse(),
            };
        }
    }

    /// <summary>
    /// Child signature for HTTP GET and DELETE slots.
    /// </summary>
    public class HttpEmptyRequestSignature : HttpSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => Common();
    }

    /// <summary>
    /// Child signature for HTTP POST, PUT, and PATCH slots.
    /// </summary>
    public class HttpPayloadRequestSignature : HttpSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children
        {
            get
            {
                var result = new List<SlotChild>(Common())
                {
                    // 'text' added: a request [payload] can be a plain-text body (Content-Type: text/plain, custom protocols, raw POST bodies). Any `text` producer (lambda2hyper, format, strings result, log entry) is a legitimate payload source. Structured payloads still match `http-request-payload` for the transform path.
                    new SlotChild
                    {
                        Name = "payload",
                        Type = "object|lambda",
                        Kind = "http-request-payload,text",
                        Description = "Request payload value or structured payload transformed according to Content-Type",
                        Required = false,
                        Mode = SlotChildMode.SourceLambda,
                        Cardinality = SlotChildCardinality.ZeroOrOne,
                        Role = SlotChildRole.Payload,
                        Evaluation = SlotChildEvaluation.UnwrapDescendants,
                        Projection = SlotChildProjection.StructuredTree,
                    },
                    Option("filename", "string", "File path to stream as the request payload", kind: "file-path"),
                };
                return result;
            }
        }

        /// <inheritdoc />
        public override IEnumerable<SlotConstraint> Constraints
        {
            get
            {
                var result = new SlotConstraint
                {
                    Kind = SlotConstraintKind.ExactlyOneOf,
                    Description = "Provide exactly one of [payload] or [filename] as the request body source",
                };
                result.Values.Add("payload");
                result.Values.Add("filename");
                return new[] { result };
            }
        }
    }
}
