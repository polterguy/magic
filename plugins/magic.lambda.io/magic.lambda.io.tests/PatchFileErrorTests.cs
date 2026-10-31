/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using Xunit;
using magic.lambda.io.tests.helpers;
using magic.node.extensions;

namespace magic.lambda.io.tests
{
    /*
     * The ways a patch can be wrong, and the headers it can use, which is what decides whether a patch is applied
     * to the file it was meant for.
     */
    public class PatchFileErrorTests
    {
        const string Original = "line0\nline1\nline2\nline3";

        static string Patch(string patch, string path = "/folder/existing.txt", string original = Original)
        {
            string saved = null;
            var fileService = new FileService
            {
                LoadAction = _ => original,
                SaveAction = (_, content) => saved = content,
            };
            Common.Evaluate("io.file.patch:" + path + "\n   .:@\"" + patch.Replace("\"", "\"\"") + "\"", fileService);
            return saved;
        }

        static string Error(string patch, string path = "/folder/existing.txt", string original = Original)
        {
            return Assert.Throws<HyperlambdaException>(() => Patch(patch, path, original)).Message;
        }

        const string Hunk = "@@ -1,4 +1,4 @@\n line0\n line1\n-line2\n+changed\n line3";

        #region [ -- Headers -- ]

        [Theory]
        [InlineData("--- a/folder/existing.txt\n+++ b/folder/existing.txt")]
        [InlineData("--- /folder/existing.txt\n+++ /folder/existing.txt")]
        [InlineData("--- folder/existing.txt\n+++ folder/existing.txt")]
        [InlineData("--- existing.txt\n+++ existing.txt")]
        [InlineData("--- a/folder/existing.txt\t2020-01-01 10:00:00\n+++ b/folder/existing.txt\t2020-01-02 10:00:00")]
        public void HeadersNamingTheTargetAreAccepted(string headers)
        {
            Assert.Equal("line0\nline1\nchanged\nline3\n", Patch(headers + "\n" + Hunk));
        }

        [Fact]
        public void GitPreambleIsIgnored()
        {
            Assert.Equal(
                "line0\nline1\nchanged\nline3\n",
                Patch("diff --git a/folder/existing.txt b/folder/existing.txt\nindex 1234567..89abcde 100644\n--- a/folder/existing.txt\n+++ b/folder/existing.txt\n" + Hunk));
        }

        [Fact]
        public void HeadersNamingAnotherFileAreRejected()
        {
            Assert.Equal("Patch targets a different file.", Error("--- a/other.txt\n+++ b/other.txt\n" + Hunk));
        }

        [Fact]
        public void OldHeaderWithoutNewHeaderIsRejected()
        {
            Assert.Equal("Invalid patch header.", Error("--- a/folder/existing.txt\n" + Hunk));
        }

        [Fact]
        public void NewHeaderWithoutOldHeaderIsRejected()
        {
            Assert.Equal("Invalid patch header.", Error("+++ b/folder/existing.txt\n" + Hunk));
        }

        [Fact]
        public void SecondFileIsRejectedByItsHeader()
        {
            Assert.Equal(
                "Patch can only modify a single file.",
                Error("--- a/folder/existing.txt\n+++ b/folder/existing.txt\n--- a/folder/existing.txt\n+++ b/folder/existing.txt\n" + Hunk));
        }

        [Fact]
        public void SecondFileIsRejectedByItsGitPreamble()
        {
            Assert.Equal("Patch can only modify a single file.", Error(Hunk + "\ndiff --git a/two.txt b/two.txt"));
        }

        [Fact]
        public void GarbageBeforeTheFirstHunkIsRejected()
        {
            Assert.Equal("Invalid patch.", Error("this is not a patch\n" + Hunk));
        }

        [Fact]
        public void PatchWithoutHunksIsRejected()
        {
            Assert.Equal("Patch does not contain any hunks.", Error("--- a/folder/existing.txt\n+++ b/folder/existing.txt"));
        }

        #endregion

