/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
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
                input.Value = null;
                input.Clear();
                functor(cmd);
            }
        }

        public static void ExecuteCrud(
            Node input,
            Stack<MySqlConnection> connections,
            ISignaler signaler,
            Func<Node, ISignaler, Node> createExecuteNode,
            Action<MySqlCommand, Node> executeCommand)
        {
            // Creating parametrized SQL node.
            var execute = createExecuteNode(input, signaler);

            // Checking if caller is only interested in SQL text.
            var onlySql = !input.Children.Any((x) => x.Name == "connection");

            // Massaging node to get parameters correctly.
            input.Value = execute.Value;
            input.Clear();
            input.AddRange(execute.Children.ToList());
            if (onlySql)
                return;

            // Executing SQL.
            Execute(input, connections, signaler, (cmd) =>
            {
                executeCommand(cmd, input);
            });
        }

        public static Node CreateSelect(Node root, ISignaler signaler)
        {
            // Dynamically building SQL according to input nodes.
            var result = new Node("sql");
            var sql = "select ";
            var columns = root.Children.FirstOrDefault((x) => x.Name == "columns");
            if (columns != null)
            {
                var first = true;
                foreach (var idxCol in columns.Children)
                {
                    if (first)
                        first = false;
                    else
                        sql += ",";
                    sql += "`" + idxCol.Name.Replace("`", "``") + "`";
                }
            }
            else
            {
                sql += "*";
            }

            sql += " from " + "`" + root.Children.First((x) => x.Name == "table").GetEx<string>(signaler).Replace("`", "``") + "`";

            var where = root.Children.FirstOrDefault((x) => x.Name == "where");
            if (where != null && where.Children.Any())
            {
                if (where.Children.Count() != 1)
                    throw new ArgumentException("Too many children nodes to SQL [where] parameters");

                sql += " where " + CreateWhereSql(where, result, signaler);
            }

            var order = root.Children.FirstOrDefault((x) => x.Name == "order");
            if (order != null)
            {
                sql += " order by `" + order.GetEx<string>(signaler).Replace("`", "``") + "`";
                var direction = root.Children.FirstOrDefault((x) => x.Name == "direction");
                if (direction != null)
                {
                    var dir = direction.GetEx<string>(signaler);
                    if (dir != "asc" && dir != "desc")
                        throw new ArgumentException($"I don't know how to sort '{dir}' [direction]");
                    sql += " " + dir;
                }
            }

            var limit = root.Children.FirstOrDefault((x) => x.Name == "limit");
            if (limit != null)
                sql += " limit " + limit.GetEx<long>(signaler);

            var offset = root.Children.FirstOrDefault((x) => x.Name == "offset");
            if (offset != null)
                sql += " offset " + offset.GetEx<long>(signaler);

            result.Value = sql;
            return result;
        }

        public static Node CreateInsert(Node root, ISignaler signaler)
        {
            // Dynamically building SQL according to input nodes.
            var result = new Node("sql");
            var sql =
                "insert into " +
                "`" +
                root.Children.First((x) => x.Name == "table").GetEx<string>(signaler).Replace("`", "``")
                + "`";
            sql += " (";
            var first = true;
            foreach (var idx in root.Children.First((x) => x.Name == "values").Children)
            {
                if (first)
                    first = false;
                else
                    sql += ", ";
                sql += "`" + idx.Name.Replace("`", "``") + "`";
            }
            sql += ") values (";
            var idxNo = 0;
            foreach (var idx in root.Children.First((x) => x.Name == "values").Children)
            {
                if (idxNo > 0)
                    sql += ", ";
                sql += "@" + idxNo;
                result.Add(new Node("@" + idxNo, idx.GetEx(signaler)));
                ++idxNo;
            }
            sql += "); select last_insert_id();";

            result.Value = sql;
            return result;
        }

        public static Node CreateDelete(Node root, ISignaler signaler)
        {
            // Dynamically building SQL according to input nodes.
            var result = new Node("sql");
            var sql = 
                "delete from " + 
                "`" + 
                root.Children.First((x) => x.Name == "table").GetEx<string>(signaler).Replace("`", "``") 
                + "`";

            var where = root.Children.FirstOrDefault((x) => x.Name == "where");
            if (where != null && where.Children.Any())
            {
                if (where.Children.Count() != 1)
                    throw new ArgumentException("Too many children nodes to SQL [where] parameters");

                sql += " where " + CreateWhereSql(where, result, signaler);
            }

            result.Value = sql;
            return result;
        }

        public static Node CreateUpdate(Node root, ISignaler signaler)
        {
            // Dynamically building SQL according to input nodes.
            var result = new Node("sql");
            var sql =
                "update " +
                "`" +
                root.Children.First((x) => x.Name == "table").GetEx<string>(signaler).Replace("`", "``")
                + "` set ";

            var idxNo = 0;
            foreach (var idxCol in root.Children.First((x) => x.Name == "values").Children)
            {
                if (idxNo > 0)
                    sql += ", ";
                sql += "`" + idxCol.Name.Replace("`", "``") + "`";
                sql += " = @v" + idxNo;
                result.Add(new Node("@v" + idxNo, idxCol.GetEx(signaler)));
                ++idxNo;
            }

            var where = root.Children.FirstOrDefault((x) => x.Name == "where");
            if (where != null && where.Children.Any())
            {
                if (where.Children.Count() != 1)
                    throw new ArgumentException("Too many children nodes to SQL [where] parameters");

                sql += " where " + CreateWhereSql(where, result, signaler);
            }

            result.Value = sql;
            return result;
        }

        #region [ -- Private helper methods -- ]

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
                        var unwrapped = idxCol.GetEx(signaler);
                        if (unwrapped is string strVal)
                            if (strVal.Contains("%"))
                                comparisonOper = "like";
                        var argName = "@" + levelNo;
                        result += "`" + idxCol.Name.Replace("`", "``") + "` " + comparisonOper + " " + argName;
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
