/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.xml.signatures
{
    public class Lambda2XmlSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "lambda",
                Description = "Nodes to convert, used when the slot has no value",
                Required = false,
                Mode = SlotChildMode.SourceLambda,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.Payload,
                Projection = SlotChildProjection.Self,
            },
        };
    }
}
