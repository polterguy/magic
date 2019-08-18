/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
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
    }
}
