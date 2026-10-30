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
using magic.lambda.io.helpers;

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
    public class PatchFile : ISlotAsync, IWhitelistComparer
    {
        const string InvalidPatchLine = "Invalid patch line.";


        /// <inheritdoc />
        public Func<string, string, bool> Comparer => Utilities.MatchesFile;
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
            await signaler.SignalAsync("eval", input, skipWhitelist: true);

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
            return new Patcher(originalLines, originalHasTrailingNewline, patchLines, targetPath).Apply(newline);
        }

        /*
         * Walks a patch, applying each of its hunks to the original lines, while keeping track of
         * where we are in both of them.
         */
        sealed class Patcher
        {
            readonly List<string> _output = [];
            bool _outputHasTrailingNewline;
            bool _hasHunks;
            bool _seenHeader;
            int _originalIndex;
            int _patchIndex;

            readonly List<string> _originalLines;
            readonly bool _originalHasTrailingNewline;
            readonly List<string> _patchLines;
            readonly string _targetPath;

            public Patcher(
                List<string> originalLines,
                bool originalHasTrailingNewline,
                List<string> patchLines,
                string targetPath)
            {
                _originalLines = originalLines;
                _originalHasTrailingNewline = originalHasTrailingNewline;
                _patchLines = patchLines;
                _targetPath = targetPath;
                _outputHasTrailingNewline = originalHasTrailingNewline;
            }

            public string Apply(string newline)
            {
                while (_patchIndex < _patchLines.Count)
                {
                    ReadNext();
                }

                if (!_hasHunks)
                    throw new HyperlambdaException("Patch does not contain any hunks.");

                // Append remaining original lines.
                while (_originalIndex < _originalLines.Count)
                {
                    _output.Add(_originalLines[_originalIndex]);
                    _outputHasTrailingNewline = OriginalLineHasTrailingNewline(_originalIndex, _originalLines.Count, _originalHasTrailingNewline);
                    _originalIndex++;
                }

                if (_output.Count == 0)
                    return string.Empty;

                return string.Join(newline, _output) + (_outputHasTrailingNewline ? newline : string.Empty);
            }

            /*
             * Consumes the next preamble, header or hunk of the patch.
             */
            void ReadNext()
            {
                var line = _patchLines[_patchIndex];

                if (IsGitPreamble(line))
                {
                    // A git preamble after hunks have started implies a second file.
                    if (_hasHunks)
                        throw new HyperlambdaException("Patch can only modify a single file.");

                    _patchIndex++;
                    return;
                }

                if (line.StartsWith("--- ", StringComparison.InvariantCulture))
                {
                    ReadHeader(line);
                    return;
                }

                if (line.StartsWith("+++ ", StringComparison.InvariantCulture))
                    throw new HyperlambdaException("Invalid patch header.");

                if (!line.StartsWith("@@", StringComparison.InvariantCulture))
                    throw new HyperlambdaException("Invalid patch.");

                ApplyHunk(line);
            }

            static bool IsGitPreamble(string line)
            {
                return line.StartsWith("diff --git", StringComparison.InvariantCulture) ||
                    line.StartsWith("index ", StringComparison.InvariantCulture);
            }

            void ReadHeader(string line)
            {
                if (_seenHeader)
                    throw new HyperlambdaException("Patch can only modify a single file.");

                if (_patchIndex + 1 >= _patchLines.Count || !_patchLines[_patchIndex + 1].StartsWith("+++ ", StringComparison.InvariantCulture))
                    throw new HyperlambdaException("Invalid patch header.");

                ValidatePatchHeaders(line, _patchLines[_patchIndex + 1], _targetPath);
                _seenHeader = true;
                _patchIndex += 2;
            }

            void ApplyHunk(string headerLine)
            {
                var header = ParseHunkHeader(headerLine);
                _hasHunks = true;
                _patchIndex++;
                var hunkLines = ReadHunkLines();

                /*
                 * The hunk header declares where the hunk belongs in the original file, and we use it
                 * as our anchor. It is a hint and not a guarantee, since the file might have drifted
                 * since the patch was created, so the resolver is allowed to search outwards from it.
                 */
                var expectedIndex = header.OldStart > 0 ? header.OldStart - 1 : 0;
                var (targetIndex, whitespaceFuzz) = ResolveHunkTargetIndex(_originalLines, _originalIndex, hunkLines, expectedIndex);

                // Copy unchanged lines before hunk.
                while (_originalIndex < targetIndex && _originalIndex < _originalLines.Count)
                {
                    _output.Add(_originalLines[_originalIndex]);
                    _originalIndex++;
                }

                var previousOperation = '\0';
                foreach (var hunkLine in hunkLines)
                {
                    // An entirely empty line is an empty context line whose leading space was
                    // stripped somewhere in transport.
                    var tag = hunkLine.Length == 0 ? ' ' : hunkLine[0];
                    ApplyHunkLine(hunkLine, tag, previousOperation, whitespaceFuzz);
                    previousOperation = tag;
                }
            }

            /*
             * Returns the lines of the hunk starting at the current position.
             *
             * Notice, "--- " does NOT terminate a hunk, since it is also a legal deletion of
             * a line starting with "-- " (an SQL comment for instance). Headers are only legal
             * before the first hunk, making everything up to the next hunk or git preamble content.
             */
            List<string> ReadHunkLines()
            {
                var hunkLines = new List<string>();
                while (_patchIndex < _patchLines.Count)
                {
                    var line = _patchLines[_patchIndex];
                    if (line.StartsWith("@@", StringComparison.InvariantCulture) || IsGitPreamble(line))
                        break;

                    hunkLines.Add(line);
                    _patchIndex++;
                }
                return hunkLines;
            }

            void ApplyHunkLine(string hunkLine, char tag, char previousOperation, bool whitespaceFuzz)
            {
                var text = hunkLine.Length > 1 ? hunkLine.Substring(1) : string.Empty;
                switch (tag)
                {
                    case ' ':
                        EnsureLineMatch(_originalLines, _originalIndex, text, whitespaceFuzz);

                        // Notice, we deliberately keep the ORIGINAL line rather than the patch's
                        // version of it, so that a whitespace tolerant match cannot silently
                        // rewrite trailing whitespace the file's author put there on purpose.
                        _output.Add(_originalLines[_originalIndex]);
                        _outputHasTrailingNewline = true;
                        _originalIndex++;
                        break;

                    case '-':
                        EnsureLineMatch(_originalLines, _originalIndex, text, whitespaceFuzz);
                        _originalIndex++;
                        break;

                    case '+':
                        _output.Add(text);
                        _outputHasTrailingNewline = true;
                        break;

                    case '\\':
                        ApplyNoNewlineMarker(hunkLine, previousOperation);
                        break;

                    default:
                        throw new HyperlambdaException(InvalidPatchLine);
                }
            }

            void ApplyNoNewlineMarker(string hunkLine, char previousOperation)
            {
                if (!string.Equals(hunkLine, "\\ No newline at end of file", StringComparison.InvariantCulture))
                    throw new HyperlambdaException(InvalidPatchLine);
                if (previousOperation == '\0')
                    throw new HyperlambdaException(InvalidPatchLine);

                if (previousOperation == ' ' || previousOperation == '+')
                    _outputHasTrailingNewline = false;
                else if (previousOperation != '-')
                    throw new HyperlambdaException(InvalidPatchLine);
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

                if (!oldPart.StartsWith('-') ||
                    !newPart.StartsWith('+'))
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
                List<string> originalLines,
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
                List<string> originalLines,
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
                    var found = FindNearestMatch(originalLines, originalIndex, hunkLines, expectedIndex, ignoreTrailingWhitespace);
                    if (found != null)
                        return (found.Value, ignoreTrailingWhitespace);
                }

                throw new HyperlambdaException(
                    "Hunk could not be applied. No position matching its context was found within " +
                    MaxFuzzRadius.ToString(CultureInfo.InvariantCulture) +
                    " lines of line " +
                    (expectedIndex + 1).ToString(CultureInfo.InvariantCulture) +
                    ".");
            }

            /*
             * Returns the position nearest to the expected one where the hunk matches, or null if there is none.
             */
            static int? FindNearestMatch(
                List<string> originalLines,
                int originalIndex,
                IReadOnlyList<string> hunkLines,
                int expectedIndex,
                bool ignoreTrailingWhitespace)
            {
                if (HunkMatchesAt(originalLines, expectedIndex, hunkLines, ignoreTrailingWhitespace))
                    return expectedIndex;

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
                        return after;

                    if (beforeLegal && HunkMatchesAt(originalLines, before, hunkLines, ignoreTrailingWhitespace))
                        return before;
                }

                return null;
            }

            static bool HunkMatchesAt(
                List<string> originalLines,
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

                return value.Length <= 120 ? value : string.Concat(value.AsSpan(0, 120), "...");
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

                if (!headerPath.StartsWith('/'))
                    headerPath = "/" + headerPath;

                return normalizedTarget.EndsWith(headerPath, StringComparison.InvariantCulture);
            }

            static bool OriginalLineHasTrailingNewline(int index, int count, bool contentHasTrailingNewline)
            {
                return index < count - 1 || contentHasTrailingNewline;
            }
        }

        /*
         * Splits text into lines, preserving empty lines.
         */
        static List<string> SplitLines(string text)
        {
            return text
                .Replace("\r\n", "\n")
                .Split('\n', StringSplitOptions.None)
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
