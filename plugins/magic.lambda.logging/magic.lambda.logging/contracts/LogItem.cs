/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;

namespace magic.lambda.logging.contracts
{
    /// <summary>
    /// POCO class encapsulating a single log item.
    /// </summary>
    public class LogItem
    {
        /// <summary>
        /// Id of log item.
        /// </summary>
        /// <value>Id of log item.</value>
        public string Id { get; set; }

        /// <summary>
        /// When item was created.
        /// </summary>
        /// <value>Date and time for when item was created.</value>
        public DateTime Created { get; set; }

        /// <summary>
        /// Type of log item, typically 'info', 'debug', 'error', etc.
        /// </summary>
        /// <value>Type of log item.</value>
        public string Type { get; set; }

        /// <summary>
        /// Content of log item.
        /// </summary>
        /// <value>Content of log item.</value>
        public string Content { get; set; }

        /// <summary>
        /// Exception stack trace associate with log item.
        /// </summary>
        /// <value>Exception stack trace.</value>
        public string Exception { get; set; }

        /// <summary>
        /// Meta data associated with log entry.
        /// </summary>
        /// <value>Meta data.</value>
        public Dictionary<string, string> Meta { get; set; }
    }
}
