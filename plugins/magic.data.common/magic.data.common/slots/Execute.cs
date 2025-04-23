/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.signals.contracts;
using magic.data.common.helpers;
using magic.data.common.contracts;

namespace magic.data.common.slots
{
    /// <summary>
    /// [data.execute] slot, for executing some SQL towards a database,
    /// according to your configuration settings.
    /// </summary>
    [Slot(Name = "data.execute")]
    public class Execute : DataSlotBase
    {
        /// <summary>
        /// Creates a new instance of your type.
        /// </summary>
        /// <param name="settings">Configuration for your application.</param>
        public Execute(IDataSettings settings)
            : base(".execute", settings)
        { }
    }
}
