/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading;
using magic.node.extensions;

namespace magic.data.common.helpers
{
    /// <summary>
    /// Helper class to verify we can start some process and to gracefully shut down application.
    /// 
    /// Basically, allows you to only execute a slot if application has not started shutdown process.
    /// </summary>
    public sealed class ShutdownLock : IDisposable
    {
        private static bool _isShuttingDown = false;
        private static int _connections = 0;
        private static readonly ReaderWriterLockSlim _lock = new();

        /// <summary>
        /// Starts shutdown process cleanly, implying setting application state into "shutdown mode".
        /// 
        /// This will prevent slots requiring a healthy application from being invoked, such as opening
        /// a database connection, etc.
        /// </summary>
        /// <returns>Returns true if application can be immediately stopped, otherwise it returns false,
        /// implying application must wait for some slot to finish before it can shut down cleanly.</returns>
        public static bool StartShutdown()
        {
            _lock.EnterWriteLock();
            _isShuttingDown = true;
            _lock.ExitWriteLock();
            return _connections == 0;
        }

        /// <summary>
        /// Creates and returns a lock that prevents the application from shutting down if given the SIGTERM
        /// signal until object is disposed.
        /// </summary>
        public ShutdownLock()
        {
            try
            {
                _lock.EnterReadLock();
                if (_isShuttingDown)
                    throw new HyperlambdaException("Application is shutting down and therefor can't perform your request");
                Interlocked.Increment(ref _connections);
            }
            finally
            {
                _lock.ExitReadLock();
            }
        }

        /// <inheritdoc/>
        public void Dispose()
        {
            Interlocked.Decrement(ref _connections);
        }
    }
}
