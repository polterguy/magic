/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using Xunit;
using magic.lambda.io.tests.helpers;
using magic.node.extensions;

namespace magic.lambda.io.tests
{
    public class ExtraIoTests
    {
        static string Patch(string patch, string original, string path = "/folder/existing.txt")
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

        [Fact]
        public void HeaderMatchingTargetWithoutLeadingSlashIsAccepted()
        {
            Assert.Equal(
                "a\nchanged\n",
                Patch("--- folder/existing.txt\n+++ folder/existing.txt\n@@ -1,2 +1,2 @@\n a\n-b\n+changed", "a\nb", "folder/existing.txt"));
        }

        [Fact]
        public void ExecuteFileReturnsDeclaredArgument()
        {
            var fileService = new FileService { LoadAction = _ => ".arguments\n   foo:string\nreturn:x:@.arguments/*/foo" };
            var lambda = Common.Evaluate("io.file.execute:/foo.hl\n   foo:xxx", fileService);
            Assert.Equal("xxx", lambda.Children.First().Value);
        }

        [Fact]
        public void ExecuteFileRejectsUndeclaredArgument()
        {
            var fileService = new FileService { LoadAction = _ => ".arguments\n   foo:string\nreturn:x" };
            var ex = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("io.file.execute:/foo.hl\n   bar:xxx", fileService));
            Assert.Contains("Argument 'bar' is not declared", ex.Message);
            Assert.Equal(400, ex.Status);
        }

        [Fact]
        public void ExecuteFileAliasUnwrapsNestedArguments()
        {
            var fileService = new FileService { LoadAction = _ => ".arguments\n   foo:*\nreturn:x:@.arguments/*/foo/*/inner" };
            var lambda = Common.Evaluate(".v:hello\nexecute-file:/foo.hl\n   foo\n      inner:x:@.v", fileService);
            Assert.Equal("hello", lambda.Children.Skip(1).First().Value);
        }

        [Fact]
        public void LoadRecursivelyReturnsRelativeNamesAndContent()
        {
            var root = AppDomain.CurrentDomain.BaseDirectory;
            var fileService = new FileService
            {
                LoadRecursivelyAction = (_, _) => new[]
                {
                    (root + "folder/a.txt", Encoding.UTF8.GetBytes("first")),
                    (root + "folder/b.txt", Encoding.UTF8.GetBytes("second")),
                },
            };
            var lambda = Common.Evaluate("io.file.load-recursively:/folder/", fileService);
            var result = lambda.Children.First();
            Assert.Null(result.Value);
            Assert.Equal(2, result.Children.Count());
            Assert.Equal("/folder/a.txt", result.Children.First().Children.First(x => x.Name == "name").Get<string>());
            Assert.Equal("second", result.Children.Skip(1).First().Children.First(x => x.Name == "content").Get<string>());
        }
    }
}