        #region [ -- Hunk headers -- ]

        [Theory]
        [InlineData("@@ -1,4 @@")]
        [InlineData("@@ 1,4 +1,4 @@")]
        [InlineData("@@ -1,4 1,4 @@")]
        [InlineData("@@ -x,4 +1,4 @@")]
        [InlineData("@@ -1,y +1,4 @@")]
        [InlineData("@@")]
        public void BrokenHunkHeadersAreRejected(string header)
        {
            Assert.Equal("Invalid hunk header.", Error(header + "\n line0"));
        }

        [Fact]
        public void HunkHeaderWithoutCounts()
        {
            Assert.Equal("changed\nline1\nline2\nline3", Patch("@@ -1 +1 @@\n-line0\n+changed"));
        }

        [Fact]
        public void HunkHeaderOfZeroInsertsAtTheStart()
        {
            Assert.Equal("first\nline0\nline1\nline2\nline3", Patch("@@ -0,0 +1 @@\n+first"));
        }

        #endregion

        #region [ -- Lines -- ]

        [Fact]
        public void LineThatIsNeitherContextNorChangeIsRejected()
        {
            Assert.StartsWith("Hunk could not be applied", Error("@@ -1,2 +1,2 @@\n line0\n?line1"));
        }

        [Fact]
        public void ContextThatDoesNotMatchIsReportedWithBothLines()
        {
            var message = Error("@@ -1,2 +1,2 @@\n line0\n-this is not what the file says\n+x");
            Assert.StartsWith("Hunk could not be applied. No position matching its context was found", message);
        }

        [Fact]
        public void RemovingBeyondTheEndOfTheFile()
        {
            var message = Error("@@ -3,3 +3,2 @@\n line2\n line3\n-line4\n+x");
            Assert.Contains("could not be applied", message);
        }

        [Fact]
        public void RemovingEveryLineLeavesAnEmptyFile()
        {
            Assert.Equal("", Patch("@@ -1,4 +0,0 @@\n-line0\n-line1\n-line2\n-line3"));
        }

        [Fact]
        public void LongLinesAreShortenedInErrors()
        {
            var longLine = new string('x', 300);
            var message = Error("@@ -1,2 +1,2 @@\n line0\n-" + longLine + "\n+x");
            Assert.True(message.Length < 400, message.Length.ToString());
        }

        [Fact]
        public void NoNewlineMarkerAtTheEnd()
        {
            Assert.Equal(
                "line0\nline1\nline2\nchanged",
                Patch("@@ -4,1 +4,1 @@\n-line3\n+changed\n\\ No newline at end of file"));
        }

        [Fact]
        public void NoNewlineMarkerOnAContextLine()
        {
            Assert.Equal(
                "line0\nline1\nline2\nline3",
                Patch("@@ -3,2 +3,2 @@\n line2\n line3\n\\ No newline at end of file\n", original: "line0\nline1\nline2\nline3"));
        }

        [Fact]
        public void NoNewlineMarkerOnARemovedLine()
        {
            Assert.Equal(
                "line0\nline1\nline2\nchanged\n",
                Patch("@@ -4,1 +4,1 @@\n-line3\n\\ No newline at end of file\n+changed"));
        }

        [Fact]
        public void NoNewlineMarkerWithoutAPrecedingLineIsRejected()
        {
            Assert.Equal("Invalid patch line.", Error("@@ -1,1 +1,1 @@\n\\ No newline at end of file\n line0"));
        }

        [Fact]
        public void NoNewlineMarkerWithAnyOtherTextIsRejected()
        {
            Assert.Equal("Invalid patch line.", Error("@@ -1,1 +1,1 @@\n line0\n\\ Something else"));
        }

        [Fact]
        public void LineEndingsOfTheFileAreKept()
        {
            Assert.Equal(
                "line0\r\nline1\r\nchanged\r\nline3\r\n",
                Patch(Hunk, original: "line0\r\nline1\r\nline2\r\nline3\r\n"));
        }

        #endregion
    }
}
