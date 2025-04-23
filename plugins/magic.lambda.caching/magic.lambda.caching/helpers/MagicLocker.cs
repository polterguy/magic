/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Concurrent;

namespace magic.lambda.caching.helpers
{
    /*
     * Helper class to ensure synchronised access to cache based upon cache keys.
     *
     * This class will lock on the specified key passed into the CTOR of the class,
     * and release the semaphore/lock as the instance is disposed.
     *
     * Make sure you use the "using" pattern as you instantiate the class since the lock is
     * released as the object is disposed.
     *
     * Notice, since SemaphoreSlim is using SpinWait, it cannot be used as a semaphore for
     * this class, since that implies exhausting CPU resources, since the MagicLocker is
     * only used in factory methods for creating cache items, which might take a very long
     * time. Therefor we're using a full Semaphore and NOT SemaphoreSlim.
     */
    internal sealed class MagicLocker : IDisposable
    {
        static readonly ConcurrentDictionary<string, SemaphoreSlim> _lockers = new();
        readonly SemaphoreSlim _semaphore;

        public MagicLocker(string key)
        {
            _semaphore = _lockers.GetOrAdd(key, (_) => new SemaphoreSlim(1, 1));
        }

        public async Task LockAsync()
        {
            await _semaphore.WaitAsync();
        }

        public void Dispose()
        {
            _semaphore.Release();
        }
    }
}
