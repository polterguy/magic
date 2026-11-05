/*
 * Magic Cloud, copyright (c) 2026 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Threading;

namespace magic.signals.contracts
{
    public static class ExecutionSignalerExtensions
    {
        public static ExecutionContext GetExecutionContext(this ISignaler signaler)
        {
            return signaler?.Peek<ExecutionContext>("execution.context");
        }

        public static CancellationToken GetCancellationToken(this ISignaler signaler)
        {
            return signaler.GetExecutionContext()?.Token ?? CancellationToken.None;
        }

        public static void ThrowIfCancelled(this ISignaler signaler)
        {
            signaler.GetExecutionContext()?.ThrowIfCancellationRequested();
        }
    }
}
