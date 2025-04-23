/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;

namespace magic.data.common.builders
{
    /// <summary>
    /// Common base class for SQL generators requiring a where clause.
    /// </summary>
    public abstract class SqlWhereBuilder : SqlBuilder
    {
        /*
         * These are the default built in comparison operators, resolving to a function that
         * is responsible for handling a particular comparison operators for you.
         */
        readonly static Dictionary<string, Action<StringBuilder, Node, Node, string, DateTimeKind>> _comparisonOperators = CreateDefaultComparisonOperators();

        /// <summary>
        /// Creates a new SQL builder.
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        /// <param name="escapeChar">Escape character to use for escaping table names etc.</param>
        /// <param name="kind">Kind of date to convert date to if date is specified in another kind</param>
        protected SqlWhereBuilder(Node node, string escapeChar, DateTimeKind kind = DateTimeKind.Unspecified)
            : base(node, escapeChar, kind)
        { }

        #region [ -- Public static methods -- ]

        /// <summary>
        /// Adds a new comparison operator into the comparison operator resolver,
        /// allowing you to use a custom comparison operator, resolving to some function,
        /// responsible for injecting SQL into your resulting SQL somehow.
        /// </summary>
        /// <param name="key">Key for your operator.</param>
        /// <param name="functor">Function to invoke once comparison operator is encountered.</param>
        public static void AddComparisonOperator(
            string key,
            Action<StringBuilder, Node, Node, string, DateTimeKind> functor)
        {
            _comparisonOperators[key] = functor;
        }

        /// <summary>
        /// Appends arguments into builder if args is not null, and references argument
        /// in SQL - Otherwise assuming we are to append the value of the colummn node
        /// as the right hand side of the comparison, which might be true for joins
        /// for instance.
        /// </summary>
        /// <param name="args">Arguments node, if this is null, no arguments will be appended into args node.</param>
        /// <param name="colNode">Column node, containing actual comparison condition.</param>
        /// <param name="builder">Where to append the resulting SQL.</param>
        /// <param name="escapeChar">Escape character for table names.</param>
        /// <param name="kind">Default DateTimeKind to apply unless explicitly given.</param>
        static public void AppendArgs(
            Node args,
            Node colNode,
            StringBuilder builder,
            string escapeChar,
            DateTimeKind kind)
        {
            if (args == null)
            {
                // Checking if this is an explicit argument, added by caller explicitly.
                var rhsValue = colNode.GetEx<string>();
                if (rhsValue.StartsWith("@", StringComparison.InvariantCulture))
                {
                    builder.Append(rhsValue);
                }
                else
                {
                    // No args node given, and argument is not an arg, assuming direct comparison.
                    var rhs = string.Join(
                        ".",
                        rhsValue
                            .Split('.')
                            .Select(x => EscapeColumnName(x, escapeChar)));
                    builder.Append(rhs);
                }
            }
            else
            {
                // Plain argument, referencing it in SQL, and adding to args collection.
                var argNo = args.Children.Count(x => x.Name.StartsWith("@") && x.Name.Skip(1).First() != 'v');
                var argName = "@" + argNo;
                builder.Append(argName);
                var val = colNode.GetEx<object>();
                if (kind != DateTimeKind.Unspecified && val is DateTime dateVal && dateVal.Kind != kind)
                    val = kind == DateTimeKind.Local ? dateVal.ToLocalTime() : dateVal.ToUniversalTime();
                args.Add(new Node(argName, val));
            }
        }

        #endregion

        #region [ -- Protected helper methods and properties -- ]

        /// <summary>
        /// Builds the 'where' parts of the SQL statement.
        /// </summary>
        /// <param name="builder">String builder to put the results into.</param>
        /// <param name="args">Where to put arguments created during parsing.</param>
        protected virtual void AppendWhere(StringBuilder builder, Node args)
        {
            // Finding where node, if any, and doing some basic sanity checking.
            var where = Root.Children.SingleOrDefault(x => x.Name == "where");

            if (where == null || !where.Children.Any() || !where.Children.Any(x => x.Children.Any()))
                return; // Non existing [where], empty [where], or empty [and] or [or] collection inside [where].

            // Appending actual "where" parts into SQL.
            builder.Append(" where ");
            AppendBooleanLevel(where, args, builder);
        }

        /// <summary>
        /// Iterates through all children of specified node, and building one [or]/[and]
        /// level for each of its children.
        /// </summary>
        /// <param name="args">Where to append arguments, if requested by caller. Notice,
        /// the args node might be null in cases we are for instance invoking this method for
        /// a [join] invocation.</param>
        /// <param name="builder">Where to append SQL.</param>
        /// <param name="conditionLevel">Where node for current level.</param>
        protected void AppendBooleanLevel(
            Node conditionLevel,
            Node args,
            StringBuilder builder)
        {
            /*
             * Recursively looping through each level, and appending its parts
             * as a "name/value" collection, making sure we add each value as an
             * SQL parameter.
             */
            foreach (var idx in conditionLevel.Children)
            {
                switch (idx.Name)
                {
                    case "or":
                    case "and":
                        BuildWhereLevel(
                            args,
                            builder,
                            idx,
                            false /* No outer most level paranthesis */);
                        break;

                    default:
                        throw new HyperlambdaException($"I don't understand '{idx.Name}' as a boolean operator, only [or] and [and] at this level");
                }
            }
        }

