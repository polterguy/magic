/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading;
using System.Threading.Tasks;

namespace magic.lambda.caching.helpers
{
    /*
     * Helper class to ensure synchronised access to common resources.
     */
    internal sealed class MagicLockerSlim : IDisposable
    {
        /*
         * Since this locker is only used for microscopic locks we can safely use SemaphoreSlim, since it
         * doesn't matter that the implementation uses SpinWait, consuming CPU resources as it spins.
         */
        readonly static SemaphoreSlim _semaphore = new(1, 1);

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
