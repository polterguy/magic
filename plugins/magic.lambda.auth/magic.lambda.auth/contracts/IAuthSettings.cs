/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.lambda.auth.contracts
{
    /// <summary>
    /// Interface for retrieving auth configuration settings.
    /// </summary>
    public interface IAuthSettings
    {
        /// <summary>
        /// Auth secret used to cryptographically sign JWT tokens.
        /// </summary>
        /// <value>JWT secret.</value>
        string Secret { get; }

        /// <summary>
        /// If true JWT tokens will only be accepted over a cryptographically secured connection.
        /// </summary>
        /// <value>Whether JWT tokens should only be accepted over a secure connection.</value>
        bool HttpsOnly { get; }

        /// <summary>
        /// Number of minutes a JWT token should be valid.
        /// </summary>
        /// <value>Minutes tokens should be valid.</value>
        int ValidMinutes { get; }

        /// <summary>
        /// Slot to use to verify user's password.
        /// </summary>
        /// <value>Password verification slot.</value>
        string AuthenticationSlot { get; }

        /// <summary>
        /// LDAP URL, only relevant if LDAP authentication is turned on.
        /// </summary>
        /// <value>LDAP domain.</value>
        string LDAP { get; }

        /// <summary>
        /// Automatic authentication slot returning username of current user. Only relevant if LDAP is turned on.
        /// </summary>
        /// <value>Automatic authentication slot.</value>
        string AutoAuthSlot { get; }

        /// <summary>
        /// If true registrations are allowed in the backend.
        /// </summary>
        /// <value>True if registrations are turned on.</value>
        bool AllowRegistration { get; }

        /// <summary>
        /// Static email address to send "confirm registration"emails to. If null, the user's email address will be used.
        /// </summary>
        /// <value>Confirm registration email address.</value>
        string ConfirmEmailAddress { get; }
    }
}
