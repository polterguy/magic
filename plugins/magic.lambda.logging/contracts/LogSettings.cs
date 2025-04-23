/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.lambda.logging.contracts
{
    /// <summary>
    /// POCO class encapsulating settings for logger.
    /// </summary>
    public class LogSettings
    {
        public string Level { get; set; } = "debug";
    }
}