        #endregion

        #region [ -- Private helper methods -- ]

        /*
         * Building one "where level" (within one set of paranthesis),
         * and recursivelu adding a new level for each "and" and "or"
         * parts we can find in our level.
         */
        void BuildWhereLevel(
            Node args,
            StringBuilder builder,
            Node booleanNode,
            bool paranthesis = true)
        {
            if (paranthesis && booleanNode.Children.Any())
                builder.Append("(");

            var no = 0;
            foreach (var idx in booleanNode.Children)
            {
                if (no++ > 0)
                    builder.Append(" " + booleanNode.Name + " ");

                switch (idx.Name)
                {
                    case "and":
                    case "or":

                        // Recursively invoking self.
                        BuildWhereLevel(
                            args,
                            builder,
                            idx);
                        break;

                    default:

                        CreateCondition(
                            args,
                            builder,
                            idx);
                        break;
                }
            }

            if (paranthesis && booleanNode.Children.Any())
                builder.Append(")");
        }

        /*
         * Creates a single condition for a where clause.
         */
        void CreateCondition(
            Node args,
            StringBuilder builder,
            Node comparison)
        {
            // Field comparison of some sort.
            var columnName = comparison.Name;
            if (columnName.StartsWith("\\"))
            {
                // Allowing for escaped column names, to suppor columns containing "." as a part of their names.
                columnName = EscapeColumnName(columnName.Substring(1));
            }
            else if (columnName.Contains("."))
            {
                // Possibly an operator, hence checking operator dictionary for a match.
                var entities = columnName.Split('.');
                var keyword = entities.Last();
                if (_comparisonOperators.ContainsKey(keyword))
                {
                    columnName = string.Join(
                        ".",
                        entities
                            .Take(entities.Count() - 1)
                            .Select(x => EscapeColumnName(x)));
                    builder.Append(columnName);
                    _comparisonOperators[keyword](builder, args, comparison, EscapeChar, Kind);
                    return;
                }

                // Checking if last entity is escaped.
                var tmp = new List<string>();
                if (keyword.StartsWith("\\"))
                {
                    keyword = keyword.Substring(1);
                    tmp.AddRange(entities.Take(entities.Count() - 1));
                    tmp.Add(keyword);
                    entities = tmp.ToArray();
                }
                columnName = string.Join(
                    ".",
                    entities.Select(x => EscapeColumnName(x)));
            }
            else
            {
                columnName = EscapeColumnName(columnName);
            }

            // This is the default logic to apply, if no operators was specified.
            if (comparison.Value == null)
            {
                builder.Append(columnName).Append(" is null");
            }
            else
            {
                builder.Append(columnName).Append(" = ");
                AppendArgs(args, comparison, builder, EscapeChar, Kind);
            }
        }

        /*
         * Helper method to escape column names in static methods.
         */
        static string EscapeColumnName(string column, string escapeChar)
        {
            return escapeChar + 
                column.Replace(escapeChar, escapeChar + escapeChar) +
                escapeChar;
        }

        /*
         * Creates our default built in comparison operators.
         */
        static Dictionary<string, Action<StringBuilder, Node, Node, string, DateTimeKind>> CreateDefaultComparisonOperators()
        {
            var result = new Dictionary<string, Action<StringBuilder, Node, Node, string, DateTimeKind>>();

            // Plain default comparison operators.
            foreach (var idx in new (string, string) [] {
                ("eq", "="),
                ("neq", "!="),
                ("mt", ">"),
                ("mteq", ">="),
                ("lt", "<"),
                ("lteq", "<="),
                ("like", "like"),
                ("ilike", "ilike")})
            {
                result[idx.Item1] = (builder, args, colNode, escapeChar, kind) => {
                    if (colNode.Value == null)
                    {
                        switch (idx.Item2)
                        {
                            case "=":
                                builder.Append(" is null");
                                break;

                            case "!=":
                                builder.Append(" is not null");
                                break;

                            case "like":
                                builder.Append(" like '%'");
                                break;

                            case "ilike":
                                builder.Append(" ilike '%'");
                                break;

                            default:
                                throw new HyperlambdaException($"{idx.Item2} is an unsupported comparison operator for null value");
                        }
                    }
                    else
                    {
                        builder.Append($" {idx.Item2} ");
                        AppendArgs(args, colNode, builder, escapeChar, kind);
                    }
                };
            }

            // Special case for "in" comparison operator.
            result["in"] = (builder, args, colNode, escapeChar, kind) => {
                builder.Append(" in (");
                var argNo = args.Children.Count(x => x.Name.StartsWith("@") && x.Name.Skip(1).First() != 'v');
                builder.Append(string.Join(",", colNode.Children.Select(x =>
                {
                    args.Add(new Node("@" + argNo, x.GetEx<object>()));
                    return "@" + argNo++;
                }))).Append(")");
            };
            return result;
        }

        #endregion
    }
}
