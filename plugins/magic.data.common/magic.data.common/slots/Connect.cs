/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using magic.signals.contracts;
using magic.data.common.helpers;
using magic.data.common.contracts;

namespace magic.data.common.slots
{
    /// <summary>
    /// [data.connect] slot, for connecting to a database instance,
    /// according to your configuration settings.
    /// </summary>
    [Slot(
        Name = "data.connect",
        Description = "Opens a database connection using the configured provider",
        ValueKind = "database-name,connection-string",
        ValueDescription = "Optional DATABASE_NAME or [CONNECTION_STRING|DATABASE_NAME] override",
        ValueRequired = false,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        ProvidesScope = "data.connection",
        ScopeDescription = "Creates an open database connection scope for data.* slots",
        SignatureType = typeof(global::magic.data.common.signatures.DataConnectSignature))]
    public class Connect : DataSlotBase
    {
        /// <summary>
        /// Creates a new instance of your type.
        /// </summary>
        /// <param name="settings">Configuration object.</param>
        public Connect(IDataSettings settings)
            : base(".connect", settings)
        { }
    }
}
