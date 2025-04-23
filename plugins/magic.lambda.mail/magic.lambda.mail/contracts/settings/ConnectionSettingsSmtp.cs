/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.lambda.mail.contracts.settings
{
    /// <summary>
    /// SMTP connection settings object.
    /// </summary>
    public class ConnectionSettingsSmtp : ConnectionSettings
    {
        /// <summary>
        /// Default "from" name/email if not explicitly specified and overridden by caller.
        /// </summary>
        /// <value>Default from name/email.</value>
        public Sender From { get; set; }
    }
}
