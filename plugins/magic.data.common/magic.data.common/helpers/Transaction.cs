/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Data.Common;
using magic.signals.contracts;

namespace magic.data.common.helpers
{
     /// <summary>
     /// Wraps a database transaction, such that it automatically is rolled back when
     /// instance is disposed, unless it has been previously rolled back, or committed.
     /// </summary>
    public sealed class Transaction : IDisposable
    {
        bool _signaled;

        /// <summary>
        /// Creates a new instance of your type.
        /// </summary>
        /// <param name="signaler">Signaler used to retrieve connection as stack object.</param>
        /// <param name="connection">Database connection.</param>
        public Transaction(ISignaler signaler, DbConnection connection)
        {
            Value = connection.BeginTransaction();
        }

        /// <summary>
        /// Returns actual DB transaction object.
        /// </summary>
        public DbTransaction Value { get; }

        /// <summary>
        /// Explicitly rolls back the transaction.
        /// </summary>
        public void Rollback()
        {
            _signaled = true;
            Value.Rollback();
        }

         /// <summary>
         /// Explicitly committing your transaction.
         /// </summary>
        public void Commit()
        {
            _signaled = true;
            Value.Commit();
        }

        #region [ -- Interface implementation -- ]

        /// <summary>
        /// Disposes the instance.
        /// </summary>
        public void Dispose()
        {
            /*
             * Notice, only if transaction has not been explicitly rolled
             * back, or committed, we actually rollback here in the dispose.
             */
            if (!_signaled)
                Value.Rollback();
            Value.Dispose();
        }

        #endregion
    }
}
