/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using MySql.Data.MySqlClient;
using magic.node;

namespace magic.lambda.mysql
{
	public static class Executor
    {
        public static void Execute(
            Node input,
            ConnectionStack connections,
            Action<MySqlCommand> functor)
        {
            var connection = connections.GetTopConnection();
            using (var cmd = new MySqlCommand(input.Get<string>(), connection))
            {
                input.Value = null;
                foreach (var idxPar in input.Children)
                {
                    cmd.Parameters.AddWithValue(idxPar.Name, idxPar.Value);
                }
                input.Clear();
                functor(cmd);
            }
            input.Value = null;
        }
    }
}
