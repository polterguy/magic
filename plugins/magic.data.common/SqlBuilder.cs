/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Text;
using magic.node;
using magic.signals.contracts;
using magic.hyperlambda.utils;

namespace magic.data.common
{
    public abstract class SqlBuilder
    {
        public SqlBuilder(Node node, ISignaler signaler, string escapeChar)
        {
            Root = node ?? throw new ArgumentNullException(nameof(node));
            Signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
            EscapeChar = escapeChar ?? throw new ArgumentNullException(nameof(escapeChar));
        }

        public abstract Node Build();

        public bool IsGenerateOnly => Root.Children.FirstOrDefault((x) => x.Name == "generate")?.Get<bool>() ?? false;

        protected string EscapeChar { get; private set; }

        #region [ -- Protected helper methods and properties -- ]

        protected Node Root { get; private set; }

        protected ISignaler Signaler { get; private set; }

        protected void GetTableName(StringBuilder builder)
        {
            builder.Append(EscapeChar);

            // Retrieving actual table name from [table] node.
            var tableName = Root.Children.FirstOrDefault((x) => x.Name == "table")?.GetEx<string>(Signaler);
            if (tableName == null)
                throw new ApplicationException($"No table name supplied to '{GetType().FullName}'");
            builder.Append(tableName.Replace(EscapeChar, EscapeChar + EscapeChar));

            builder.Append(EscapeChar);
        }

        protected void CheckExclusionColumns()
        {
            var exclude = Root.Children.FirstOrDefault((x) => x.Name == "exclude");
            if (exclude != null)
            {
                var valueNodes = Root.Children.First((x) => x.Name == "values");
                foreach (var idx in exclude.Children)
                {
                    var idxName = idx.Name.ToLowerInvariant();
                    if (valueNodes.Children.Any((x) => x.Name.ToLowerInvariant() == idxName))
                        throw new ApplicationException($"Illegal column [{idx.Name}] found in invocation to '{GetType().FullName}'");
                }
            }
        }

        protected void BuildWhere(Node result, StringBuilder builder)
        {
            var where = Root.Children.Where((x) => x.Name == "where");
            if (where.Count() > 1)
                throw new ApplicationException($"Syntax error in '{GetType().FullName}', too many [where] nodes");

            // Checking we actuall have a [where] declaration
            if (!where.Any() || !where.First().Children.Any())
                return;

            builder.Append(" where ");

            int levelNo = 0;
            foreach (var idx in where.First().Children)
            {
                switch (idx.Name)
                {
                    case "and":
                        if (levelNo != 0)
                            builder.Append(" and ");
                        BuildWhereLevel(result, builder, idx, "and", ref levelNo);
                        break;

                    case "or":
                        if (levelNo != 0)
                            builder.Append(" or ");
                        BuildWhereLevel(result, builder, idx, "or", ref levelNo);
                        break;

                    default:
                        throw new ArgumentException($"I don't understand '{idx.Name}' as a where clause while trying to build SQL");
                }
            }
        }

        #endregion

        #region [ -- Private helper methods -- ]

        void BuildWhereLevel(
            Node result,
            StringBuilder builder,
            Node level,
            string oper,
            ref int levelNo)
        {
            builder.Append("(");
            bool first = true;
            foreach (var idxCol in level.Children)
            {
                if (first)
                    first = false;
                else
                    builder.Append(" " + oper + " ");

                switch (idxCol.Name)
                {
                    case "and":
                        BuildWhereLevel(result, builder, idxCol, "and", ref levelNo);
                        break;

                    case "or":
                        BuildWhereLevel(result, builder, idxCol, "or", ref levelNo);
                        break;

                    default:
                        var comparisonOper = "=";
                        var colName = idxCol.Name;
                        if (colName.Contains(":"))
                        {
                            var entities = colName.Split(':');
                            colName = entities[0];
                            comparisonOper = entities[1];
                            switch (comparisonOper)
                            {
                                case ">":
                                case "<":
                                case ">=":
                                case "<=":
                                case "!=":
                                case "like":
                                    break;
                                default:
                                    throw new ApplicationException($"Illegal comparison operator found '{comparisonOper}'");
                            }
                        }
                        var unwrapped = idxCol.GetEx(Signaler);
                        var argName = "@" + levelNo;
                        builder.Append(EscapeChar + colName.Replace(EscapeChar, EscapeChar + EscapeChar) + EscapeChar + " " + comparisonOper + " " + argName);
                        result.Add(new Node(argName, unwrapped));
                        ++levelNo;
                        break;
                }
            }
            builder.Append(")");
        }

        #endregion
    }
}
