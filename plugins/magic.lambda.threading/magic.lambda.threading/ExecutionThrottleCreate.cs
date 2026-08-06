/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Concurrent;
using System.Threading.RateLimiting;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.threading
{
    /*
     * Named rate limiter created by [execution.throttle.create] and enforced by
     * [execution.throttle]. Owns its entire enforcement strategy, such that the
     * enforcing slot is a simple lookup and acquire.
     */
    internal sealed class Throttle
    {
        readonly PartitionedRateLimiter<string> _limiter;

        public Throttle(int limit, int window, string per)
        {
            Limit = limit;
            Window = window;
            Per = per;
            _limiter = PartitionedRateLimiter.Create<string, string>(partition =>
                RateLimitPartition.GetFixedWindowLimiter(partition, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = limit,
                    Window = TimeSpan.FromSeconds(window),
                    QueueLimit = 0,
                }));
        }

        public int Limit { get; }
        public int Window { get; }
        public string Per { get; }

        public void Acquire(ISignaler signaler, string name)
        {
            using var lease = _limiter.AttemptAcquire(GetPartition(signaler));
            if (!lease.IsAcquired)
            {
                var message = $"Rate limit of '{name}' exceeded";
                if (lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    message += $", retry in {(int)retryAfter.TotalSeconds + 1} seconds";
                throw new HyperlambdaException(message, true, 429);
            }
        }

        public void Dispose()
        {
            _limiter.Dispose();
        }

        string GetPartition(ISignaler signaler)
        {
            switch (Per)
            {
                case "global":
                    return "";

                case "user":
                    return GetUsername(signaler) ??
                        throw new HyperlambdaException("[execution.throttle] with [per] being 'user' requires an authenticated user", true, 401);

                case "ip":
                    return GetIp(signaler);

                case null:
                    return GetUsername(signaler) ?? GetIp(signaler);

                default:
                    throw new HyperlambdaException($"[execution.throttle] cannot handle [per] values of '{Per}'");
            }
        }

        static string GetUsername(ISignaler signaler)
        {
            var auth = new Node();
            signaler.Signal("auth.ticket.get", auth);
            return auth.Value as string;
        }

        static string GetIp(ISignaler signaler)
        {
            // Preferring CloudFlare's client IP header, since behind CloudFlare [request.ip] resolves to the proxy.
            var header = new Node("", "CF-Connecting-IP");
            signaler.Signal("request.headers.get", header);
            if (header.Value != null)
                return header.GetEx<string>();

            var ip = new Node();
            signaler.Signal("request.ip", ip);
            return ip.GetEx<string>();
        }
    }

    /// <summary>
    /// [execution.throttle.create] slot, creating, replacing or deleting a named
    /// throttle enforced by [execution.throttle].
    /// </summary>
    [Slot(
        Name = "execution.throttle.create",
        Description = "Creates or replaces a named throttle enforced by [execution.throttle]; declaring an unchanged configuration keeps the existing throttle and its counters, while invoking the slot without arguments deletes the throttle instead",
        ValueKind = "throttle-name",
        ValueDescription = "Name of the throttle to create, replace or delete",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.threading.signatures.ThrottleSignature))]
    public class ExecutionThrottleCreate : ISlot
    {
        internal static readonly ConcurrentDictionary<string, Throttle> Throttles = new();

        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var name = input.GetEx<string>() ??
                throw new HyperlambdaException("[execution.throttle.create] must be given a name");

            // Invoked without arguments implies deletion.
            if (!input.Children.Any())
            {
                if (Throttles.TryRemove(name, out var deleted))
                    deleted.Dispose();
                return;
            }

            var limit = input.Children.FirstOrDefault(x => x.Name == "limit")?.GetEx<int>() ??
                throw new HyperlambdaException("[execution.throttle.create] must be given a [limit]");
            var window = input.Children.FirstOrDefault(x => x.Name == "window")?.GetEx<int>() ?? 60;
            var per = input.Children.FirstOrDefault(x => x.Name == "per")?.GetEx<string>();

            // An unchanged configuration keeps the existing throttle and its counters, allowing declarations in hot paths such as endpoints.
            if (Throttles.TryGetValue(name, out var current) &&
                current.Limit == limit && current.Window == window && current.Per == per)
                return;

            if (Throttles.TryRemove(name, out var existing))
                existing.Dispose();
            Throttles[name] = new Throttle(limit, window, per);
        }
    }
}
