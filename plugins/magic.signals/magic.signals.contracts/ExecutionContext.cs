/*
 * Magic Cloud, copyright (c) 2026 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Collections.Concurrent;
using System.Threading;

namespace magic.signals.contracts
{
    public sealed class ExecutionContext
    {
        readonly object _syncRoot = new();
        int _referenceCount = 1;
        Timer _timeoutTimer;
        DateTime? _deadlineUtc;

        public ExecutionContext(string executionId, CancellationTokenSource cancellation)
        {
            ExecutionId = executionId ?? throw new ArgumentNullException(nameof(executionId));
            Cancellation = cancellation ?? throw new ArgumentNullException(nameof(cancellation));
        }

        public string ExecutionId { get; }

        public DateTime StartedUtc { get; } = DateTime.UtcNow;

        public CancellationTokenSource Cancellation { get; }

        public CancellationToken Token => Cancellation.Token;

        public ConcurrentDictionary<string, object> Resources { get; } = new();

        public bool IsCancellationRequested => Token.IsCancellationRequested;

        public int ReferenceCount => Math.Max(Volatile.Read(ref _referenceCount), 0);

        public DateTime? DeadlineUtc
        {
            get
            {
                lock (_syncRoot)
                    return _deadlineUtc;
            }
        }

        public void Cancel()
        {
            Cancellation.Cancel();
        }

        public void ThrowIfCancellationRequested()
        {
            Token.ThrowIfCancellationRequested();
        }

        public bool TrySetTimeout(TimeSpan timeout)
        {
            if (timeout <= TimeSpan.Zero)
                throw new ArgumentOutOfRangeException(nameof(timeout), "Timeout must be greater than zero");

            lock (_syncRoot)
            {
                if (Cancellation.IsCancellationRequested)
                    return false;

                var candidateDeadline = DateTime.UtcNow.Add(timeout);
                if (_deadlineUtc.HasValue && _deadlineUtc.Value <= candidateDeadline)
                    return false;

                _deadlineUtc = candidateDeadline;

                var dueTime = candidateDeadline - DateTime.UtcNow;
                if (dueTime < TimeSpan.Zero)
                    dueTime = TimeSpan.Zero;

                _timeoutTimer ??= new Timer(_ => Cancel(), null, Timeout.InfiniteTimeSpan, Timeout.InfiniteTimeSpan);
                _timeoutTimer.Change(dueTime, Timeout.InfiniteTimeSpan);
                return true;
            }
        }

        public bool AddReference()
        {
            while (true)
            {
                var current = Volatile.Read(ref _referenceCount);
                if (current <= 0)
                    return false;

                if (Interlocked.CompareExchange(ref _referenceCount, current + 1, current) == current)
                    return true;
            }
        }

        public int Release()
        {
            var result = Interlocked.Decrement(ref _referenceCount);
            if (result < 0)
                throw new InvalidOperationException("ExecutionContext reference count dropped below zero");
            return result;
        }

        public void Cleanup()
        {
            lock (_syncRoot)
            {
                _timeoutTimer?.Dispose();
                _timeoutTimer = null;
                Cancellation.Dispose();
            }
        }
    }
}
