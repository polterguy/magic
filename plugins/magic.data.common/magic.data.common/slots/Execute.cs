/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
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
    [Slot(
        Name = "data.execute",
        Description = "Executes SQL against the current database connection",
        ValueKind = "sql-execute",
        ValueDescription = "SQL statement to execute",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of rows affected by the SQL statement",
        RequiresScope = "data.connection",
        ScopeDescription = "Requires an open database connection created by [data.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DataExecuteSignature))]
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
