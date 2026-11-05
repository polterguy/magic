/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.signals.contracts;
using magic.data.common.helpers;
using magic.data.common.contracts;

namespace magic.data.common.slots
{
    /// <summary>
    /// [data.transaction.commit] slot, for committing a database transaction,
    /// according to your configuration settings.
    /// </summary>
    [Slot(
        Name = "data.transaction.commit",
        Description = "Commits the current database transaction using the configured provider",
        ReturnsMode = SlotReturnsMode.None,
        RequiresScope = "data.transaction",
        ScopeDescription = "Requires an active database transaction created by [data.transaction.create]",
        SignatureType = typeof(global::magic.data.common.signatures.DataTransactionSignature))]
    public class CommitTransaction : DataSlotBase
    {
        /// <summary>
        /// Creates a new instance of your type.
        /// </summary>
        /// <param name="settings">Configuration object.</param>
        public CommitTransaction(IDataSettings settings)
            : base(".transaction.commit", settings)
        { }
    }
}
