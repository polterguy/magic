/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;

namespace magic.lambda.mysql
{
    /// <summary>
    /// [mssql.transaction.rollback] slot for rolling back the top level MS SQL
    /// database transaction.
    /// </summary>
    [Slot(
        Name = "mssql.transaction.rollback",
        Description = "Rolls back the current SQL Server transaction",
        ReturnsMode = SlotReturnsMode.None,
        RequiresScope = "mssql.transaction",
        ScopeDescription = "Requires an active SQL Server transaction created by [mssql.transaction.create]",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
    public class RollbackTransaction : ISlot
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            signaler.Peek<Transaction>("mssql.transaction").Rollback();
        }
    }
}
