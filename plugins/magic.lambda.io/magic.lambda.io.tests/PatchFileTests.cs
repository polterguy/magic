/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using Xunit;
using magic.lambda.io.tests.helpers;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.io.tests
{
    public class PatchFileTests
    {
        [Fact]
        public void PatchFile_ThrowsForMissingPayload()
        {
            var fileService = new FileService
            {
                LoadAction = path => "foo",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for invalid patches.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
""", fileService));

            Assert.Equal("Missing patch.", exception.Message);
        }

        [Fact]
        public void PatchFile_ThrowsForEmptyPayload()
        {
            var fileService = new FileService
            {
                LoadAction = path => "foo",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for invalid patches.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:
""", fileService));

            Assert.Equal("Patch is empty.", exception.Message);
        }

        [Fact]
        public void PatchFile_AppliesPatchEndingWithTrailingNewline()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                LoadAction = path => "line0\nline1\nline2\nline3",
                SaveAction = (path, content) =>
                {
                    saveInvoked = true;
                    Assert.Equal("line0\nline1\nline2 updated\nline3\n", content);
                }
            };

            Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -1,4 +1,4 @@
 line0
 line1
-line2
+line2 updated
 line3
"
""", fileService);

            Assert.True(saveInvoked);
        }

        [Fact]
        public void PatchFile_AppliesMultipleHunksInSingleFile()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                LoadAction = path => "line0\nline1\nline2\nline3\nline4\nline5\nline6",
                SaveAction = (path, content) =>
                {
                    saveInvoked = true;
                    Assert.Equal("line0\nline1 updated\nline2\nline3\nline4\nline5 updated\nline6\n", content);
                }
            };

            Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -1,4 +1,4 @@
 line0
-line1
+line1 updated
 line2
 line3
@@ -5,3 +5,3 @@
 line4
-line5
+line5 updated
 line6
"
""", fileService);

            Assert.True(saveInvoked);
        }

        [Fact]
        public void PatchFile_RejectsOutOfOrderHunks()
        {
            var fileService = new FileService
            {
                LoadAction = path => "line0\nline1\nline2\nline3\nline4\nline5\nline6\nline7",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for invalid patches.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -5,3 +5,3 @@
 line4
-line5
+line5 updated
 line6
@@ -2,4 +2,4 @@
 line1
-line2
+line2 updated
 line3
 line4
"
""", fileService));

            Assert.Equal("Patch could not be applied.", exception.Message);
        }

        [Fact]
        public void PatchFile_RejectsPatchWithoutHunks()
        {
            var fileService = new FileService
            {
                LoadAction = path => "line1\nline2",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for invalid patches.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
--- a/existing.txt
+++ b/existing.txt
"
""", fileService));

            Assert.Equal("Patch does not contain any hunks.", exception.Message);
        }

        [Fact]
        public void PatchFile_RejectsUnexpectedPatchLines()
        {
            var fileService = new FileService
            {
                LoadAction = path => "line1\nline2",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for invalid patches.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:this is not a diff
""", fileService));

            Assert.Equal("Invalid patch.", exception.Message);
        }

        [Fact]
        public void PatchFile_ValidatesPatchHeadersAgainstTargetFile()
        {
            var fileService = new FileService
            {
                LoadAction = path => "line1\n",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for invalid patches.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
--- a/other.txt
+++ b/other.txt
@@ -1 +1 @@
-line1
+line2
"
""", fileService));

            Assert.Equal("Patch targets a different file.", exception.Message);
        }

        [Fact]
        public void PatchFile_AllowsStandardHeadersForTargetFile()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                LoadAction = path => "context above\nline1\ncontext below\n",
                SaveAction = (path, content) =>
                {
                    saveInvoked = true;
                    Assert.Equal("context above\nline2\ncontext below\n", content);
                }
            };

            Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
--- a/existing.txt
+++ b/existing.txt
@@ -1,3 +1,3 @@
 context above
-line1
+line2
 context below
"
""", fileService);

            Assert.True(saveInvoked);
        }

        [Fact]
        public void PatchFile_SupportsOmittedHunkCounts()
        {
            var fileService = new FileService
            {
                LoadAction = path => "line1\nline2\n",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called when context is insufficient.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -2 +2 @@
-line2
+line2 updated
"
""", fileService));

            Assert.Equal("Patch requires at least 2 context lines.", exception.Message);
        }

        [Fact]
        public void PatchFile_IgnoresMismatchedHunkCounts()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                LoadAction = path => "line0\nline1\nline2\nline3\n",
                SaveAction = (path, content) =>
                {
                    saveInvoked = true;
                    Assert.Equal("line0\nline1\nline2 updated\nline3\n", content);
                }
            };

            Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -99,1 +99,99 @@
 line1
-line2
+line2 updated
 line3
"
""", fileService);

            Assert.True(saveInvoked);
        }

        [Fact]
        public void PatchFile_PreservesNoNewlineAtEndOfFileMarker()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                LoadAction = path => "line0\nline1\nline2",
                SaveAction = (path, content) =>
                {
                    saveInvoked = true;
                    Assert.Equal("line0\nline1\nline2 updated", content);
                }
            };

            Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -1,3 +1,3 @@
 line0
 line1
-line2
\ No newline at end of file
+line2 updated
\ No newline at end of file
"
""", fileService);

            Assert.True(saveInvoked);
        }

        [Fact]
        public void PatchFile_AppliesHunkUsingNearbyUniqueContext()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                LoadAction = path => "preface\nline1\nline2\nline3\n",
                SaveAction = (path, content) =>
                {
                    saveInvoked = true;
                    Assert.Equal("preface\nline1\nline2 updated\nline3\n", content);
                }
            };

            Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -1,3 +1,3 @@
 line1
