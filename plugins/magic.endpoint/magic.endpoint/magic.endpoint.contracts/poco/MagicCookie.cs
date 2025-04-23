/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;

namespace magic.endpoint.contracts.poco
{
    /// <summary>
    /// Class encapsulating a single cookie as created by Hyperlambda code to be returned to client.
    /// 
    /// Notice, incoming cookies are NOT encpasulated by this class, but rather simply parsed
    /// as a string/string dictionary, since this class is only used as we CREATE cookies to be
    /// returned to the client, since this requires the Hyperlambda to be allowed to configure the
    /// cookies - While with incoming cookies we're simply interested in their values.
    /// </summary>
    public class MagicCookie
    {
        /// <summary>
        /// Name of cookie.
        /// </summary>
        public string Name { get; set; }

        /// <summary>
        /// Value of cookie.
        /// </summary>
        public string Value { get; set; }

        /// <summary>
        /// Whether cookie should only be transmitted over a secure connection or not.
        /// </summary>
        public bool Secure { get; set; }

        /// <summary>
        /// Whether cookie should be hidden from client or not.
        /// </summary>
        public bool HttpOnly { get; set; }

        /// <summary>
        /// Date for when cookie should expire.
        /// </summary>
        public DateTime? Expires { get; set; }

        /// <summary>
        /// Domain for cookie.
        /// </summary>
        public string Domain { get; set; }

        /// <summary>
        /// Same site settings for cookie.
        /// </summary>
        public string SameSite { get; set; }

        /// <summary>
        /// Path for cookie.
        /// </summary>
        public string Path { get; set; }
    }
}
