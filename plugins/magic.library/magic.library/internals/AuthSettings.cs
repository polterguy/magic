/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Microsoft.Extensions.Configuration;
using magic.lambda.auth.contracts;

namespace magic.library.internals
{
    /*
     * Internal helper class to handle unhandled exceptions.
     */
    internal class AuthSettings : IAuthSettings
    {
        readonly IConfiguration _configuration;

        public AuthSettings(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        #region [ -- Interface implementations -- ]

        /// <inheritdoc />
        public string Secret { get => _configuration["magic:auth:secret"] ?? ""; }

        /// <inheritdoc />
        public bool HttpsOnly { get => _configuration["magic:auth:https-only"] == "True"; }

        /// <inheritdoc />
        public int ValidMinutes { get => int.Parse(_configuration["magic:auth:valid-minutes"] ?? "20"); }

        /// <inheritdoc />
        public string AuthenticationSlot { get => _configuration["magic:auth:authentication"]; }

        /// <inheritdoc />
        public string LDAP { get => _configuration["magic:auth:ldap"]; }

        /// <inheritdoc />
        public string AutoAuthSlot { get => _configuration["magic:auth:auto-auth"]; }

        /// <inheritdoc />
        public bool AllowRegistration { get => _configuration["magic:auth:registration:allow"] == "True"; }

        /// <inheritdoc />
        public string ConfirmEmailAddress { get => _configuration["magic:auth:registration:confirm-email"]; }
 
        #endregion
    }
}