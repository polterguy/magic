/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.lambda.io.tests.helpers;

namespace magic.lambda.io.tests
{
    public sealed class SearchFileTests : IDisposable
    {
        readonly string _name = "search-tests-" + Guid.NewGuid().ToString("N");
        readonly string _folder;

        public SearchFileTests()
        {
            _folder = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, _name);
            Directory.CreateDirectory(Path.Combine(_folder, "sub"));
            File.WriteAllText(Path.Combine(_folder, "a.txt"), "Hello World\nnothing here\nhello again\n");
            File.WriteAllText(Path.Combine(_folder, "b.hl"), "world of hyperlambda\nWORLD\n");
            File.WriteAllText(Path.Combine(_folder, "sub", "c.txt"), "no match\nfoo world\n");
            File.WriteAllText(Path.Combine(_folder, "sub", "d.md"), "unrelated\n");
        }

        public void Dispose()
        {
            Directory.Delete(_folder, true);
        }

        Node Search(string arguments)
        {
            var fileService = new FileService
            {
                ListFilesRecursivelyAction = (folder, extension) => Directory
                    .GetFiles(folder, "*", SearchOption.AllDirectories)
                    .Select(x => x.Replace("\\", "/"))
                    .OrderBy(x => x, StringComparer.Ordinal)
                    .ToList(),
            };
            var lambda = Common.Evaluate($"io.file.search:/{_name}/\n{arguments}", fileService);
            return lambda.Children.First();
        }

        static string[] Files(Node result) =>
            result.Children.Select(x => x.Children.First(y => y.Name == "file").Get<string>().Split('/').Last()).ToArray();

        static int[] Lines(Node result, string file) =>
            result.Children
                .First(x => x.Children.First(y => y.Name == "file").Get<string>().EndsWith("/" + file))
                .Children.First(x => x.Name == "lines").Children.Select(x => x.Get<int>()).ToArray();

        [Fact]
        public void FindsLinesIgnoringCaseByDefault()
        {
            var result = Search("   pattern:world");
            Assert.Null(result.Value);
            Assert.Equal<string>(["a.txt", "b.hl", "c.txt"], Files(result));
            Assert.Equal<int>([1], Lines(result, "a.txt"));
            Assert.Equal<int>([1, 2], Lines(result, "b.hl"));
            Assert.Equal<int>([2], Lines(result, "c.txt"));
        }

        [Fact]
        public void ReportsPathsRelativeToTheRoot()
        {
            var result = Search("   pattern:again");
            var file = result.Children.First().Children.First(x => x.Name == "file").Get<string>();
            Assert.Equal($"/{_name}/a.txt", file);
        }

        [Fact]
        public void CaseSensitiveSearch()
        {
            var result = Search("   pattern:WORLD\n   case-sensitive:true");
            Assert.Equal<string>(["b.hl"], Files(result));
            Assert.Equal<int>([2], Lines(result, "b.hl"));
        }

        [Fact]
        public void RegularExpressionSearch()
        {
            var result = Search("   pattern:^h.llo\n   regex:true");
            Assert.Equal<string>(["a.txt"], Files(result));
            Assert.Equal<int>([1, 3], Lines(result, "a.txt"));
        }

        [Fact]
        public void CaseSensitiveRegularExpressionSearch()
        {
            var result = Search("   pattern:^h.llo\n   regex:true\n   case-sensitive:true");
            Assert.Equal<int>([3], Lines(result, "a.txt"));
        }

        [Fact]
        public void ExtensionsAreOptionalWithOrWithoutDot()
        {
            Assert.Equal<string>(["b.hl"], Files(Search("   pattern:world\n   extensions:hl")));
            Assert.Equal<string>(["a.txt", "c.txt"], Files(Search("   pattern:world\n   extensions:\".txt\"")));
            Assert.Equal<string>(["a.txt", "b.hl", "c.txt"], Files(Search("   pattern:world\n   extensions:\"hl, .TXT\"")));
        }

        [Fact]
        public void NoMatchesGivesNoChildren()
        {
            Assert.Empty(Search("   pattern:nothing-like-this-exists-anywhere").Children);
        }

        [Fact]
        public void MissingPatternThrows()
        {
            Assert.Throws<HyperlambdaException>(() => Search("   regex:true"));
            Assert.Throws<HyperlambdaException>(() => Search("   pattern:\"  \""));
        }
    }
}
