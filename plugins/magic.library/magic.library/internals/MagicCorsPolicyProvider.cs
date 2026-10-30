/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace magic.library.internals
{
    /*
     * CORS policy provider computing the policy per request.
     *
     * Origins are handled as before; if "magic:frontend:urls" is configured, only those origins
     * are allowed, otherwise any origin is allowed - since Magic's frontends might be hosted on
     * any number of unknown hosts, and typically authenticate using the Authorization header,
     * which does not require credentials support.
     *
     * Credentials (cookies) however, are only vouched for towards origins Magic can trust without
     * being configured; Origins explicitly declared in "magic:frontend:urls", or origins on the
     * same site as the backend itself, e.g. a subdomain of the backend's host. This prevents an
     * anonymous cross-site origin from borrowing the user's cookies, while keeping cookie based
     * sessions working for same-site frontends without any configuration.
     */
    internal sealed class MagicCorsPolicyProvider : ICorsPolicyProvider
    {
        readonly IConfiguration _configuration;

        /// <summary>
        /// Creates a new instance of the provider.
        /// </summary>
        /// <param name="configuration">Configuration needed to retrieve any explicitly declared frontend origins.</param>
        public MagicCorsPolicyProvider(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <inheritdoc />
        public Task<CorsPolicy> GetPolicyAsync(HttpContext context, string policyName)
        {
            // Parsing configured origins (if any).
            var originsConfig = _configuration["magic:frontend:urls"];
            var configuredOrigins = string.IsNullOrWhiteSpace(originsConfig)
                ? Array.Empty<string>()
                : originsConfig
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim())
                    .ToArray();

            // Determining whether the caller's origin can be trusted with credentials.
            var origin = context.Request.Headers.Origin.FirstOrDefault() ?? "";
            var trusted = configuredOrigins.Any(x => string.Equals(x, origin, StringComparison.OrdinalIgnoreCase)) ||
                IsSameSite(origin, context.Request.Host.Host);

            // Building policy, allowing the same origins as before.
            var policy = new CorsPolicyBuilder()
                .AllowAnyHeader()
                .AllowAnyMethod()
                .SetIsOriginAllowed(o =>
                {
                    if (string.IsNullOrEmpty(o))
                        return true;
                    if (configuredOrigins.Length > 0)
                        return configuredOrigins.Any(x => string.Equals(x, o, StringComparison.OrdinalIgnoreCase));
                    return true;
                })
                .Build();

            // Notice, credentials are only supported towards trusted origins.
            policy.SupportsCredentials = trusted;
            return Task.FromResult(policy);
        }

        /// <summary>
        /// Returns true if the specified origin is on the same site as the specified host, implying
        /// the hosts are equal, or one of them is a subdomain of the other.
        /// </summary>
        /// <param name="origin">Origin header value from request, e.g. "https://app.example.com".</param>
        /// <param name="host">Host of the backend, e.g. "api.example.com".</param>
        /// <returns>True if origin and host are on the same site.</returns>
        internal static bool IsSameSite(string origin, string host)
        {
            if (string.IsNullOrEmpty(origin) || string.IsNullOrEmpty(host))
                return false;
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
                return false; // Not a parsable origin, e.g. "null"
            var originHost = uri.Host;
            if (string.Equals(originHost, host, StringComparison.OrdinalIgnoreCase))
                return true;
            return originHost.EndsWith("." + host, StringComparison.OrdinalIgnoreCase) ||
                host.EndsWith("." + originHost, StringComparison.OrdinalIgnoreCase);
        }
    }
}
