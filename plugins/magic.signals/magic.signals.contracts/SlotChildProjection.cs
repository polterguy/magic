/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

namespace magic.signals.contracts
{
    /// <summary>
    /// Describes which part of a child node is consumed after optional evaluation.
    /// </summary>
    public enum SlotChildProjection
    {
        None,
        Self,
        Value,
        Children,
        ChildrenOfChildren,
        FirstChildValue,
        ArgumentBag,
        StructuredTree,
        ReturnedResult,
    }
}
