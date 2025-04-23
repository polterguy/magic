/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Generic;

namespace magic.lambda.auth.helpers
{
    /// <summary>
    /// Authorization ticket wrapper class, for encapsulating a user and its roles.
    /// </summary>
    public class Ticket
    {
        /// <summary>
        /// Creates a new ticket instance.
        /// </summary>
        /// <param name="username">Username for your ticket.</param>
        /// <param name="roles">Roles the user belongs to.</param>
        /// <param name="claims">Additional claims for user.</param>
        /// <param name="expires">Optional absolute date and time for when token should expire.</param>
        public Ticket(
            string username,
            IEnumerable<string> roles,
            IEnumerable<(string Name, string Value)> claims = null,
            DateTime? expires = null)
        {
            Username = username;
            Roles = new List<string>(roles ?? Array.Empty<string>());

            // Checking if caller provided additional claims.
            if (claims != null && claims.Any())
                Claims = claims.Select(x => (x.Name, x.Value)).ToList();
            else
                Claims = new List<(string Name, string Value)>();
            Expires = expires;
        }

        /// <summary>
        /// Username of the user.
        /// </summary>
        public string Username { get; private set; }

        /// <summary>
        /// Absolute expiration date in UTC of when ticket expires. If not specified, will
        /// read default expiration from app configuration.
        /// </summary>
        public DateTime? Expires { get; set; }

        /// <summary>
        /// Roles the user belongs to.
        /// </summary>
        public IEnumerable<string> Roles { get; private set; }

        /// <summary>
        /// Additional claims for user.
        /// </summary>
        public IEnumerable<(string Name, string Value)> Claims { get; private set; }
    }
}