-line2
+line2 updated
 line3
"
""", fileService);

            Assert.True(saveInvoked);
        }

        [Fact]
        public void PatchFile_IgnoresIncorrectLineNumbersWhenContextIsUnique()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                LoadAction = path => "preface\nline1\nline2\nline3\nsuffix\n",
                SaveAction = (path, content) =>
                {
                    saveInvoked = true;
                    Assert.Equal("preface\nline1\nline2 updated\nline3\nsuffix\n", content);
                }
            };

            Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -99,3 +99,3 @@
 line1
-line2
+line2 updated
 line3
"
""", fileService);

            Assert.True(saveInvoked);
        }

        [Fact]
        public void PatchFile_RejectsPatchWhenContextIsNotUniqueInFile()
        {
            var fileService = new FileService
            {
                LoadAction = path => "prefix\nline1\nline2\nline3\nmiddle\nline1\nline2\nline3\nsuffix\n",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for non-unique context.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -99,3 +99,3 @@
 line1
-line2
+line2 updated
 line3
"
""", fileService));

            Assert.Equal("Patch could not be applied.", exception.Message);
        }

        [Fact]
        public void PatchFile_RejectsAmbiguousNearbyContext()
        {
            var fileService = new FileService
            {
                LoadAction = path => "line1\nline2\nline3\nline1\nline2\nline3\n",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for ambiguous patches.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -1,3 +1,3 @@
 line1
-line2
+line2 updated
 line3
"
""", fileService));

            Assert.Equal("Patch could not be applied.", exception.Message);
        }

        [Fact]
        public void PatchFile_ThrowsForMissingPath()
        {
            var fileService = new FileService
            {
                LoadAction = path => "foo",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for invalid invocations.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch
   .:not a diff
""", fileService));

            Assert.Equal("Missing file path.", exception.Message);
        }

        [Fact]
        public void PatchFile_DeletesLineStartingWithSqlComment()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                LoadAction = path => "line0\nselect 1\n-- old comment\nselect 2\nline4\n",
                SaveAction = (path, content) =>
                {
                    saveInvoked = true;
                    Assert.Equal("line0\nselect 1\nselect 2\nline4\n", content);
                }
            };

            Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -2,4 +2,3 @@
 select 1
--- old comment
 select 2
 line4
"
""", fileService);

            Assert.True(saveInvoked);
        }

        [Fact]
        public void PatchFile_TreatsEmptyHunkLineAsEmptyContextLine()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                LoadAction = path => "line1\n\nline3\nline4\n",
                SaveAction = (path, content) =>
                {
                    saveInvoked = true;
                    Assert.Equal("line1\n\nline3 updated\nline4\n", content);
                }
            };

            Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -1,4 +1,4 @@
 line1

-line3
+line3 updated
 line4
"
""", fileService);

            Assert.True(saveInvoked);
        }

        [Fact]
        public void PatchFile_RejectsMultiFileGitPatch()
        {
            var fileService = new FileService
            {
                LoadAction = path => "line1\nline2\nline3\n",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for multi file patches.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
--- a/existing.txt
+++ b/existing.txt
@@ -1,3 +1,3 @@
 line1
-line2
+line2 updated
 line3
diff --git a/other.txt b/other.txt
--- a/other.txt
+++ b/other.txt
@@ -1,3 +1,3 @@
 foo1
-foo2
+foo2 updated
 foo3
"
""", fileService));

            Assert.Equal("Patch can only modify a single file.", exception.Message);
        }

        [Fact]
        public void PatchFile_RejectsSecondFileHeaderBeforeHunks()
        {
            var fileService = new FileService
            {
                LoadAction = path => "line1\nline2\nline3\n",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for multi file patches.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
--- a/existing.txt
+++ b/existing.txt
--- a/existing.txt
+++ b/existing.txt
@@ -1,3 +1,3 @@
 line1
-line2
+line2 updated
 line3
"
""", fileService));

            Assert.Equal("Patch can only modify a single file.", exception.Message);
        }

        [Fact]
        public void PatchFile_SupportsFilenamesContainingSpaces()
        {
            var saveInvoked = false;
            var fileService = new FileService
            {
                LoadAction = path => "line1\nline2\nline3\n",
                SaveAction = (path, content) =>
                {
                    saveInvoked = true;
                    Assert.Equal("line1\nline2 updated\nline3\n", content);
                }
            };

            Common.Evaluate("""
io.file.patch:/my file.txt
   .:@"
--- a/my file.txt
+++ b/my file.txt
@@ -1,3 +1,3 @@
 line1
-line2
+line2 updated
 line3
"
""", fileService);

            Assert.True(saveInvoked);
        }

        [Fact]
        public void PatchFile_RejectsDevNullHeaderForDifferentFile()
        {
            var fileService = new FileService
            {
                LoadAction = path => "line1\n",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for invalid patches.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
--- /dev/null
+++ b/other.txt
@@ -1 +1 @@
-line1
+line2
"
""", fileService));

            Assert.Equal("Patch targets a different file.", exception.Message);
        }

        [Fact]
        public void PatchFile_KeepsWeakContextHunksStrict()
        {
            var fileService = new FileService
            {
                LoadAction = path => "preface\nline1\n",
                SaveAction = (path, content) => Assert.True(false, "Save should not be called for weak-context drift.")
            };

            var exception = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("""
io.file.patch:/existing.txt
   .:@"
@@ -1 +1 @@
-line1
+line1 updated
"
""", fileService));

            Assert.Equal("Patch requires at least 2 context lines.", exception.Message);
        }
    }
}
