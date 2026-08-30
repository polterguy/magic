/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using magic.node;
using magic.node.extensions;

namespace magic.data.common.builders
{
    /// <summary>
    /// Specialised select SQL builder, to create a select SQL statement by semantically traversing an input node.
    /// </summary>
    public class SqlReadBuilder : SqlWhereBuilder
    {
        /*
         * White list of allowed aggregate function expressions, on the form 'fun(col)',
         * 'fun(distinct col)', 'fun(col1 * col2)' or 'cast(fun(col) as type)', where 'fun' is one
         * of the explicitly allowed function names, and operands are constrained to letters,
         * digits, underscore and dot - or a lone '*' - making sure no SQL injection can occur
         * through aggregate expressions. Arithmetic operands deliberately exclude '*' inside
         * identifiers such that '/*' can never form a comment sequence.
         */
        const string _aggregateCall =
            @"(?<fun>count|sum|avg|min|max|group_concat|string_agg)\s*\(\s*(?<distinct>distinct\s+)?(?<args>\*|[A-Za-z0-9_.]+(\s*[-+*/]\s*[A-Za-z0-9_.]+)*)\s*\)";
        readonly static Regex _aggregateFunction = new Regex(
            $"^{_aggregateCall}$",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /*
         * The 'cast(fun(col) as type)' variant, matched separately from the plain call such that the
         * two never share capture group names, and the type name is captured on its own.
         */
        readonly static Regex _castedAggregate = new Regex(
            $@"^cast\s*\(\s*{_aggregateCall}\s+as\s+(?<type>[A-Za-z0-9_]+)\s*\)$",
            RegexOptions.IgnoreCase | RegexOptions.Compiled);

        /*
         * Splits an aggregate's argument list on its arithmetic operators, keeping the operators
         * themselves as elements, such that operands land on the even indexes and can be escaped
         * individually while the operators are passed through verbatim.
         */
        readonly static Regex _arithmeticOperator = new Regex(
            @"(\s*[-+*/]\s*)",
            RegexOptions.Compiled);

        /*
         * White list of allowed table and join alias names, constraining aliases to plain
         * identifiers, making sure no SQL injection can occur through [as] arguments.
         */
        readonly static Regex _aliasName = new Regex(
            @"^[A-Za-z0-9_]+$",
            RegexOptions.Compiled);

        /// <summary>
        /// Creates a select SQL statement
        /// </summary>
        /// <param name="node">Root node to generate your SQL from.</param>
        /// <param name="escapeChar">Escape character to use for escaping table names etc.</param>
        /// <param name="kind">Kind of date to convert date to if date is specified in another kind</param>
        public SqlReadBuilder(Node node, string escapeChar, DateTimeKind kind = DateTimeKind.Unspecified)
            : base(node, escapeChar, kind)
        { }

        /// <summary>
        /// Builds your select SQL statement, and returns a structured SQL statement, plus any parameters.
        /// </summary>
        /// <returns>Node containing insert SQL as root node, and parameters as children.</returns>
        public override Node Build()
        {
            /*
             * Retrieving all explicitly added arguments.
             */
            var explicitArgs = Root.Children
                .Where(x => x.Name.StartsWith("@", StringComparison.InvariantCulture)).ToList();

            // Return value.
            var result = new Node("sql");

            // Adding all explicitly added arguments.
            result.AddRange(explicitArgs);

            // Starting build process.
            var builder = new StringBuilder();
            builder.Append("select ");
            AppendDistinct(builder);
            AppendColumns(builder);
            builder.Append(" from ");
            AppendTableName(builder);
            AppendWhere(builder, result);
            AppendTail(builder);

            // Returning result to caller.
            result.Value = builder.ToString();
            return result;
        }

        #region [ -- Protected, overridden, and virtual methods -- ]

        /// <inheritdoc />
        protected override void AppendTableName(StringBuilder builder)
        {
            if (!Root.Children.Any(x => x.Name == "table"))
                throw new HyperlambdaException($"No [table] argument supplied to {GetType().FullName}");

            var first = true;
            foreach (var idx in Root.Children.Where(x => x.Name == "table"))
            {
                if (first)
                    first = false;
                else
                    builder.Append(", ");
                builder.Append(EscapeTypeName(idx.GetEx<string>()));

                // Checking if we have an alias for table.
                var alias = idx.Children.FirstOrDefault(x => x.Name == "as");
                if (alias != null)
                    builder.Append(" ").Append(EscapeAliasName(alias.GetEx<string>()));

                // Then making sure we apply [join] tables, if there are any.
                foreach (var idxJoin in idx.Children.Where(x => x.Name == "join"))
                {
                    AppendJoinedTables(builder, idxJoin);
                }
            }
        }

        /// <summary>
        /// Adds limit and offset parts to your SQL if requested by caller.
        /// </summary>
        /// <param name="builder">Where to put the resulting SQL into.</param>
        protected virtual void AppendTail(StringBuilder builder)
        {
            // Order counts!
            AppendGroupBy(builder);
            AppendOrderBy(builder);
            AppendLimit(builder);
            AppendOffset(builder);
        }

        /// <summary>
        /// Appends the order by clause into builder.
        /// </summary>
        /// <param name="builder">Builder where clause should be appended.</param>
        protected virtual void AppendOrderBy(StringBuilder builder)
        {
            var orderNodes = Root.Children.Where(x => x.Name == "order");
            if (orderNodes.Any())
            {
                // Retrieving default direction.
                var defaultDirection = GetDefaultDirection();

                // Appending order by clause.
                builder.Append(" order by ");

                var first = true;
                foreach (var idx in orderNodes)
                {
                    var colName = idx.GetEx<string>();
                    if (colName.Contains("("))
                    {
                        /*
                         * Aggregate expression, only allowing explicitly white listed
                         * aggregate functions, to avoid SQL injection attacks.
                         */
                        if (first)
                            first = false;
                        else
                            builder.Append(",");
                        builder
                            .Append(EscapeAggregateName(colName))
                            .Append(" ")
                            .Append(GetDirection(idx, defaultDirection));
                    }
                    else
                    {
                        foreach (var idxCol in colName.Split(','))
                        {
                            if (first)
                                first = false;
                            else
                                builder.Append(",");
                            builder
                                .Append(EscapeTypeName(idxCol.Trim()))
                                .Append(" ")
                                .Append(GetDirection(idx, defaultDirection));
                        }
                    }
                }
            }
            else
            {
                /*
                 * Some databases requires "default order by" statement, such as
                 * for instance MS SQL Server does in cases where we have defined a
                 * "limit" and "offset".
                 */
                AppendDefaultOrderBy(builder);
            }
        }

        /// <summary>
        /// Adds the default order by clause for queries, in cases where no explicit
        /// order by was added. Some databse vendors, such as MS SQL requires this
        /// given some specific conditions.
        /// </summary>
        /// <param name="builder">Where to put the default order by clause.</param>
        protected virtual void AppendDefaultOrderBy(StringBuilder builder)
        { }

        #endregion

        #region [ -- Protected and private helper methods -- ]

        /*
         * Returns the default direction to use for order, unless [order] node
         * explicitly overrides on a per field basis.
         */
        string GetDefaultDirection()
        {
            // Figuring out direction to order result by, defaulting to ascending.
            var directionNodes = Root.Children
                .Where(x => x.Name == "direction");

            // Sanity checking invocation.
            if (directionNodes.Count() > 1)
                throw new HyperlambdaException("Only on default [direction] argument is supported");

            // Fetching default direction, which is used, unless [order] overrides it with sub-argument.
            var defaultDirection = directionNodes
                .FirstOrDefault(x => x.Name == "direction")?
                .GetEx<string>()?
                .ToLower() ?? "asc";

            // Sanity checking invocation.
            if (defaultDirection != "asc" && defaultDirection != "desc")
                throw new HyperlambdaException("Only 'asc' and 'desc' are supported for the [direction] argument");

            // Returning default direction to caller.
            return defaultDirection;
        }

        /*
         * Returns the direction to apply for a single [order] node, defaulting to the
         * specified default direction, unless the node explicitly overrides it with a
         * [direction] child node.
         */
        static string GetDirection(Node orderNode, string defaultDirection)
        {
            var direction = orderNode.Children
                .FirstOrDefault(x => x.Name == "direction")?
                .GetEx<string>()?
                .ToLower();
            if (direction == null)
                return defaultDirection;

            // Sanity checking invocation, making sure we never append unvalidated values to SQL.
            if (direction != "asc" && direction != "desc")
                throw new HyperlambdaException("Only 'asc' and 'desc' are supported for the [direction] argument");
            return direction;
        }

        /*
         * Validates that the specified name is a white listed aggregate function expression, and
         * returns it with every identifier operand escaped. Throws an exception if not, to avoid
         * SQL injection attacks through aggregate expressions being appended raw to the resulting SQL.
         *
         * Escaping the operands matters beyond injection: every other identifier in the statement is
         * escaped, and PostgreSQL folds unquoted identifiers to lower case - so an unescaped
         * 'min(Album.Total)' cannot resolve against the escaped '"Album"' the from clause declares.
         */
        string EscapeAggregateName(string name)
        {
            // The cast variant wraps an aggregate, and its type name is white listed but never an identifier.
            var casted = _castedAggregate.Match(name);
            if (casted.Success)
                return $"cast({BuildAggregate(casted)} as {casted.Groups["type"].Value})";

            var match = _aggregateFunction.Match(name);
            if (!match.Success)
                throw new HyperlambdaException($"'{name}' is not a supported aggregate function expression");
            return BuildAggregate(match);
        }

        /*
         * Rebuilds an already validated aggregate expression, escaping each identifier operand, and
         * leaving a lone '*' alone since it is a wildcard and not an identifier. Splitting the
         * argument list keeps the arithmetic operators on the odd indexes, and those are appended
         * verbatim, their character set constrained by the white list above.
         */
        string BuildAggregate(Match match)
        {
            var args = match.Groups["args"].Value;
            if (args != "*")
                args = string.Join(
                    "",
                    _arithmeticOperator
                        .Split(args)
                        .Select((x, idx) => idx % 2 == 0 ? EscapeTypeName(x) : x));

            return $"{match.Groups["fun"].Value}({(match.Groups["distinct"].Success ? "distinct " : "")}{args})";
        }

        /*
         * Validates that the specified alias is a plain identifier, and returns it escaped.
         * Throws an exception if not, to avoid SQL injection attacks through table and
         * join [as] alias arguments being appended raw to the resulting SQL.
         *
         * Escaping matters for the same reason it does for aggregate operands: the columns that
         * reference an alias are escaped, and PostgreSQL folds unquoted identifiers to lower case -
         * so an unescaped 'ArtistId' alias can never be resolved by the '"ArtistId"' references
         * pointing at it.
         */
        string EscapeAliasName(string alias)
        {
            if (!_aliasName.IsMatch(alias))
                throw new HyperlambdaException($"'{alias}' is not a valid table alias name");

            // Validated alias, character set constrained by white list above.
            return EscapeColumnName(alias);
        }

        /// <summary>
        /// Appends any [group] (by) arguments, if given.
        /// </summary>
        /// <param name="builder">Where to render the SQL</param>
        protected void AppendGroupBy(StringBuilder builder)
        {
            // Checking if we have a [group] argument.
            var groupByNodes = Root.Children.Where(x => x.Name == "group");
            if (!groupByNodes.Any())
                return;

            // Sanity checking that we only have one [group] argument.
            if (groupByNodes.Count() > 1)
                throw new HyperlambdaException("I can only handle one [group] argument.");

            // Appending group by stamenent into builder.
            builder.Append(" group by ");

            var groupByNode = groupByNodes.First();
            builder.Append(string.Join(",", groupByNode.Children.Select(x =>
            {
                if (x.Name.Contains('('))
                    return EscapeAggregateName(x.Name); // Group by aggregate column.
                return EscapeTypeName(x.Name);
            })));
        }

        /*
         * Appends the distinct quantifier if caller supplied a truthy [distinct] argument.
         */
        void AppendDistinct(StringBuilder builder)
        {
            var distinctNodes = Root.Children.Where(x => x.Name == "distinct");
            if (!distinctNodes.Any())
                return;

            // Sanity checking.
            if (distinctNodes.Count() > 1)
                throw new HyperlambdaException($"syntax error in '{GetType().FullName}', too many [distinct] nodes");

            if (distinctNodes.First().GetEx<bool>())
                builder.Append("distinct ");
        }

        /*
         * Appends all requested columns into resulting builder.
         */
        void AppendColumns(StringBuilder builder)
        {
            var columnsNodes = Root.Children.Where(x => x.Name == "columns");
            if (!columnsNodes.Any() || (!columnsNodes.FirstOrDefault()?.Children.Any() ?? true))
            {
                // Caller did not explicitly declare columns, hence defaulting to all.
                builder.Append("*");
                return;
            }

            // Sanity checking invocation.
            if (columnsNodes.Count() > 1)
                throw new HyperlambdaException("You can only declare [columns] once in your lambda.");

            // Adding all columns caller requested to SQL.
            builder.Append(string.Join(",", columnsNodes
                .First()
                .Children
                .Select(x => GetSingleColumn(x))));
        }

        /*
         * Appends a single column name into resulting builder.
         */
        string GetSingleColumn(Node column)
        {
            var builder = new StringBuilder();
            if (column.Name.Contains("(") && column.Name.Contains(")"))
            {
                builder.Append(EscapeAggregateName(column.Name)); // Aggregate column, white listed shape.
            }
            else
            {
                // Checking if column name is escaped.
                if (column.Name.StartsWith("\\"))
                    builder.Append(EscapeColumnName(column.Name.Substring(1)));
                else
                    builder.Append(EscapeTypeName(column.Name));
            }

            // Checking if caller supplied an alias for column.
            var alias = column.Children.FirstOrDefault(x => x.Name == "as")?.GetEx<string>();
            if (!string.IsNullOrEmpty(alias))
                builder.Append(" as ").Append(EscapeColumnName(alias));

            return builder.ToString();
        }

        /*
         * Appends joined tables into builder.
         */
        void AppendJoinedTables(
            StringBuilder builder,
            Node joinNode)
        {
            // Appending join and its type, making sure we sanity check invocation first.
            var joinType = joinNode.Children
                .FirstOrDefault(x => x.Name == "type")?
                .GetEx<string>() ??
                "inner";
            switch (joinType)
            {
                case "left":
                case "right":
                case "inner":
                case "full":
                    builder.Append(" ")
                        .Append(joinType)
                        .Append(" join ");
                    break;
                default:
                    throw new HyperlambdaException($"I don't understand '{joinType}' here, only [left], [right], [inner] and [full]");
            }

            // Appending primary table name, and its "on" parts.
            builder.Append(EscapeTypeName(joinNode.GetEx<string>()));

            // Checking if we have an alias for table.
            var alias = joinNode.Children.FirstOrDefault(x => x.Name == "as");
            if (alias != null)
                builder.Append(" ").Append(EscapeAliasName(alias.GetEx<string>()));

            // Appending on condition.
            builder.Append(" on ");

            // Retrieving and appending all "on" criteria.
            var onNode = joinNode.Children.FirstOrDefault(x => x.Name == "on") ??
                throw new HyperlambdaException("No [on] argument supplied to [join]");
            AppendBooleanLevel(onNode, null, builder);

            // Recursively iterating through all nested joins.
            foreach (var idxInner in joinNode.Children.Where(x => x.Name == "join"))
            {
                AppendJoinedTables(builder, idxInner);
            }
        }

        /*
         * Appends limit parts, if existing.
         */
        void AppendLimit(StringBuilder builder)
        {
            var limitNodes = Root.Children.Where(x => x.Name == "limit");
            if (limitNodes.Any())
            {
                // Sanity checking.
                if (limitNodes.Count() > 1)
                    throw new HyperlambdaException($"syntax error in '{GetType().FullName}', too many [limit] nodes");

                var limitValue = limitNodes.First().GetEx<long>();
                if (limitValue > -1)
                    builder.Append(" limit " + limitValue);
            }
            else
            {
                // Defaulting to 25 records, unless [limit] was explicitly given.
                builder.Append(" limit 25");
            }
        }

        /*
         * Appends offset parts, if existing.
         */
        void AppendOffset(StringBuilder builder)
        {
            var offsetNodes = Root.Children.Where(x => x.Name == "offset");
            if (offsetNodes.Any())
            {
                // Sanity checking.
                if (offsetNodes.Count() > 1)
                    throw new HyperlambdaException($"syntax error in '{GetType().FullName}', too many [offset] nodes");

                var offsetValue = offsetNodes.First().GetEx<long>();
                if (offsetValue != 0)
                    builder.Append(" offset " + offsetValue);
            }
        }

        #endregion
    }
}
