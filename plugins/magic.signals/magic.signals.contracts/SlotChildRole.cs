/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

namespace magic.signals.contracts
{
    /// <summary>
    /// Semantic role a documented child node plays in a slot invocation.
    /// </summary>
    public enum SlotChildRole
    {
        None,
        Option,
        Condition,

        /// <summary>
        /// Independent operand — evaluated in sequence, no type relationship
        /// to sibling operands required. Used by short-circuit / fallback
        /// slots like [and], [or], [or-else] where each operand is its own
        /// boolean expression or value-producing branch.
        /// </summary>
        Operand,

        /// <summary>
        /// Type-coupled operand — sibling operands must produce values of
        /// COMPATIBLE TYPES because the slot COMBINES or COMPARES them as a
        /// unit. Used by:
        ///   - arithmetic ([math.add]/[math.subtract]/[math.multiply]/…)
        ///     where mixing numeric subtypes produces ambiguous results,
        ///   - relational comparators ([eq]/[neq]/[mt]/[mte]/[lt]/[lte])
        ///     where comparing mismatched types is a semantic error,
        ///   - reductions like [math.dot] where both operand vectors must
        ///     share an element type.
        /// The synthesizer captures the FIRST operand's resolved kind after
        /// emission and constrains subsequent siblings to producers whose
        /// primary kind matches — so e.g. `[mt] / .:x:@.id (int) / .:x:
        /// @some.text-producer` is prevented at pick time.
        /// </summary>
        OperandPaired,

        ExecutableBody,
        LambdaBlock,
        SourceExpression,
        SourceContainer,
        Arguments,
        Payload,
        StructuredObject,
        DynamicMap,
        Callback,
        Branch,
    }
}
