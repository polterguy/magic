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

namespace magic.lambda.mysql.crud.utilities
{
    public class SqlCreateBuilder : SqlBuilder
    {
        public SqlCreateBuilder(Node node, ISignaler signaler)
            : base(node, signaler)
        { }

        public override Node Build()
        {
            // Return value.
            var result = new Node("sql");

            // Sanity checking for [exclude] fields.
            CheckExclusionColumns();

            // Starting build process.
            var builder = new StringBuilder();
            builder.Append("insert into ");

            // Getting table name from base class.
            BuildTableName(builder);

            // Appending actual insertion values.
            var values = Root.Children.Where((x) => x.Name == "values");

            // Sanity checking [values], making sure there's only one.
            if (!values.Any())
                throw new ApplicationException($"No [values] provided to '{GetType().FullName}'");
            if (values.Count() > 1)
                throw new ApplicationException($"Too many [values] provided to '{GetType().FullName}'");

            // Appending column names.
            builder.Append(" (");
            var first = true;
            foreach (var idx in values.First().Children)
            {
                if (first)
                    first = false;
                else
                    builder.Append(", ");
                builder.Append("`" + idx.Name.Replace("`", "``") + "`");
            }

            // Appending actual values, as parameters.
            builder.Append(") values (");
            var idxNo = 0;
            foreach (var idx in values.First().Children)
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
                    result.Add(new Node("@" + idxNo, idx.GetEx(Signaler)));
                    ++idxNo;
                }
            }

            // Making sure our SQL returns the last inserted column's ID.
            builder.Append("); select last_insert_id();");

            // Returning result to caller.
            result.Value = builder.ToString();
            return result;
        }
    }
}
