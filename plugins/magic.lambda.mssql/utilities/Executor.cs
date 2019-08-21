/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Data.SqlClient;
using magic.node;
using magic.lambda.utilities;
using magic.signals.contracts;
using magic.hyperlambda.utils;

namespace magic.lambda.mssql.utilities
{
	public static class Executor
    {
        public static void Execute(
            Node input,
            Stack<SqlConnection> connections,
            ISignaler signaler,
            Action<SqlCommand> functor)
        {
            using (var cmd = new SqlCommand(input.GetEx<string>(signaler), connections.Peek()))
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
    }
}
