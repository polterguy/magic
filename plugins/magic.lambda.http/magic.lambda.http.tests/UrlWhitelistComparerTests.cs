/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Xunit;
using magic.node.extensions;
using magic.lambda.http.services.helpers;

namespace magic.lambda.http.tests
{
    /*
     * The rules for what a URL pin in a vocabulary lets through, tested directly, since every one of them is
     * what stops sandboxed code from reaching a host it was never granted.
     */
    public class UrlWhitelistComparerTests
    {
        [Theory]
        // The bare wildcard and missing values.
        [InlineData("*", "https://anything.example.com/x", true)]
        [InlineData("https://example.com/a", null, false)]
        // Scheme, host and port must be exact.
        [InlineData("https://example.com/a", "https://example.com/a", true)]
        [InlineData("https://example.com/a", "http://example.com/a", false)]
        [InlineData("https://example.com/a", "https://other.com/a", false)]
        [InlineData("https://example.com/a", "https://EXAMPLE.com/a", true)]
        [InlineData("https://example.com/a", "https://example.com:8443/a", false)]
        [InlineData("https://example.com:8443/a", "https://example.com:8443/a", true)]
        // User info switches the host a URL resolves to.
        [InlineData("https://example.com/a", "https://example.com@attacker.com/a", false)]
        [InlineData("https://example.com/a", "https://user:pass@example.com/a", false)]
        // Paths are matched segment by segment, and the query is not part of the pin.
        [InlineData("https://example.com/a/b", "https://example.com/a/b?x=1#frag", true)]
        [InlineData("https://example.com/a/b", "https://example.com/a/b/c", false)]
        [InlineData("https://example.com/a/b", "https://example.com/a", false)]
        [InlineData("https://example.com", "https://example.com", true)]
        [InlineData("https://example.com", "https://example.com/", true)]
        [InlineData("https://example.com", "https://example.com/a", false)]
        [InlineData("https://example.com/a/", "https://example.com/a", true)]
        [InlineData("https://example.com/a", "https://example.com?query", false)]
        [InlineData("https://example.com", "https://example.com?query", true)]
        // A wildcard segment is one segment, and a trailing one is any number of them.
        [InlineData("https://example.com/a/*/c", "https://example.com/a/b/c", true)]
        [InlineData("https://example.com/a/*/c", "https://example.com/a/b/x/c", false)]
        [InlineData("https://example.com/a/*", "https://example.com/a", true)]
        [InlineData("https://example.com/a/*", "https://example.com/a/b/c/d", true)]
        [InlineData("https://example.com/a/*", "https://example.com/b/c", false)]
        [InlineData("https://example.com/a/b/*", "https://example.com/a", false)]
        // An extension wildcard on the final segment.
        [InlineData("https://example.com/files/*.json", "https://example.com/files/data.json", true)]
        [InlineData("https://example.com/files/*.json", "https://example.com/files/data.xml", false)]
        // Placeholders match any one segment, in the pin and in the candidate.
        [InlineData("https://example.com/users/{id}/posts", "https://example.com/users/42/posts", true)]
        [InlineData("https://example.com/users/{id}/posts", "https://example.com/users/42/comments", false)]
        [InlineData("https://example.com/users/42/posts", "https://example.com/users/{id}/posts", true)]
        [InlineData("https://example.com/users/{id}", "https://example.com/users/{other}", true)]
        public void Matches(string pin, string url, bool expected)
        {
            Assert.Equal(expected, UrlWhitelistComparer.Matches(pin, url));
        }

        [Fact]
        public void CandidateThatIsNotAnAbsoluteUrlNeverMatches()
        {
            Assert.False(UrlWhitelistComparer.Matches("https://example.com/a", "/a"));
            Assert.False(UrlWhitelistComparer.Matches("https://example.com/a", "not a url"));
            Assert.False(UrlWhitelistComparer.Matches("https://example.com/a", ""));
        }

        [Theory]
        [InlineData("not a url at all")]
        public void PinThatIsNotAnAbsoluteUrlIsRejected(string pin)
        {
            var ex = Assert.Throws<HyperlambdaException>(() => UrlWhitelistComparer.Matches(pin, "https://example.com/a"));
            Assert.Contains("absolute URL", ex.Message);
        }

        [Fact]
        public void PinWithUserInfoIsRejected()
        {
            var ex = Assert.Throws<HyperlambdaException>(() => UrlWhitelistComparer.Matches("https://user@example.com/a", "https://example.com/a"));
            Assert.Contains("user info", ex.Message);
        }

        [Theory]
        [InlineData("https://*.example.com/a")]
        [InlineData("https://api.*.com/a")]
        [InlineData("https://ex*.example.com/a")]
        [InlineData("https://*.example.com:8443/a")]
        public void HostWildcardsAreRejected(string pin)
        {
            var ex = Assert.Throws<HyperlambdaException>(() => UrlWhitelistComparer.Matches(pin, "https://api.example.com/a"));
            Assert.Contains("host wildcards are not supported", ex.Message);
        }

        [Fact]
        public void WildcardInThePathOfAPinStillWorks()
        {
            Assert.True(UrlWhitelistComparer.Matches("https://example.com/*", "https://example.com/a/b"));
        }

        [Fact]
        public void PlaceholderInAPinHostIsLiteral()
        {
            // Placeholders are only wildcards in a path; in a host the pin is compared as written, with the braces replaced.
            Assert.False(UrlWhitelistComparer.Matches("https://{tenant}.example.com/a", "https://acme.example.com/a"));
        }

        [Theory]
        [InlineData("https://example.com/a*b/c", "https://example.com/ab/c")]
        [InlineData("https://example.com/*.json/c", "https://example.com/x.json/c")]
        [InlineData("https://example.com/a/*.*", "https://example.com/a/x.y")]
        public void PathWildcardsMustBeWholeSegmentsOrAFinalExtension(string pin, string url)
        {
            var ex = Assert.Throws<HyperlambdaException>(() => UrlWhitelistComparer.Matches(pin, url));
            Assert.Contains("wildcard", ex.Message);
        }
    }
}
