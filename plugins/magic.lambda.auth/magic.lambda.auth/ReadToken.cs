/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System;
using System.Text;
using System.Linq;
using System.Security.Claims;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [auth.token.read] slot validating a specified JWT token.
    /// </summary>
    [Slot(Name = "auth.token.read")]
    public class ReadToken : ISlot
    {
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
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_configuration["magic:auth:secret"])),
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
                    .Split(new[] { ',', ' ' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => s.Trim().Trim('"')) ?? Enumerable.Empty<string>();

            foreach (var c in principal.Claims.Where(c => c.Type == ClaimTypes.Role))
            {
                foreach (var r in SplitRoles(c.Value))
                    userRoles.Add(r);
            }

            var requiredRoles = rolesCsv
                .Split(new[] { ',' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(r => r.Trim())
                .Where(r => r.Length > 0)
                .ToArray();

            var authorized = requiredRoles.Any(r => userRoles.Contains(r));
            if (!authorized)
            {
                var found = userRoles.Any()
                    ? $"found roles: {string.Join(", ", userRoles)}"
                    : "no roles found in token";
                throw new HyperlambdaException($"Access denied by [auth.token.verify]. Required one of: {string.Join(", ", requiredRoles)}; {found}.");
            }
        }
    }
}
