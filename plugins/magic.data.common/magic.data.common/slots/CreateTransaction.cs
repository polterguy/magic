/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.signals.contracts;
using magic.data.common.helpers;
using magic.data.common.contracts;

namespace magic.data.common.slots
{
    /// <summary>
    /// [data.transaction.create] slot, for creating a database transaction,
    /// according to your configuration settings.
    /// </summary>
    [Slot(
        Name = "data.transaction.create",
        Description = "Creates a database transaction using the configured provider",
        ReturnsMode = SlotReturnsMode.None,
        RequiresScope = "data.connection",
        ScopeDescription = "Requires an open database connection created by [data.connect]",
        ProvidesScope = "data.transaction",
        ScopeRequiresStrictExit = true,
        SignatureType = typeof(global::magic.data.common.signatures.DataTransactionCreateSignature))]
    public class CreateTransaction : DataSlotBase
    {
        /// <summary>
        /// Creates a new instance of your type.
        /// </summary>
        /// <param name="settings">Configuration object.</param>
        public CreateTransaction(IDataSettings settings)
            : base(".transaction.create", settings)
        { }
    }
}
