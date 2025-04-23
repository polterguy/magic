/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Data.Common;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.data.common.contracts;

namespace magic.data.common.helpers
{
    /// <summary>
    /// Helper class for creating and parametrizing an SQL command of some type, and
    /// also for traversing records, plus other smaller helper methods, being commonalities
    /// between different database type implementations.
    /// </summary>
    public static class Executor
    {
        /// <summary>
        /// Creates a new SQL command of some type, and parametrizes it with each
        /// child node specified in the invocation node as a key/value DB parameter -
        /// For then to invoke the specified functor lambda callback.
        /// </summary>
        /// <param name="input">Node containing SQL and parameters as children.</param>
        /// <param name="connection">Database connection.</param>
        /// <param name="transaction">Database transaction, or null if there are none.</param>
        /// <param name="functor">Lambda function responsible for executing the command somehow.
        /// This will be given the actual DbCommand object, in addition to a maximum number of columns
        /// the lambda should return to caller.</param>
        public static void Execute(
            Node input,
            DbConnection connection,
            Transaction transaction,
            Action<DbCommand, long> functor)
        {
            // Making sure we dispose our command after execution.
            using (var cmd = connection.CreateCommand())
            {
                // Checking if caller supplied a [max] argument, defaulting to -1
                var max = input.Children.FirstOrDefault(x => x.Name == "max")?.GetEx<long>() ?? -1;

                // Parametrizing and decorating command.
                PrepareCommand(cmd, transaction, input);

                // Invoking lambda callback supplied by caller.
                functor(cmd, max);
            }
        }

        /// <summary>
        /// Creates a new SQL command of some type, and parametrizes it with each
        /// child node specified in the invocation node as a key/value DB parameter -
        /// For then to invoke the specified functor lambda callback.
        /// </summary>
        /// <param name="input">Node containing SQL and parameters as children.</param>
        /// <param name="connection">Database connection.</param>
        /// <param name="transaction">Database transaction, or null if there are none.</param>
        /// <param name="functor">Lambda function responsible for executing the command somehow.
        /// This will be given the actual DbCommand object, in addition to a maximum number of columns
        /// the lambda should return to caller.</param>
        /// <returns>An awaitable task.</returns>
        public static async Task ExecuteAsync(
            Node input,
            DbConnection connection,
            Transaction transaction,
            Func<DbCommand, long, Task> functor)
        {
            using (var cmd = connection.CreateCommand())
            {
                // Checking if caller supplied a [max] argument, defaulting to -1
                var maxNode = input.Children.FirstOrDefault(x => x.Name == "max");
                var max = maxNode?.GetEx<long>() ?? -1;
                maxNode?.UnTie();

                // Parametrizing and decorating command.
                PrepareCommand(cmd, transaction, input);

                // Invoking lambda callback supplied by caller.
                await functor(cmd, max);
            }
        }

        /// <summary>
        /// Creates a connection string according to the arguments provided,
        /// and returns to caller.
        /// </summary>
        /// <param name="input">Node containing value trying to connect to a database</param>
        /// <param name="databaseType">Type of database adapter</param>
        /// <param name="defaultCatalogue">The default catalogue to use if no explicit database was specified</param>
        /// <param name="settings">Configuration object from where to retrieve connection string templates</param>
        /// <returns>Connection string</returns>
        public static string GetConnectionString(
            Node input,
            string databaseType,
            string defaultCatalogue,
            IDataSettings settings)
        {
            var connectionString = input.Value == null ? null : input.GetEx<string>();

            // Checking if this is a "generic connection string".
            if (string.IsNullOrEmpty(connectionString))
            {
                var generic = settings.ConnectionString("generic", databaseType);
                connectionString = generic.Replace("{database}", defaultCatalogue);
            }
            else if (connectionString.StartsWith('[') && connectionString.EndsWith(']'))
            {
                connectionString = connectionString.Substring(1, connectionString.Length - 2);
                if (connectionString.Contains('|'))
                {
                    var segments = connectionString.Split('|');
                    if (segments.Length != 2)
                        throw new HyperlambdaException($"I don't understand '{connectionString}' as a connection string");
                    var generic = settings.ConnectionString(segments[0], databaseType);
                    connectionString = generic.Replace("{database}", segments[1]);
                }
                else
                {
                    var generic = settings.ConnectionString("generic", databaseType);
                    connectionString = generic.Replace("{database}", connectionString);
                }
            }
            else if (!connectionString.Contains(';') && !connectionString.Contains(':'))
            {
                var generic = settings.ConnectionString("generic", databaseType);
                connectionString = generic.Replace("{database}", connectionString);
            }
            return connectionString;
        }

        /// <summary>
        /// Returns true if invocation wants to retrieve multiple result sets.
        /// </summary>
        /// <param name="input">Node containing value trying to connect to a database</param>
        /// <returns>True if caller wants to have multiple result sets returned</returns>
        public static bool HasMultipleResultSets(Node input)
        {
            var mrsNode = input.Children.FirstOrDefault(x => x.Name == "multiple-result-sets");
            var multipleResultSets = mrsNode?.GetEx<bool>() ?? false;
            mrsNode?.UnTie();
            return multipleResultSets;
        }

        /// <summary>
        /// Builds one result record and puts into specified parentNode from data reader
        /// </summary>
        /// <param name="reader">Data reader to retrieve fields from</param>
        /// <param name="parentNode">Node where to return result</param>
        /// <param name="max">Maximum number of records to return</param>
        /// <param name="converter">Optional method to convert individual values</param>
        /// <returns>True if we should continue building the next result, false otherwise</returns>
        public static bool BuildResultRow(DbDataReader reader, Node parentNode, ref long max, Func<object, object> converter = null)
        {
            if (max != -1 && max-- == 0)
                return false; // Reached maximum limit

            var rowNode = new Node();
            for (var idxCol = 0; idxCol < reader.FieldCount; idxCol++)
            {
                var colNode = new Node(
                    reader.GetName(idxCol),
                    converter == null ? Converter.GetValue(reader[idxCol]) : converter(reader[idxCol]));
                rowNode.Add(colNode);
            }
            parentNode.Add(rowNode);
            return true;
        }

        #region [ -- Private helper methods -- ]

        /*
         * Helper method to parametrize command with SQL parameters, in addition to
         * decorating command with the specified transaction, if any.
         */
        static void PrepareCommand(
            DbCommand cmd, 
            Transaction transaction, 
            Node input)
        {
            // Associating transaction with command.
            if (transaction != null)
                cmd.Transaction = transaction.Value;

            // Retrieves the command text.
            cmd.CommandText = input.GetEx<string>();

            // Applies the parameters, if any.
            foreach (var idxPar in input.Children)
            {
                var par = cmd.CreateParameter();
                par.ParameterName = idxPar.Name;
                par.Value = idxPar.GetEx<object>() ?? DBNull.Value;
                cmd.Parameters.Add(par);
            }

            // Making sure we clean nodes before invoking lambda callback.
            input.Value = null;
            input.Clear();
        }

        #endregion
    }
}
