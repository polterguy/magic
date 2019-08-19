/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using MySql.Data.MySqlClient;
using magic.node;
using magic.lambda.utilities;

namespace magic.lambda.mysql.utilities
{
	public static class Executor
    {
        public static void Execute(
            Node input,
            Stack<MySqlConnection> connections,
            Action<MySqlCommand> functor)
        {
            using (var cmd = new MySqlCommand(input.Get<string>(), connections.Peek()))
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

        public static Node CreateSelect(Node root)
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

            sql += " from " + "`" + root.Children.First((x) => x.Name == "table").Get<string>().Replace("`", "``") + "`";

            var where = root.Children.FirstOrDefault((x) => x.Name == "where");
            if (where != null && where.Children.Any())
            {
                if (where.Children.Count() != 1)
                    throw new ArgumentException("Too many children nodes to SQL [where] parameters");

                sql += " where " + CreateWhereSql(where, result);
            }

            var order = root.Children.FirstOrDefault((x) => x.Name == "order");
            if (order != null)
            {
                sql += " order by `" + order.Get<string>().Replace("`", "``") + "`";
                if (order.Children.Count() > 1)
                    throw new ArgumentException("Wrong number of arguments given to [order]");
                var direction = order.Children.FirstOrDefault((x) => x.Name == "direction");
                if (direction != null)
                {
                    var dir = direction.Get<string>();
                    if (dir != "asc" && dir != "desc")
                        throw new ArgumentException($"I don't know how to sort '{dir}' [direction]");
                    sql += " " + dir;
                }
            }

            var limit = root.Children.FirstOrDefault((x) => x.Name == "limit");
            if (limit != null)
                sql += " limit " + limit.Get<long>();

            var offset = root.Children.FirstOrDefault((x) => x.Name == "offset");
            if (offset != null)
                sql += " offset " + offset.Get<long>();

            result.Value = sql;
            return result;
        }

        public static Node CreateDelete(Node root)
        {
            // Dynamically building SQL according to input nodes.
            var result = new Node("sql");
            var sql = 
                "delete from " + 
                "`" + 
                root.Children.First((x) => x.Name == "table").Get<string>().Replace("`", "``") 
                + "`";

            var where = root.Children.FirstOrDefault((x) => x.Name == "where");
            if (where != null && where.Children.Any())
            {
                if (where.Children.Count() != 1)
                    throw new ArgumentException("Too many children nodes to SQL [where] parameters");

                sql += " where " + CreateWhereSql(where, result);
            }

            result.Value = sql;
            return result;
        }

        #region [ -- Private helper methods -- ]

        static string CreateWhereSql(Node where, Node root)
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
                        result += BuildWhereLevel(idx, "and", root, ref levelNo);
                        break;

                    case "or":
                        if (result != "")
                            result += " or ";
                        result += BuildWhereLevel(idx, "or", root, ref levelNo);
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

        static string BuildWhereLevel(Node level, string oper, Node root, ref int levelNo)
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
                        result += BuildWhereLevel(idxCol, "and", root, ref levelNo);
                        break;
                    case "or":
                        result += BuildWhereLevel(idxCol, "or", root, ref levelNo);
                        break;
                    default:
                        var comparisonOper = "=";
                        if (idxCol.Value is string strVal)
                            if (strVal.Contains("%"))
                                comparisonOper = "like";
                        var argName = "@" + levelNo;
                        result += "`" + idxCol.Name.Replace("`", "``") + "` " + comparisonOper + " " + argName;
                        root.Add(new Node(argName, idxCol.Value));
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
