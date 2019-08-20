/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Text;
using MySql.Data.MySqlClient;
using magic.node;
using magic.lambda.utilities;
using magic.signals.contracts;
using magic.hyperlambda.utils;

namespace magic.lambda.mysql.utilities
{
	public static class Executor
    {
        public static void Execute(
            Node input,
            Stack<MySqlConnection> connections,
            ISignaler signaler,
            Action<MySqlCommand> functor)
        {
            using (var cmd = new MySqlCommand(input.GetEx<string>(signaler), connections.Peek()))
            {
                foreach (var idxPar in input.Children)
                {
                    cmd.Parameters.AddWithValue(idxPar.Name, idxPar.Value);
                }

                // Making sure we clean nodes before invoking lambda callback.
                input.Value = null;
                input.Clear();

                // Invoking lambda callback supplied by caller.
                functor(cmd);
            }
        }

        public static void ExecuteCrud(
            Node input,
            Stack<MySqlConnection> connections,
            ISignaler signaler,
            Func<Node, Node> createExecuteNode,
            Action<MySqlCommand> executeCommand)
        {
            // Creating parametrized SQL node.
            var execute = createExecuteNode(input);

            // Checking if caller is only interested in SQL text.
            var onlySql = !input.Children.Any((x) => x.Name == "connection");

            // Massaging node to get parameters correctly.
            input.Value = execute.Value;
            input.Clear();
            input.AddRange(execute.Children.ToList());

            // Checking if caller is only interested in SQL command, without actually executing it.
            // Which we assume if no [connection] node is supplied.
            if (onlySql)
                return;

            // Executing SQL.
            Execute(input, connections, signaler, (cmd) => executeCommand(cmd));
        }

        public static Node CreateSelect(Node node, ISignaler signaler)
        {
            // Resulting node.
            var result = new Node("sql");

            // Temporary buffer used to build our SQL text.
            var builder = new StringBuilder();
            builder.Append("select ");

            // Retrieving columns for SQL text.
            GetColumns(builder, node);

            // Appending table name.
            builder.Append(" from ");
            GetTableName(node, signaler, builder);

            // Appending [where] clause, if any.
            var where = node.Children.FirstOrDefault((x) => x.Name == "where");
            if (where != null && where.Children.Any())
            {
                if (where.Children.Count() != 1)
                    throw new ArgumentException("Too many children nodes to SQL [where] parameters");

                builder.Append(" where ");
                builder.Append(CreateWhereSql(where, result, signaler));
            }

            var order = node.Children.FirstOrDefault((x) => x.Name == "order");
            if (order != null)
            {
                builder.Append(" order by `" + order.GetEx<string>(signaler).Replace("`", "``") + "`");
                var direction = node.Children.FirstOrDefault((x) => x.Name == "direction");
                if (direction != null)
                {
                    var dir = direction.GetEx<string>(signaler);
                    if (dir != "asc" && dir != "desc")
                        throw new ArgumentException($"I don't know how to sort '{dir}' [direction]");
                    builder.Append(" " + dir);
                }
            }

            var limit = node.Children.FirstOrDefault((x) => x.Name == "limit");
            if (limit != null)
                builder.Append(" limit " + limit.GetEx<long>(signaler));

            var offset = node.Children.FirstOrDefault((x) => x.Name == "offset");
            if (offset != null)
                builder.Append(" offset " + offset.GetEx<long>(signaler));

            result.Value = builder.ToString();
            return result;
        }

        public static Node CreateInsert(Node root, ISignaler signaler)
        {
            // Sanity checking invocation.
            var exclude = root.Children.FirstOrDefault((x) => x.Name == "exclude");
            if (exclude != null)
            {
                foreach (var idx in exclude.Children)
                {
                    if (root.Children.First((x) => x.Name == "values").Children.Any((x) => x.Name == idx.Name))
                        throw new ApplicationException($"Illegal column [{idx.Name}] found in invocation to [mysql.create]");
                }
            }

            // Resulting node, containing SQL text and command parameters.
            var result = new Node("sql");

            // Temporary buffer used to build our SQL text.
            var builder = new StringBuilder();
            builder.Append("insert into ");

            // Getting table name
            GetTableName(root, signaler, builder);

            builder.Append(" (");
            var first = true;
            foreach (var idx in root.Children.First((x) => x.Name == "values").Children)
            {
                if (first)
                    first = false;
                else
                    builder.Append(", ");
                builder.Append("`" + idx.Name.Replace("`", "``") + "`");
            }
            builder.Append(") values (");
            var idxNo = 0;
            foreach (var idx in root.Children.First((x) => x.Name == "values").Children)
            {
                if (idxNo > 0)
                    builder.Append(", ");
                if (idx.Value == null)
                {
                    builder.Append("null");
                }
                else
                {
                    builder.Append("@" + idxNo);
                    result.Add(new Node("@" + idxNo, idx.GetEx(signaler)));
                    ++idxNo;
                }
            }
            builder.Append("); select last_insert_id();");

            result.Value = builder.ToString();
            return result;
        }

