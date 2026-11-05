/*
 * Magic Cloud, copyright (c) 2026 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.Collections.Concurrent;
using System.Threading;
using magic.signals.contracts;
using MagicExecutionContext = magic.signals.contracts.ExecutionContext;

namespace magic.signals.services
{
    public class ExecutionRegistry : IExecutionRegistry
    {
        readonly ConcurrentDictionary<string, MagicExecutionContext> _executions = new();

        public MagicExecutionContext Create(CancellationToken cancellationToken = default)
        {
            var cts = cancellationToken.CanBeCanceled
                ? CancellationTokenSource.CreateLinkedTokenSource(cancellationToken)
                : new CancellationTokenSource();

            var result = new MagicExecutionContext(Guid.NewGuid().ToString("N"), cts);
            if (!_executions.TryAdd(result.ExecutionId, result))
            {
                result.Cleanup();
                throw new InvalidOperationException("Could not register execution");
            }
            return result;
        }

        public bool TryCancel(string executionId)
        {
            if (!_executions.TryGetValue(executionId ?? string.Empty, out var context))
                return false;

            try
            {
                Console.WriteLine($"Execution cancellation requested for '{context.ExecutionId}'");
                context.Cancel();
                return true;
            }
            catch (ObjectDisposedException)
            {
                return false;
            }
        }

        public bool TryGet(string executionId, out MagicExecutionContext context)
        {
            return _executions.TryGetValue(executionId ?? string.Empty, out context);
        }

        public void Complete(string executionId)
        {
            if (!_executions.TryGetValue(executionId ?? string.Empty, out var context))
                return;

            if (context.Release() == 0 && _executions.TryRemove(executionId ?? string.Empty, out var removed))
                removed.Cleanup();
        }
    }
}
