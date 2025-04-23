/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.signals.contracts;
using magic.data.common.helpers;

namespace magic.lambda.sqlite
{
    /// <summary>
    /// [sqlite.transaction.commit] slot for committing the top level MySQL
    /// database transaction.
    /// </summary>
    [Slot(Name = "sqlite.transaction.commit")]
    public class CommitTransaction : ISlot
    {
        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            using (var shutdownLock = new ShutdownLock())
            {
                signaler.Peek<Transaction>("sqlite.transaction").Commit();
            }
        }
    }
}
