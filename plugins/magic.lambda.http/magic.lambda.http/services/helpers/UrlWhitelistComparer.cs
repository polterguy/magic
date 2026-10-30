/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text.RegularExpressions;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.http.services.helpers
{
    /// <summary>
    /// Whitelist vocabulary comparison for URL pins, matching the same way file pins match
    /// paths - segment by segment, with a wildcard confined to the segment it occurs in.
    /// </summary>
    public static class UrlWhitelistComparer
    {
        static readonly char[] _authorityTerminators = ['/', '?', '#'];
        static readonly char[] _pathTerminators = ['?', '#'];


        /*
         * Matches the {placeholder} segments of an url template, substituted for a benign segment
         * keeping the URL parseable and its structure intact.
         */
        static readonly Regex _templateSegment = new Regex("\\{[^}]+\\}", RegexOptions.Compiled, TimeSpan.FromSeconds(1));

        // Identifies a whole path segment that is a {placeholder}.
        static readonly Regex _segmentPlaceholder = new Regex("^\\{[^}]+\\}$", RegexOptions.Compiled, TimeSpan.FromSeconds(1));

        /// <summary>
        /// Returns true if the specified URL matches the specified pin.
        /// </summary>
        /// <param name="pattern">Pin to match, an absolute URL whose path segments may contain
        /// wildcards.</param>
        /// <param name="url">URL to verify, possibly an url template still carrying its
        /// {placeholder} segments.</param>
        /// <returns>True if the URL matches the pin.</returns>
        public static bool Matches(string pattern, string url)
        {
            // A bare '*' is the legacy declaration granting any URL.
            if (pattern == "*")
                return true;

            // A URL without a value simply doesn't match anything.
            if (url == null)
                return false;

            /*
             * Hosts are matched exactly, since a host wildcard trusts every subdomain, including any
             * that gets taken over. System.Uri refuses '*' in a host anyway, so this gives the
             * author a clear reason rather than "not an absolute URL".
             */
            if (AuthorityOf(pattern).Contains('*'))
                throw new HyperlambdaException($"'{pattern}' is not a legal pin in a vocabulary, host wildcards are not supported, list each host instead");

            /*
             * The pin must be an absolute URL itself, wildcards are only legal in the path.
             * A pin carrying {placeholders} in its path is parsed with those placeholders
             * substituted, since the strict parser may refuse the braces.
             */
            if (!Uri.TryCreate(pattern, UriKind.Absolute, out var pin))
            {
                var sanitized = _templateSegment.Replace(pattern, "x");
                if (!Uri.TryCreate(sanitized, UriKind.Absolute, out pin))
                    throw new HyperlambdaException($"'{pattern}' is not a legal pin in a vocabulary, an URL pin must be an absolute URL");
            }

            if (pin.UserInfo != string.Empty)
                throw new HyperlambdaException($"'{pattern}' is not a legal pin in a vocabulary, a pin cannot contain user info");

            /*
             * Resolving the candidate, tolerating url template placeholders, which the strict
             * parser refuses.
             */
            if (!Uri.TryCreate(url, UriKind.Absolute, out var candidate))
            {
                var sanitized = _templateSegment.Replace(url, "x");
                if (!Uri.TryCreate(sanitized, UriKind.Absolute, out candidate))
                    return false;
            }

            /*
             * User info switches the host a URL resolves to, hence is never accepted from the
             * candidate - 'https://pinned.example.com@attacker.example.com' resolves to the latter.
             */
            if (candidate.UserInfo != string.Empty)
                return false;

            // Scheme, host and port must be exact.
            if (!pin.Scheme.Equals(candidate.Scheme, StringComparison.OrdinalIgnoreCase))
                return false;
            if (!pin.Host.Equals(candidate.Host, StringComparison.OrdinalIgnoreCase))
                return false;
            if (pin.Port != candidate.Port)
                return false;

            /*
             * Path is matched from the raw strings, segment by segment, such that {placeholder}
             * segments are preserved - a '*' segment matches one whole segment, a trailing '*'
             * matches any number of remaining segments, an extension wildcard such as '*.json'
             * is legal only on the final segment, and a {placeholder} segment matches any one
             * segment. The query string is not part of the pin.
             */
            return MatchesPath(Segments(PathOf(pattern)), Segments(PathOf(url)));
        }

        #region [ -- Private helper methods -- ]

        /*
         * Extracts the path portion of an URL from its raw string form, preserving {placeholder}
         * segments exactly as authored, and ignoring the query and fragment.
         */
        static string PathOf(string url)
        {
            var scheme = url.IndexOf("://", StringComparison.Ordinal);
            var start = scheme == -1 ? 0 : scheme + 3;
            var authorityEnd = url.IndexOfAny(_authorityTerminators, start);
            if (authorityEnd == -1 || url[authorityEnd] != '/')
                return "/";
            var end = url.IndexOfAny(_pathTerminators, authorityEnd);
            return end == -1 ?
                url.Substring(authorityEnd) :
                url.Substring(authorityEnd, end - authorityEnd);
        }

        /*
         * Splits a path into its segments, dropping the empty segments a leading and trailing
         * slash would otherwise produce.
         */
        static string[] Segments(string path) =>
            path.Split('/', StringSplitOptions.RemoveEmptyEntries);

        /*
         * Extracts the authority (host, port and any user info) of an URL from its raw string form.
         */
        static string AuthorityOf(string url)
        {
            var scheme = url.IndexOf("://", StringComparison.Ordinal);
            var start = scheme == -1 ? 0 : scheme + 3;
            var end = url.IndexOfAny(_authorityTerminators, start);
            return end == -1 ? url.Substring(start) : url.Substring(start, end - start);
        }

        /*
         * Compares a path pattern to a path, segment by segment.
         */
        static bool MatchesPath(string[] pattern, string[] path)
        {
            /*
             * A trailing '*' segment matches any number of remaining segments, including none,
             * the way a prefix pin such as '/etc/*' reads - anything below it.
             */
            if (pattern.Length > 0 && pattern[^1] == "*")
            {
                if (path.Length < pattern.Length - 1)
                    return false;
                for (var idx = 0; idx < pattern.Length - 1; idx++)
                {
                    if (!MatchesSegment(pattern[idx], path[idx], false))
                        return false;
                }
                return true;
            }

            // Otherwise the pin must cover the path exactly, segment for segment.
            if (pattern.Length != path.Length)
                return false;
            for (var idx = 0; idx < pattern.Length; idx++)
            {
                if (!MatchesSegment(pattern[idx], path[idx], idx == pattern.Length - 1))
                    return false;
            }
            return true;
        }

        /*
         * Compares one segment to one pattern segment.
         */
        static bool MatchesSegment(string pattern, string segment, bool isFinal)
        {
            /*
             * A {placeholder} segment matches any one segment - in the pin it declares that the
             * caller may substitute an arbitrary value, and in a candidate it defers the decision
             * to the post-substitution verification of the resolved URL.
             */
            if (_segmentPlaceholder.IsMatch(pattern) || _segmentPlaceholder.IsMatch(segment))
                return true;

            // A literal segment.
            if (!pattern.Contains('*'))
                return pattern == segment;

            // The entire segment.
            if (pattern == "*")
                return true;

            // An extension, legal only as the final segment.
            if (!isFinal || !pattern.StartsWith('*') || pattern.LastIndexOf('*') != 0)
                throw new HyperlambdaException($"'{pattern}' is not a legal segment in a vocabulary path, a wildcard is either an entire segment such as '*', or an extension such as '*.json'");

            return segment.EndsWith(pattern.Substring(1), StringComparison.Ordinal);
        }

        #endregion
    }
}
