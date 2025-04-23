/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.lambda.mail.contracts.settings
{
    /// <summary>
    /// Sender object used only when no explicit "from" argument is specified.
    /// </summary>
    public class Sender
    {
        /// <summary>
        /// Name of sender.
        /// </summary>
        /// <value>Name of sender.</value>
        public string Name { get; set; }

        /// <summary>
        /// Email address of sender.
        /// </summary>
        /// <value>Email address of sender.</value>
        public string Address { get; set; }
    }
}
