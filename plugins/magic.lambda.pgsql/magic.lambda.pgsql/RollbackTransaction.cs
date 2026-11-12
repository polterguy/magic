/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;

namespace magic.lambda.pgsql
{
    /// <summary>
    /// [pgsql.transaction.rollback] slot for rolling back the top level MySQL
    /// database transaction.
    /// </summary>
    [Slot(
        Name = "pgsql.transaction.rollback",
        Description = "Rolls back the current PostgreSQL transaction",
        ReturnsMode = SlotReturnsMode.None,
        RequiresScope = "pgsql.transaction",
        ScopeDescription = "Requires an active PostgreSQL transaction created by [pgsql.transaction.create]",
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
            signaler.Peek<Transaction>("pgsql.transaction").Rollback();
        }
    }
}
