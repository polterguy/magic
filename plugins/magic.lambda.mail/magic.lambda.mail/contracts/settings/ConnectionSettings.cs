/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.lambda.mail.contracts.settings
{
    /// <summary>
    /// Shared connection settings parts for any type of mail server.
    /// </summary>
    public class ConnectionSettings
    {
        /// <summary>
        /// Host name of server to connect to.
        /// </summary>
        /// <value>Host</value>
        public string Host { get; set; }

        /// <summary>
        /// Port number to connect to server over.
        /// </summary>
        /// <value>Port</value>
        public int Port { get; set; }

        /// <summary>
        /// Whether or not we should securely connect to server using TLS or not.
        /// </summary>
        /// <value>Whether TLS should be used.</value>
        public bool Secure { get; set; }

        /// <summary>
        /// Username to use when authenticating to server.
        /// </summary>
        /// <value>Username</value>
        public string Username { get; set; }

        /// <summary>
        /// Password to use when authenticating to server.
        /// </summary>
        /// <value>Password</value>
        public string Password { get; set; }
    }
}
