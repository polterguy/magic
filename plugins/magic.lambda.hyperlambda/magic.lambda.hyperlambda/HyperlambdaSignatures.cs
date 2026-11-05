/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.hyperlambda.signatures
{
    public class Hyper2LambdaSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            Option("comments", "bool", "Whether parser comment nodes should be preserved as [..] nodes with the comment text as value", "false"),
        };

        internal static SlotChild Option(string name, string type, string description, string defaultValue)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
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

    public class Lambda2HyperSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            Hyper2LambdaSignature.Option("comments", "bool", "Whether generated Hyperlambda should include comments", "false"),
        };
    }
}
