/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System;
using System.Linq;
using System.Security.Claims;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using magic.lambda.auth.helpers;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [auth.token.read] slot validating a specified JWT token.
    /// </summary>
    [Slot(
        Name = "auth.token.read",
        Description = "Validates a JWT token and verifies that it contains one of the required roles",
        ValueKind = "jwt",
        ValueDescription = "JWT token to validate",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.auth.signatures.ReadTokenSignature))]
    public class ReadToken : ISlot
    {
        static readonly char[] _roleSeparators = [',', ' '];

        readonly private IConfiguration _configuration;

        /// <summary>
        /// Creates a new instance of class.
        /// </summary>
        /// <param name="configuration">Configuration provider, necessary to retrieve the auth secret.</param>
        public ReadToken(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public void Signal(ISignaler signaler, Node input)
        {
            var token = input.GetEx<string>() ?? throw new HyperlambdaException("No token provided to [auth.token.verify]");
            var rolesCsv = input.Children.FirstOrDefault(x => x.Name == "roles")?.GetEx<string>() ??
                throw new HyperlambdaException("No [roles] provided to [auth.token.verify]");

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                ValidateIssuer = false,
                ValidateAudience = false,
                IssuerSigningKey = new SymmetricSecurityKey(AuthKeyDerivation.GetKeyBytes(_configuration["magic:auth:secret"])),
                ValidateLifetime = true,
            };

            ClaimsPrincipal principal;
            SecurityToken validatedToken;
            try
            {
                var handler = new JwtSecurityTokenHandler();
                principal = handler.ValidateToken(token, validationParameters, out validatedToken);
            }
            catch (Exception ex)
            {
                throw new HyperlambdaException("Invalid JWT token supplied to [auth.token.verify]", ex);
            }

            var userRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            static IEnumerable<string> SplitRoles(string raw) =>
                raw?.Trim().Trim('[', ']', '"')
                    .Split(_roleSeparators, StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim().Trim('"')) ?? Enumerable.Empty<string>();

            foreach (var c in principal.Claims.Where(c => c.Type == ClaimTypes.Role))
            {
                foreach (var r in SplitRoles(c.Value))
                    userRoles.Add(r);
            }

            var requiredRoles = rolesCsv
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(r => r.Trim())
                .Where(r => r.Length > 0)
                .ToArray();

            var authorized = requiredRoles.Any(r => userRoles.Contains(r));
            if (!authorized)
            {
                var found = userRoles.Count > 0
                    ? $"found roles: {string.Join(", ", userRoles)}"
                    : "no roles found in token";
                throw new HyperlambdaException($"Access denied by [auth.token.verify]. Required one of: {string.Join(", ", requiredRoles)}; {found}.");
            }
        }
    }
}
