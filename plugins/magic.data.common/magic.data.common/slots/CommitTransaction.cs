/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
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
    [Slot(Name = "data.transaction.commit")]
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
