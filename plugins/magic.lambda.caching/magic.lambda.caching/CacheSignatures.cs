/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.caching.signatures
{
    /// <summary>
    /// Shared cache child signature helpers.
    /// </summary>
    public abstract class CacheSignature : ISlotSignature
    {
        /// <inheritdoc />
        public abstract IEnumerable<SlotChild> Children { get; }

        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> OutputChildren => new List<SlotChild>();

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
    }

    /// <summary>
    /// Signature for [cache.set].
    /// </summary>
    public class CacheSetSignature : CacheSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            // 'text' added: cache values are arbitrary application strings (session blobs, computed text, serialized payloads) — any `text` producer should be wirable as the stored value. `cache-value` stays first for catalog selection.
            Option("value", "string", "Value to store; omitted or null removes the cached item", kind: "cache-value,text"),
            Option("expiration", "long", "Expiration in seconds", "5", "duration-seconds"),
        };
    }

    /// <summary>
    /// Signature for [cache.try-get].
    /// </summary>
    public class CacheTryGetSignature : CacheSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("expiration", "long", "Expiration in seconds for newly created value", "5", "duration-seconds"),
            new SlotChild
            {
                Name = ".lambda",
                Type = "lambda",
                Description = "Callback executed to create the cached value when the key is missing",
                Required = true,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ExactlyOne,
                Role = SlotChildRole.Callback,
                Evaluation = SlotChildEvaluation.EvalBlock,
                Projection = SlotChildProjection.Value,
            },
        };
    }

    /// <summary>
    /// Signature for cache list/count/clear filter arguments.
    /// </summary>
    public class CacheFilterSignature : CacheSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("filter", "string", "Optional cache key filter", kind: "cache-key"),
        };
    }

    /// <summary>
    /// Signature for [cache.list].
    /// </summary>
    public class CacheListSignature : CacheSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("offset", "int", "Result offset", "0"),
            Option("limit", "int", "Maximum number of items to return", "10"),
        };

        /// <inheritdoc />
        public override IEnumerable<SlotChild> OutputChildren => new[]
        {
            new SlotChild
            {
                Name = ".",
                Type = "lambda",
                Kind = "cache-entry",
                Description = "One cached item; children carry the cache [key] and stored [value]",
                Mode = SlotChildMode.Value,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.StructuredTree,
                Children =
                {
                    new SlotChild
                    {
                        Name = "key",
                        Type = "string",
                        Kind = "cache-key",
                        Description = "Cached item key",
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ExactlyOne,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                    new SlotChild
                    {
                        Name = "value",
                        Type = "string",
                        Kind = "cache-value",
                        Description = "Cached item value",
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ExactlyOne,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                },
            },
        };
    }
}
