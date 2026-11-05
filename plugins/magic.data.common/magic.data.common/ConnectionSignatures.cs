/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.data.common.signatures
{
    public class DbConnectSignature : ISlotSignature
    {
        public virtual IEnumerable<SlotChild> Children => new[]
        {
            Body(),
        };

        protected static SlotChild Body()
        {
            return new SlotChild
            {
                Name = "*",
                Type = "lambda",
                Description = "Executable child slot evaluated while the database connection is open",
                Required = false,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.ExecutableBody,
                Evaluation = SlotChildEvaluation.EvalSelf,
                Projection = SlotChildProjection.Self,
            };
        }
    }

    public class DataConnectSignature : DbConnectSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            new SlotChild
            {
                Name = "database-type",
                Type = "string",
                Kind = "database-type",
                Description = "Database adapter to use instead of the configured default",
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            },
            Body(),
        };
    }
}