        public static Node CreateDelete(Node root, ISignaler signaler)
        {
            // Dynamically building SQL according to input nodes.
            var result = new Node("sql");

            // Temporary buffer used to build our SQL text.
            var builder = new StringBuilder();
            builder.Append("delete from ");

            // Getting table name
            GetTableName(root, signaler, builder);

            // Checking if we have a [where] clause.
            var where = root.Children.FirstOrDefault((x) => x.Name == "where");
            if (where != null && where.Children.Any())
            {
                if (where.Children.Count() != 1)
                    throw new ArgumentException("Too many children nodes to SQL [where] parameters");

                builder.Append(" where " + CreateWhereSql(where, result, signaler));
            }

            result.Value = builder.ToString();
            return result;
        }

        public static Node CreateUpdate(Node root, ISignaler signaler)
        {
            // Sanity checking invocation.
            var exclude = root.Children.FirstOrDefault((x) => x.Name == "exclude");
            if (exclude != null)
            {
                foreach (var idx in exclude.Children)
                {
                    if (root.Children.First((x) => x.Name == "values").Children.Any((x) => x.Name == idx.Name))
                        throw new ApplicationException($"Illegal column [{idx.Name}] found in invocation to [mysql.update]");
                }
            }

            // Temporary buffer used to build our SQL text.
            var builder = new StringBuilder();
            builder.Append("update ");

            // Getting table name
            GetTableName(root, signaler, builder);

            // Adding set
            builder.Append(" set ");

            // Dynamically building SQL according to input nodes.
            var result = new Node("sql");

            var idxNo = 0;
            foreach (var idxCol in root.Children.First((x) => x.Name == "values").Children)
            {
                if (idxNo > 0)
                    builder.Append(", ");
                builder.Append("`" + idxCol.Name.Replace("`", "``") + "`");
                if (idxCol.Value == null)
                {
                    builder.Append(" = null");
                }
                else
                {
                    builder.Append(" = @v" + idxNo);
                    result.Add(new Node("@v" + idxNo, idxCol.GetEx(signaler)));
                    ++idxNo;
                }
            }

            var where = root.Children.FirstOrDefault((x) => x.Name == "where");
            if (where != null && where.Children.Any())
            {
                if (where.Children.Count() != 1)
                    throw new ArgumentException("Too many children nodes to SQL [where] parameters");

                builder.Append(" where " + CreateWhereSql(where, result, signaler));
            }

            result.Value = builder.ToString();
            return result;
        }

        #region [ -- Private helper methods -- ]

        private static void GetTableName(Node root, ISignaler signaler, StringBuilder builder)
        {
            builder.Append("`");
            var tableName = root.Children.FirstOrDefault((x) => x.Name == "table")?.GetEx<string>(signaler);
            if (tableName == null)
                throw new ApplicationException("No table name supplied");
            builder.Append(tableName.Replace("`", "``"));
            builder.Append("`");
        }

        /*
         * Appends caller's requested columns into builder for generating SQL text.
         */
        static void GetColumns(StringBuilder builder, Node root)
        {
            // Checking if caller supplied an explicit [columns] declaration.
            var columns = root.Children.FirstOrDefault((x) => x.Name == "columns");
            if (columns != null)
            {
                var first = true;
                foreach (var idxCol in columns.Children)
                {
                    if (first)
                        first = false;
                    else
                        builder.Append(",");
                    builder.Append("`" + idxCol.Name.Replace("`", "``") + "`");
                }
            }
            else
            {
                // Assuming all columns.
                builder.Append("*");
            }
        }

        static string CreateWhereSql(Node where, Node root, ISignaler signaler)
        {
            var result = "";
            int levelNo = 0;
            foreach (var idx in where.Children)
            {
                switch(idx.Name)
                {
                    case "and":
                        if (result != "")
                            result += " and ";
                        result += BuildWhereLevel(idx, "and", root, ref levelNo, signaler);
                        break;

                    case "or":
                        if (result != "")
                            result += " or ";
                        result += BuildWhereLevel(idx, "or", root, ref levelNo, signaler);
                        break;

                    default:
                        throw new ArgumentException($"I don't understand '{idx.Name}' as a where clause while trying to build SQL");
                }
            }

            // Stripping outer paranthesis.
            if (result.Length > 0)
                result = result.Substring(1, result.Length - 2);

            return result;
        }

        static string BuildWhereLevel(Node level, string oper, Node root, ref int levelNo, ISignaler signaler)
        {
            var result = "(";
            bool first = true;
            foreach (var idxCol in level.Children)
            {
                if (first)
                    first = false;
                else
                    result += " " + oper + " ";

                switch (idxCol.Name)
                {
                    case "and":
                        result += BuildWhereLevel(idxCol, "and", root, ref levelNo, signaler);
                        break;

                    case "or":
                        result += BuildWhereLevel(idxCol, "or", root, ref levelNo, signaler);
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
                        var unwrapped = idxCol.GetEx(signaler);
                        var argName = "@" + levelNo;
                        result += "`" + colName.Replace("`", "``") + "` " + comparisonOper + " " + argName;
                        root.Add(new Node(argName, unwrapped));
                        ++levelNo;
                        break;
                }
            }
            result = result.TrimEnd();
            result += ")";
            return result;
        }

        #endregion
    }
}
