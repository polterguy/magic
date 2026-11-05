/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

namespace magic.signals.contracts
{
    /// <summary>
    /// Kind of structural constraint applying to a slot or child signature.
    /// </summary>
    public enum SlotConstraintKind
    {
        None,
        ParentMustBe,
        PreviousSiblingMustBeOneOf,
        NextSiblingMayBeOneOf,
        /// <summary>
        /// At least one node named by Values must follow this slot as a sibling.
        /// Used for slots whose semantics require a paired structural neighbour
        /// (e.g. [try] needs [.catch] and/or [.finally] to be meaningful).
        /// </summary>
        NextSiblingMustBeOneOf,
        OnlyChildren,
        ExactlyOneOf,
        AtLeastOneOf,
        AtMostOneOf,
        Requires,
        Excludes,
    }
}
