/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.auth.signatures
{
    /// <summary>
    /// Signature for [auth.ticket.create].
    /// </summary>
    public class CreateTicketSignature : ISlotSignature
    {
        /// <inheritdoc />
        public IEnumerable<SlotChild> Children => new[]
        {
            Option("username", "string", "Username to put in the ticket", true, "username"),
            List("roles", "string", "Roles to put in the ticket"),
            Map("claims", "string", "Claims to put in the ticket"),
            Option("expires", "DateTime", "Absolute UTC expiration time"),
            Option("duration", "long", "Relative expiration duration in minutes"),
            Option("private-key", "string", "RSA private key as PEM, or DER as base64 or byte[], signing the ticket with RS256 instead of HS256 using the auth secret", false, "rsa-private-key"),
        };

        /// <inheritdoc />
        public IEnumerable<SlotConstraint> Constraints
        {
            get
            {
                var result = new SlotConstraint
                {
                    Kind = SlotConstraintKind.AtMostOneOf,
                    Description = "Use either absolute [expires] or relative [duration]",
                };
                result.Values.AddRange(["expires", "duration"]);
                return new[] { result };
            }
        }

        internal static SlotChild Option(string name, string type, string description, bool required = false, string kind = null)
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

        internal static SlotChild List(string name, string type, string description)
        {
            var kind = name == "roles" ? "role-list" : null;
            return new SlotChild
            {
                Name = name,
                Type = "lambda",
                Kind = kind,
                Description = description,
                Required = false,
                Mode = SlotChildMode.StructuredArguments,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.Children,
                Children =
                {
                    new SlotChild
                    {
                        Name = "*",
                        Type = type,
                        Kind = name == "roles" ? "role" : null,
                        Description = "List item",
                        Required = false,
                        Mode = SlotChildMode.ValueOrExpression,
                        Cardinality = SlotChildCardinality.ZeroOrMore,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                },
            };
        }

        internal static SlotChild Map(string name, string type, string description)
        {
            var result = List(name, type, description);
            result.Role = SlotChildRole.DynamicMap;
            result.Children[0].Description = "Named map entry";
            result.Children[0].Kind = name == "claims" ? "jwt-claim" : result.Children[0].Kind;
            return result;
        }
    }

    /// <summary>
    /// Signature for [auth.ticket.refresh].
    /// </summary>
    public class RefreshTicketSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            CreateTicketSignature.Option("expires", "DateTime", "Absolute UTC expiration time"),
            CreateTicketSignature.Option("duration", "long", "Relative expiration duration in minutes"),
        };

        public IEnumerable<SlotConstraint> Constraints
        {
            get
            {
                var result = new SlotConstraint
                {
                    Kind = SlotConstraintKind.AtMostOneOf,
                    Description = "Use either absolute [expires] or relative [duration]",
                };
                result.Values.AddRange(["expires", "duration"]);
                return new[] { result };
            }
        }
    }

    /// <summary>
    /// Signature for [auth.token.read].
    /// </summary>
    public class ReadTokenSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            CreateTicketSignature.Option("roles", "string", "Comma-separated roles required by the token", true, "role"),
            CreateTicketSignature.Option("public-key", "string", "RSA public key as PEM, or DER as base64 or byte[], accepting only RS256 tokens signed by its private half instead of HS256 tokens signed with the auth secret", false, "rsa-public-key"),
        };
    }

    /// <summary>
    /// Signature for [auth.jwks].
    /// </summary>
    public class JwksSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "public-key",
                Type = "string",
                Kind = "rsa-public-key",
                Description = "RSA public key as PEM, or DER as base64 or byte[], to include in the key set, repeat for multiple keys",
                Required = true,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.OneOrMore,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            },
        };
    }

    /// <summary>
    /// Signature for [auth.token.verify].
    /// </summary>
    public class VerifyTokenSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            CreateTicketSignature.Option("token", "string", "External JWT token to verify", true, "jwt"),
            CreateTicketSignature.Option("issuer", "string", "Trusted issuer the token's issuer must equal; meta data is never fetched from issuers not supplied by the caller"),
            CreateTicketSignature.List("issuers", "string", "Trusted issuers, the token's issuer must equal one of them; meta data is never fetched from issuers not supplied by the caller"),
        };
    }
}
