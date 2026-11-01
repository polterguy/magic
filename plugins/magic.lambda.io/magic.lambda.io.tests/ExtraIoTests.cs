/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
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

        [Fact]
        public void ZipStreamHoldsStringAndBinaryEntries()
        {
            var lambda = Common.Evaluate(@"
.b64:SGVsbG8gYmluYXJ5
convert:x:-
   type:from-base64
io.content.zip-stream
   .:text.txt
      .:hello text
   .:binary.bin
      get-value:x:@convert");
            var stream = (Stream)lambda.Children.Skip(2).First().Value;
            using var archive = new System.IO.Compression.ZipArchive(stream, System.IO.Compression.ZipArchiveMode.Read);
            Assert.Equal(["text.txt", "binary.bin"], archive.Entries.Select(x => x.FullName).ToArray());
            Assert.Equal("hello text", new StreamReader(archive.GetEntry("text.txt").Open()).ReadToEnd());
            Assert.Equal("Hello binary", new StreamReader(archive.GetEntry("binary.bin").Open()).ReadToEnd());
        }

        [Fact]
        public void ZipStreamRejectsEmptyAndUnsupportedEntries()
        {
            var empty = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("io.content.zip-stream\n   .:empty.txt"));
            Assert.Contains("Empty entry", empty.Message);
            var unsupported = Assert.Throws<HyperlambdaException>(() => Common.Evaluate("io.content.zip-stream\n   .:number.txt\n      .:int:5"));
            Assert.Contains("string and byte[]", unsupported.Message);
        }

        [Fact]
        public void SaveBinaryWritesBytes()
        {
            string saved = null;
            var fileService = new FileService { SaveAction = (_, content) => saved = content };
            Common.Evaluate(@"
.b64:AQID
convert:x:-
   type:from-base64
io.file.save.binary:/data.bin
   get-value:x:@convert", fileService);
            Assert.Equal("\u0001\u0002\u0003", saved);
        }

        [Fact]
        public void StreamSaveHonoursTheOverwriteArgument()
        {
            var saved = false;
            var streamService = new StreamService { SaveFileAction = (_, _) => saved = true };
            Common.Evaluate(@"
io.stream.open-file:foo
io.stream.save-file:bar
   overwrite:bool:false
   get-value:x:@io.stream.open-file
io.stream.close:x:@io.stream.open-file", null, null, new StreamService
            {
                SaveFileAction = streamService.SaveFileAction,
                OpenFileAction = _ => new MemoryStream(Encoding.UTF8.GetBytes("x")),
                ExistsAction = _ => true,
                DeleteAction = _ => { },
            });
            Assert.True(saved);
        }
    }
}
