/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using magic.node.extensions;
using PuppeteerSharp;

namespace magic.lambda.puppeteer
{
    internal sealed class PuppeteerSession
    {
        public string Id { get; init; }
        public IBrowser Browser { get; init; }
        public IPage Page { get; init; }
        public DateTime CreatedUtc { get; init; }
        public DateTime LastAccessUtc { get; set; }
        public int TimeoutMinutes { get; init; }
        public int MaxLifetimeMinutes { get; init; }
        public Timer Timer { get; set; }
    }

    internal static class PuppeteerSessions
    {
        const int DefaultTimeoutMinutes = 15;
        const int DefaultMaxLifetimeMinutes = 120;
        const int MaxSessions = 5;

        static readonly object _gate = new();
        static readonly Dictionary<string, PuppeteerSession> _sessions = new();

        public static PuppeteerSession Create(IBrowser browser, IPage page, int? timeoutMinutes, int? maxLifetimeMinutes)
        {
            var timeout = timeoutMinutes ?? DefaultTimeoutMinutes;
            var maxLifetime = maxLifetimeMinutes ?? DefaultMaxLifetimeMinutes;

            if (timeout <= 0)
                throw new HyperlambdaException("[timeout-minutes] must be a positive integer");
            if (maxLifetime <= 0)
                throw new HyperlambdaException("[max-lifetime-minutes] must be a positive integer");

            var id = Guid.NewGuid().ToString("n");
            var now = DateTime.UtcNow;

            var session = new PuppeteerSession
            {
                Id = id,
                Browser = browser,
                Page = page,
                CreatedUtc = now,
                LastAccessUtc = now,
                TimeoutMinutes = timeout,
                MaxLifetimeMinutes = maxLifetime,
            };

            lock (_gate)
            {
                if (_sessions.Count >= MaxSessions)
                    throw new HyperlambdaException($"Maximum number of Puppeteer sessions ({MaxSessions}) reached");

                session.Timer = new Timer(ExpireSession, id, TimeSpan.FromMinutes(timeout), Timeout.InfiniteTimeSpan);
                _sessions.Add(id, session);
            }

            return session;
        }

        public static PuppeteerSession Get(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
                throw new HyperlambdaException("[session_id] is required");

            PuppeteerSession session;
            lock (_gate)
            {
                if (!_sessions.TryGetValue(id, out session))
                    throw new HyperlambdaException("Puppeteer session not found or expired");
            }

            var now = DateTime.UtcNow;
            if ((now - session.CreatedUtc).TotalMinutes > session.MaxLifetimeMinutes)
            {
                _ = CloseAsync(id);
                throw new HyperlambdaException("Puppeteer session expired");
            }

            session.LastAccessUtc = now;
            try
            {
                session.Timer?.Change(TimeSpan.FromMinutes(session.TimeoutMinutes), Timeout.InfiniteTimeSpan);
            }
            catch
            {
                // Best effort; if timer is disposed, session is likely closing.
            }

            return session;
        }

        public static async Task CloseAsync(string id)
        {
            PuppeteerSession session = null;
            lock (_gate)
            {
                if (_sessions.TryGetValue(id, out session))
                {
                    _sessions.Remove(id);
                }
            }

            if (session == null)
                return;

            try
            {
                if (session.Timer != null)
                    await session.Timer.DisposeAsync();
            }
            catch
            {
                // Ignore timer dispose errors.
            }

            await CloseSessionAsync(session);
        }

        static void ExpireSession(object state)
        {
            var id = state as string;
            if (string.IsNullOrWhiteSpace(id))
                return;

            _ = CloseAsync(id);
        }

        static async Task CloseSessionAsync(PuppeteerSession session)
        {
            if (session.Page != null && !session.Page.IsClosed)
            {
                try
                {
                    await session.Page.CloseAsync();
                }
                catch
                {
                    // Best effort shutdown.
                }
            }

            if (session.Browser != null && !session.Browser.IsClosed)
            {
                try
                {
                    await session.Browser.CloseAsync();
                }
                catch
                {
                    // Best effort shutdown.
                }
            }
        }
    }
}
