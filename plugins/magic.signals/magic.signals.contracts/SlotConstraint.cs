/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Collections.Generic;

namespace magic.signals.contracts
{
    /// <summary>
    /// Machine-readable structural constraint for a slot or child signature.
    /// </summary>
    public class SlotConstraint
    {
        /// <summary>
        /// Constraint kind.
        /// </summary>
        public SlotConstraintKind Kind { get; set; }

        /// <summary>
        /// Optional child or sibling name the constraint applies to.
        /// </summary>
        public string Target { get; set; }

        /// <summary>
        /// Optional human-readable description of the constraint.
        /// </summary>
        public string Description { get; set; }

        /// <summary>
        /// Names used by the constraint.
        /// </summary>
        public List<string> Values { get; } = new List<string>();

        /// <summary>
        /// Optional regex pattern that the slot's value must match for the constraint to apply.
        /// When null or empty the constraint applies unconditionally. Lets a single slot describe
        /// value-dependent shapes (e.g. [mime.create] with leaf-vs-multipart child structure).
        /// </summary>
        public string ValuePattern { get; set; }

        /// <summary>
        /// Optional regex pattern that the parent node's NAME must match for the constraint to apply.
        /// When null or empty the constraint applies unconditionally (with respect to name). Lets a
        /// schema gate child emission on the parent's literal name — useful when the operator or
        /// modifier is encoded in the name itself (e.g. SQL column conditions like `id.eq`, `status.in`
        /// where only `.in` should permit a value-list child set).
        /// Combined with <see cref="ValuePattern"/> via logical AND when both are set.
        /// </summary>
        public string NamePattern { get; set; }
    }
}
