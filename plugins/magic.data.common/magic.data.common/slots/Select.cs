/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.signals.contracts;
using magic.data.common.helpers;
using magic.data.common.contracts;

namespace magic.data.common.slots
{
    /// <summary>
    /// [data.select] slot, for executing some SQL towards a database and returning a record result,
    /// according to your configuration settings.
    /// </summary>
    [Slot(
        Name = "data.select",
        Description = "Executes a query and returns rows from the current database connection",
        ValueKind = "sql-select",
        ValueDescription = "SQL query to execute",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "node-list",
        ReturnsElementKind = "row-object,lambda-tree",
        ReturnsDescription = "Resolves to query result rows as child nodes",
        RequiresScope = "data.connection",
        ScopeDescription = "Requires an open database connection created by [data.connect]",
        SignatureType = typeof(global::magic.data.common.signatures.DataSelectSignature))]
    public class Select : DataSlotBase
    {
        /// <summary>
        /// Creates a new instance of your type.
        /// </summary>
        /// <param name="settings">Configuration object.</param>
        public Select(IDataSettings settings)
            : base(".select", settings)
        { }
    }
}
