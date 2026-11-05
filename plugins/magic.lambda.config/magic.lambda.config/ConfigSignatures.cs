/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.config.signatures
{
    public class ConfigGetSignature : ISlotSignature
    {
        public IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "*",
                Type = "string",
                Kind = "config-default",
                Description = "Default value source evaluated and returned when the configuration key does not exist",
                Required = false,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.SourceExpression,
                Evaluation = SlotChildEvaluation.EvalSelf,
                Projection = SlotChildProjection.Value,
            },
        };
    }
}
