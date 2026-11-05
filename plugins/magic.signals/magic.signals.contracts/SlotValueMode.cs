/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

namespace magic.signals.contracts
{
    /// <summary>
    /// Describes how a slot's input value argument should be interpreted.
    /// </summary>
    public enum SlotValueMode
    {
        /// <summary>
        /// Slot does not document any input value argument.
        /// </summary>
        None,

        /// <summary>
        /// Input should be interpreted as a literal value.
        /// </summary>
        Value,

        /// <summary>
        /// Input should be interpreted as an expression.
        /// </summary>
        Expression,

        /// <summary>
        /// Input may be either a literal value or an expression.
        /// </summary>
        ValueOrExpression,
    }
}
