/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.lambda.logging.contracts
{
    /// <summary>
    /// POCO class encapsulating the capabilities of the log implementation.
    /// </summary>
    public class Capabilities
    {
        /// <summary>
        /// If true the log implementation can filter items.
        /// </summary>
        /// <value></value>
        public bool CanFilter { get; set; }

        /// <summary>
        /// If true the log implementation can time shift.
        /// </summary>
        /// <value></value>
        public bool CanTimeShift { get; set; }
    }
}
