/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Threading;

namespace magic.utils
{
    public class Synchronizer<TImpl, TIRead, TIWrite> where TImpl : TIWrite, TIRead
    {
        readonly ReaderWriterLockSlim _lock = new ReaderWriterLockSlim();
        readonly TImpl _shared;

        public Synchronizer(TImpl shared)
        {
            _shared = shared;
        }

        public void Read(Action<TIRead> functor)
        {
            _lock.EnterReadLock();
            try
            {
                functor(_shared);
            }
            finally
            {
                _lock.ExitReadLock();
            }
        }

        public T Read<T>(Func<TIRead, T> functor)
        {
            _lock.EnterReadLock();
            try
            {
                return functor(_shared);
            }
            finally
            {
                _lock.ExitReadLock();
            }
        }

        public void Write(Action<TIWrite> functor)
        {
            _lock.EnterWriteLock();
            try
            {
                functor(_shared);
            }
            finally
            {
                _lock.ExitWriteLock();
            }
        }
    }

    public class Synchronizer<TImpl> : Synchronizer<TImpl, TImpl, TImpl>
    {
        public Synchronizer(TImpl shared)
            : base(shared)
        { }
    }
}
