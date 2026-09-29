/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;

namespace magic.node.extensions
{
    /// <summary>
    /// Wildcard matching for whitelist vocabulary pins.
    /// </summary>
    public static class Wildcard
    {
        /// <summary>
        /// Returns true if the specified candidate matches the specified pattern, where a trailing
        /// '*' matches anything starting with the rest of the pattern. Anything else is an exact
        /// comparison.
        /// </summary>
        /// <param name="pattern">Pattern to match, optionally ending with a '*'.</param>
        /// <param name="candidate">Candidate to verify.</param>
        /// <returns>True if the candidate matches the pattern.</returns>
        public static bool Matches(string pattern, string candidate)
        {
            /*
             * A wildcard is only legal as the LAST character. Anything else is refused rather than
             * compared literally, since a pattern we don't implement would otherwise silently match
             * nothing at all, and a pin that quietly grants nothing reads exactly like one that works.
             */
            var idx = pattern.IndexOf('*');
            if (idx != -1 && idx != pattern.Length - 1)
                throw new HyperlambdaException($"'{pattern}' is not a legal pin in a vocabulary, a wildcard is only legal as the last character");

            if (idx != -1)
                return candidate.StartsWith(pattern.Substring(0, pattern.Length - 1), StringComparison.Ordinal);

            return pattern == candidate;
        }
    }
}
