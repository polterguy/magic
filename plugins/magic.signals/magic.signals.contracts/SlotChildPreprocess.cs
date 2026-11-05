/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

namespace magic.signals.contracts
{
    /// <summary>
    /// Describes preprocessing applied to child nodes before a slot consumes them.
    /// </summary>
    public enum SlotChildPreprocess
    {
        None,
        UnwrapExpressions,
    }
}
