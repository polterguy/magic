/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

namespace magic.signals.contracts
{
    /// <summary>
    /// Describes how a documented child node should be interpreted.
    /// </summary>
    public enum SlotChildMode
    {
        None,
        Value,
        Expression,
        ValueOrExpression,
        ExecutableLambda,
        Arguments,
        SourceLambda,
        StructuredArguments,
        DynamicNamedValues,
    }
}
