/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.scheduler.signatures
{
    /// <summary>
    /// Signature helpers for scheduler slots.
    /// </summary>
    public abstract class SchedulerSignature : ISlotSignature
    {
        /// <inheritdoc />
        public abstract IEnumerable<SlotChild> Children { get; }

        /// <inheritdoc />
        // Declared on the base so derived classes can `override`. Without this
        // explicit declaration, derived properties only hide the interface's
        // default-interface-member when accessed via the class reference — code
        // that reads constraints through ISlotSignature gets the empty default.
        public virtual IEnumerable<SlotConstraint> Constraints => new List<SlotConstraint>();

        /// <inheritdoc />
        public virtual IEnumerable<SlotChild> OutputChildren => new List<SlotChild>();

        internal static SlotChild Option(string name, string type, string description, bool required = false, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = required,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = required ? SlotChildCardinality.ExactlyOne : SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }

        internal static SlotChild Lambda()
        {
            return new SlotChild
            {
                Name = ".lambda",
                Type = "lambda",
                Description = "Task body serialized and executed later",
                Required = true,
                Mode = SlotChildMode.ExecutableLambda,
                Cardinality = SlotChildCardinality.ExactlyOne,
                Role = SlotChildRole.LambdaBlock,
                Evaluation = SlotChildEvaluation.SerializeLambda,
                Projection = SlotChildProjection.Children,
            };
        }

        internal static SlotConstraint AtLeastOneSchedule()
        {
            var result = new SlotConstraint
            {
                Kind = SlotConstraintKind.AtLeastOneOf,
                Description = "At least one schedule source must be supplied",
            };
            result.Values.AddRange(["due", "repeats"]);
            return result;
        }
    }

    /// <summary>
    /// Signature for [tasks.create].
    /// </summary>
    public class CreateTaskSignature : SchedulerSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("description", "string", "Optional task description", kind: "task-description"),
            Option("due", "DateTime", "Optional one-time due date", kind: "date"),
            Option("repeats", "string", "Optional repeat pattern", kind: "task-repeat-pattern"),
            Lambda(),
        };
    }

    /// <summary>
    /// Signature for [tasks.schedule].
    /// </summary>
    public class ScheduleTaskSignature : SchedulerSignature
    {
        /// <inheritdoc />
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("due", "DateTime", "One-time due date", kind: "date"),
            Option("repeats", "string", "Repeat pattern", kind: "task-repeat-pattern"),
        };

        /// <inheritdoc />
        public override IEnumerable<SlotConstraint> Constraints => new[]
        {
            AtLeastOneSchedule(),
        };
    }

    /// <summary>
    /// Signature for [tasks.get].
    /// </summary>
    public class GetTaskSignature : SchedulerSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("schedules", "bool", "Whether to include schedules for the task"),
        };
    }

    /// <summary>
    /// Signature for [tasks.list].
    /// </summary>
    public class ListTasksSignature : SchedulerSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("offset", "long", "Number of tasks to skip"),
            Option("limit", "long", "Maximum number of tasks to return"),
        };

        /// <inheritdoc />
        public override IEnumerable<SlotChild> OutputChildren => new[]
        {
            new SlotChild
            {
                Name = ".",
                Type = "lambda",
                Kind = "task",
                Description = "One task record returned by [tasks.list]",
                Mode = SlotChildMode.Value,
                Cardinality = SlotChildCardinality.ZeroOrMore,
                Role = SlotChildRole.StructuredObject,
                Projection = SlotChildProjection.StructuredTree,
                Children =
                {
                    new SlotChild
                    {
                        Name = "id",
                        Type = "string",
                        Kind = "task-id",
                        Description = "Task identifier",
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ExactlyOne,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                    new SlotChild
                    {
                        Name = "created",
                        Type = "date",
                        Kind = "date",
                        Description = "Task creation timestamp",
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ExactlyOne,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                    new SlotChild
                    {
                        Name = "description",
                        Type = "string",
                        Kind = "text",
                        Description = "Optional task description",
                        Required = false,
                        Mode = SlotChildMode.Value,
                        Cardinality = SlotChildCardinality.ZeroOrOne,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                },
            },
        };
    }
}
