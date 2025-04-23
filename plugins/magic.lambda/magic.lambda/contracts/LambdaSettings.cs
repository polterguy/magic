/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.lambda.contracts
{
    /// <summary>
    /// Configuration settings for magic.lambda
    /// </summary>
    public class LambdaSettings
    {
        /// <summary>
        /// Maximum number of iterations [while] canhandle before throwing exception.
        /// </summary>
        /// <value>Max while iterations.</value>
        public int MaxWhileIterations { get; set; } = 5000;
    }
}
