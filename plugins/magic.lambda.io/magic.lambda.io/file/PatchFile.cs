/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.patch] slot for patching a file on your server using a unified diff patch.
    /// </summary>
    [Slot(
        Name = "io.file.patch",
        Description = "Applies a unified-diff patch to a file on disk; useful for surgical edits or replaying generated diffs",
        ValueKind = "file-path",
        ValueDescription = "File path to patch",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.io.signatures.PatchFileSignature))]
    public class PatchFile : ISlotAsync
    {
        /*
         * How far away from the position declared by a hunk header we are willing to look for the
         * hunk's context. Generous enough to absorb realistic drift between the file the patch was
         * created against and the file we are patching, bounded so that a weakly anchored hunk
         * cannot match something unrelated at the other end of the file.
         */
        const int MaxFuzzRadius = 250;

        readonly IRootResolver _rootResolver;
        readonly IFileService _service;
        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying file service implementation.</param>
        public PatchFile(IRootResolver rootResolver, IFileService service)
        {
            _rootResolver = rootResolver;
            _service = service;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Making sure we evaluate any children, to make sure any signals wanting to retrieve our source is evaluated.
            await signaler.SignalAsync("eval", input);

            // Retrieving arguments.
            var rawPath = input.GetEx<string>();
            if (string.IsNullOrWhiteSpace(rawPath))
                throw new HyperlambdaException("Missing file path.");

            var path = _rootResolver.AbsolutePath(rawPath);
            var patchNode = input.Children.FirstOrDefault();
            if (patchNode == null)
                throw new HyperlambdaException("Missing patch.");

            var patch = patchNode.GetEx<string>();
            if (string.IsNullOrWhiteSpace(patch))
                throw new HyperlambdaException("Patch is empty.");

            // Loading original file content.
            var original = await _service.LoadAsync(path);

            // Applying patch and saving file.
            var patched = ApplyUnifiedDiff(original, patch, path);
            await _service.SaveAsync(path, patched);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Applies a unified diff patch to the specified content.
         */
        static string ApplyUnifiedDiff(string original, string patch, string targetPath)
        {
            var newline = original.Contains("\r\n", StringComparison.InvariantCulture) ? "\r\n" : "\n";
            var (originalLines, originalHasTrailingNewline) = SplitContentLines(original);
            var patchLines = SplitLines(patch);
            while (patchLines.Count > 0 && patchLines[0].Length == 0)
                patchLines.RemoveAt(0);
            while (patchLines.Count > 0 && patchLines[patchLines.Count - 1].Length == 0)
                patchLines.RemoveAt(patchLines.Count - 1);
            var output = new List<string>();
            var outputHasTrailingNewline = originalHasTrailingNewline;
            var hasHunks = false;
            var seenHeader = false;
            var originalIndex = 0;
            var patchIndex = 0;

            while (patchIndex < patchLines.Count)
            {
                var line = patchLines[patchIndex];

                if (line.StartsWith("diff --git", StringComparison.InvariantCulture) ||
                    line.StartsWith("index ", StringComparison.InvariantCulture))
                {
                    // A git preamble after hunks have started implies a second file.
                    if (hasHunks)
                        throw new HyperlambdaException("Patch can only modify a single file.");

                    patchIndex++;
                    continue;
                }

                if (line.StartsWith("--- ", StringComparison.InvariantCulture))
                {
                    if (seenHeader)
                        throw new HyperlambdaException("Patch can only modify a single file.");

                    if (patchIndex + 1 >= patchLines.Count || !patchLines[patchIndex + 1].StartsWith("+++ ", StringComparison.InvariantCulture))
                        throw new HyperlambdaException("Invalid patch header.");

                    ValidatePatchHeaders(line, patchLines[patchIndex + 1], targetPath);
                    seenHeader = true;
                    patchIndex += 2;
                    continue;
                }

                if (line.StartsWith("+++ ", StringComparison.InvariantCulture))
                    throw new HyperlambdaException("Invalid patch header.");

                if (!line.StartsWith("@@", StringComparison.InvariantCulture))
                    throw new HyperlambdaException("Invalid patch.");

                var header = ParseHunkHeader(line);
                hasHunks = true;

                patchIndex++;
                var hunkLines = new List<string>();
                while (patchIndex < patchLines.Count)
                {
                    // Notice, "--- " does NOT terminate a hunk, since it is also a legal deletion of
                    // a line starting with "-- " (an SQL comment for instance). Headers are only legal
                    // before the first hunk, making everything up to the next hunk or git preamble content.
                    line = patchLines[patchIndex];
                    if (line.StartsWith("@@", StringComparison.InvariantCulture) ||
                        line.StartsWith("diff --git", StringComparison.InvariantCulture) ||
                        line.StartsWith("index ", StringComparison.InvariantCulture))
                        break;

                    hunkLines.Add(line);
                    patchIndex++;
                }

                /*
                 * The hunk header declares where the hunk belongs in the original file, and we use it
                 * as our anchor. It is a hint and not a guarantee, since the file might have drifted
                 * since the patch was created, so the resolver is allowed to search outwards from it.
                 */
                var expectedIndex = header.OldStart > 0 ? header.OldStart - 1 : 0;
                var (targetIndex, whitespaceFuzz) = ResolveHunkTargetIndex(originalLines, originalIndex, hunkLines, expectedIndex);

                // Copy unchanged lines before hunk.
                while (originalIndex < targetIndex && originalIndex < originalLines.Count)
                {
                    output.Add(originalLines[originalIndex]);
                    originalIndex++;
                }

                var previousOperation = '\0';
                foreach (var hunkLine in hunkLines)
                {
                    // An entirely empty line is an empty context line whose leading space was
                    // stripped somewhere in transport.
                    var tag = hunkLine.Length == 0 ? ' ' : hunkLine[0];
                    var text = hunkLine.Length > 1 ? hunkLine.Substring(1) : string.Empty;
                    switch (tag)
                    {
                        case ' ':
                            EnsureLineMatch(originalLines, originalIndex, text, whitespaceFuzz);

                            // Notice, we deliberately keep the ORIGINAL line rather than the patch's
                            // version of it, so that a whitespace tolerant match cannot silently
                            // rewrite trailing whitespace the file's author put there on purpose.
                            output.Add(originalLines[originalIndex]);
                            outputHasTrailingNewline = true;
                            originalIndex++;
                            break;

                        case '-':
                            EnsureLineMatch(originalLines, originalIndex, text, whitespaceFuzz);
                            originalIndex++;
                            break;

                        case '+':
                            output.Add(text);
                            outputHasTrailingNewline = true;
                            break;

                        case '\\':
                            if (!string.Equals(hunkLine, "\\ No newline at end of file", StringComparison.InvariantCulture))
                                throw new HyperlambdaException("Invalid patch line.");
                            if (previousOperation == '\0')
                                throw new HyperlambdaException("Invalid patch line.");

                            if (previousOperation == ' ')
                            {
                                outputHasTrailingNewline = false;
                            }
                            else if (previousOperation == '+')
                            {
                                outputHasTrailingNewline = false;
                            }
                            else if (previousOperation != '-')
                            {
                                throw new HyperlambdaException("Invalid patch line.");
                            }
                            break;

                        default:
                            throw new HyperlambdaException("Invalid patch line.");
                    }

                    previousOperation = tag;
                }
            }

            if (!hasHunks)
                throw new HyperlambdaException("Patch does not contain any hunks.");

            // Append remaining original lines.
            while (originalIndex < originalLines.Count)
            {
                output.Add(originalLines[originalIndex]);
                outputHasTrailingNewline = OriginalLineHasTrailingNewline(originalIndex, originalLines.Count, originalHasTrailingNewline);
                originalIndex++;
            }

            if (output.Count == 0)
                return string.Empty;

            return string.Join(newline, output) + (outputHasTrailingNewline ? newline : string.Empty);
        }

        /*
         * Parses a unified diff hunk header.
         */
        static (int OldStart, int OldCount, int NewStart, int NewCount) ParseHunkHeader(string header)
        {
            // Format: @@ -l,s +l,s @@
            var parts = header.Split(' ');
            if (parts.Length < 3)
                throw new HyperlambdaException("Invalid hunk header.");

            var oldPart = parts[1];
            var newPart = parts[2];

            if (!oldPart.StartsWith("-", StringComparison.InvariantCulture) ||
                !newPart.StartsWith("+", StringComparison.InvariantCulture))
                throw new HyperlambdaException("Invalid hunk header.");

            var (oldStart, oldCount) = ParseRange(oldPart.Substring(1));
            var (newStart, newCount) = ParseRange(newPart.Substring(1));
            return (oldStart, oldCount, newStart, newCount);
        }

        /*
         * Parses a line range from a hunk header.
         */
        static (int Start, int Count) ParseRange(string range)
        {
            var parts = range.Split(',');
            if (parts.Length == 1)
            {
                var start = ParseInt(parts[0]);
                return (start, start == 0 ? 0 : 1);
            }

            return (ParseInt(parts[0]), ParseInt(parts[1]));
        }

        /*
         * Parses an integer invariantly.
         */
        static int ParseInt(string value)
        {
            if (!int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var result))
                throw new HyperlambdaException("Invalid hunk header.");
            return result;
        }

        /*
         * Ensures the current original line matches the expected line.
         */
        /*
         * Verifies that the original line we are about to consume is the line the hunk expects.
         *
         * This is the check that keeps patching safe - a hunk is never applied onto content it does
         * not match - and it stays strict even when the hunk was LOCATED with a tolerant comparison.
         */
        static void EnsureLineMatch(
            IReadOnlyList<string> originalLines,
            int index,
            string expected,
            bool ignoreTrailingWhitespace)
        {
            if (index >= originalLines.Count)
                throw new HyperlambdaException(
                    "Patch could not be applied. The hunk expected '" +
                    Ellipsis(expected) +
                    "' at line " +
                    (index + 1).ToString(CultureInfo.InvariantCulture) +
                    ", but the file has only " +
                    originalLines.Count.ToString(CultureInfo.InvariantCulture) +
                    " lines.");

            if (!LinesMatch(originalLines[index], expected, ignoreTrailingWhitespace))
                throw new HyperlambdaException(
                    "Patch could not be applied. Line " +
                    (index + 1).ToString(CultureInfo.InvariantCulture) +
                    " is '" +
                    Ellipsis(originalLines[index]) +
                    "' but the hunk expected '" +
                    Ellipsis(expected) +
                    "'.");
        }

        /*
         * Resolves the position in the original file where a hunk should be applied.
         *
         * The hunk header tells us where the hunk belonged in the file the patch was created
         * against, so we start there and widen outwards, taking the NEAREST position whose content
         * matches. Requiring the context to instead be unique across the whole file - which is what
         * this method used to do - rejects most real patches, since repeated lines such as a closing
         * brace, a blank line or a bare 'return' are entirely normal.
         *
         * Locating a hunk is therefore fuzzy, while applying one stays strict: EnsureLineMatch still
         * verifies every context and removed line at the position we settle on.
         *
         * The search is run twice, first comparing lines exactly, and only if that finds nothing,
         * comparing them ignoring trailing whitespace. The second pass exists for formats where
         * trailing whitespace is meaningful but invisible, most notably Markdown, where two trailing
         * spaces denote a hard line break and are routinely lost when a patch is written by hand.
         */
        static (int Index, bool WhitespaceFuzz) ResolveHunkTargetIndex(
            IReadOnlyList<string> originalLines,
            int originalIndex,
            IReadOnlyList<string> hunkLines,
            int expectedIndex)
        {
            // Hunks are applied in order, so we can never move backwards past what we already consumed.
            if (expectedIndex < originalIndex)
                expectedIndex = originalIndex;
            if (expectedIndex > originalLines.Count)
                expectedIndex = originalLines.Count;

            foreach (var ignoreTrailingWhitespace in new[] { false, true })
            {
                if (HunkMatchesAt(originalLines, expectedIndex, hunkLines, ignoreTrailingWhitespace))
                    return (expectedIndex, ignoreTrailingWhitespace);

                for (var radius = 1; radius <= MaxFuzzRadius; radius++)
                {
                    var after = expectedIndex + radius;
                    var before = expectedIndex - radius;
                    var afterLegal = after <= originalLines.Count;
                    var beforeLegal = before >= originalIndex;

                    // Nothing left to search in either direction.
                    if (!afterLegal && !beforeLegal)
                        break;

                    if (afterLegal && HunkMatchesAt(originalLines, after, hunkLines, ignoreTrailingWhitespace))
                        return (after, ignoreTrailingWhitespace);

                    if (beforeLegal && HunkMatchesAt(originalLines, before, hunkLines, ignoreTrailingWhitespace))
                        return (before, ignoreTrailingWhitespace);
                }
            }

            throw new HyperlambdaException(
                "Hunk could not be applied. No position matching its context was found within " +
                MaxFuzzRadius.ToString(CultureInfo.InvariantCulture) +
                " lines of line " +
                (expectedIndex + 1).ToString(CultureInfo.InvariantCulture) +
                ".");
        }

        static bool HunkMatchesAt(
            IReadOnlyList<string> originalLines,
            int candidate,
            IReadOnlyList<string> hunkLines,
            bool ignoreTrailingWhitespace)
        {
            var index = candidate;
            foreach (var hunkLine in hunkLines)
            {
                // An entirely empty line is an empty context line whose leading space was
                // stripped somewhere in transport.
                var tag = hunkLine.Length == 0 ? ' ' : hunkLine[0];
                switch (tag)
                {
                    case ' ':
                    case '-':
                        if (index >= originalLines.Count)
                            return false;
                        var expected = hunkLine.Length > 1 ? hunkLine.Substring(1) : string.Empty;
                        if (!LinesMatch(originalLines[index], expected, ignoreTrailingWhitespace))
                            return false;
                        index++;
                        break;
                    case '+':
                    case '\\':
                        break;
                    default:
                        return false;
                }
            }

            return true;
        }

        /*
         * Compares one original line against the line a hunk expects.
         */
        static bool LinesMatch(string actual, string expected, bool ignoreTrailingWhitespace)
        {
            if (string.Equals(actual, expected, StringComparison.InvariantCulture))
                return true;

            if (!ignoreTrailingWhitespace)
                return false;

            return string.Equals(actual.TrimEnd(), expected.TrimEnd(), StringComparison.InvariantCulture);
        }

        /*
         * Keeps a single line short enough to be readable inside an exception message, since a
         * minified or generated file can legally hold its entire content on one line.
         */
        static string Ellipsis(string value)
        {
            if (value == null)
                return string.Empty;

            return value.Length <= 120 ? value : value.Substring(0, 120) + "...";
        }

        static void ValidatePatchHeaders(string oldHeader, string newHeader, string targetPath)
        {
            var oldPath = NormalizeHeaderPath(oldHeader.Substring(4));
            var newPath = NormalizeHeaderPath(newHeader.Substring(4));

            if (!IsHeaderPathMatch(oldPath, targetPath) && !IsHeaderPathMatch(newPath, targetPath))
                throw new HyperlambdaException("Patch targets a different file.");
        }

        static string NormalizeHeaderPath(string value)
        {
            // Only a TAB separates the path from a timestamp, filenames can legally contain spaces.
            var path = value.Trim();
            var whitespaceIndex = path.IndexOf('\t');
            if (whitespaceIndex >= 0)
                path = path.Substring(0, whitespaceIndex);
            if (path.StartsWith("a/", StringComparison.InvariantCulture) ||
                path.StartsWith("b/", StringComparison.InvariantCulture))
                path = path.Substring(2);
            return path.Replace("\\", "/");
        }

        static bool IsHeaderPathMatch(string headerPath, string targetPath)
        {
            var normalizedTarget = targetPath.Replace("\\", "/");
            if (string.Equals(headerPath, normalizedTarget, StringComparison.InvariantCulture))
                return true;

            if (!headerPath.StartsWith("/", StringComparison.InvariantCulture))
                headerPath = "/" + headerPath;

            return normalizedTarget.EndsWith(headerPath, StringComparison.InvariantCulture);
        }

        static bool OriginalLineHasTrailingNewline(int index, int count, bool contentHasTrailingNewline)
        {
            return index < count - 1 || contentHasTrailingNewline;
        }

        /*
         * Splits text into lines, preserving empty lines.
         */
        static List<string> SplitLines(string text)
        {
            return text
                .Replace("\r\n", "\n")
                .Split(new[] { '\n' }, StringSplitOptions.None)
                .ToList();
        }

        static (List<string> Lines, bool HasTrailingNewline) SplitContentLines(string text)
        {
            var lines = SplitLines(text);
            var hasTrailingNewline = lines.Count > 0 && lines[lines.Count - 1].Length == 0;
            if (hasTrailingNewline)
                lines.RemoveAt(lines.Count - 1);
            return (lines, hasTrailingNewline);
        }

        #endregion
    }
}
