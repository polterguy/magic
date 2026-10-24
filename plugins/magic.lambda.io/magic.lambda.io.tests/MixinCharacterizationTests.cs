/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Text;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.lambda.io.tests.helpers;

namespace magic.lambda.io.tests
{
    /*
     * Pins the exact output of [io.file.mixin], quirks included, by comparing it with a verbatim copy of the character
     * by character implementation it had before it was changed to read the file in one go.
     */
    public class MixinCharacterizationTests
    {
        static string Reference(StreamReader reader, Node lambda, string filename)
        {
            var builder = new StringBuilder();
            while (reader.Peek() != -1)
            {
                var cur = (char)reader.Read();
                switch (cur)
                {
                    case '\\':
                        builder.Append((char)reader.Read());
                        break;

                    case '{':
                        var next = (char)reader.Read();
                        if (next != '{')
                        {
                            builder.Append(cur).Append(next);
                            continue;
                        }
                        var lambdaExpression = ReferenceToEndOfScope(reader);
                        var exe = Expression.Create(lambdaExpression).Evaluate(lambda).FirstOrDefault() ??
                            throw new HyperlambdaException($"Expression '{lambdaExpression}' referenced in mixin file '{filename}' returned no nodes");
                        builder.Append(exe.GetEx<string>());
                        break;

                    default:
                        builder.Append(cur);
                        break;
                }
            }
            return builder.ToString();
        }

        static string ReferenceToEndOfScope(StreamReader reader)
        {
            var builder = new StringBuilder();
            while (reader.Peek() != -1)
            {
                var cur = (char)reader.Read();
                switch (cur)
                {
                    case '\\':
                        builder.Append((char)reader.Read());
                        break;

                    case '}':
                        var next = (char)reader.Read();
                        if (next != '}')
                        {
                            builder.Append(cur).Append(next);
                            continue;
                        }
                        return builder.ToString();

                    default:
                        builder.Append(cur);
                        break;
                }
            }
            throw new HyperlambdaException("Server side include was never closed!");
        }

        static (string Result, string Error) Run(byte[] content, bool real)
        {
            const string filename = "/etc/page.html";
            try
            {
                if (!real)
                {
                    var lambda = new Node("io.file.mixin", filename);   // What [io.file.mixin] hands the substitution logic
                    lambda.Add(new Node(".x", "X"));
                    using (var reader = new StreamReader(new MemoryStream(content)))
                        return (Reference(reader, lambda, filename), null);
                }
                var fileService = new FileService
                {
                    ExistsAction = (path) => path.EndsWith("/etc/page.hl"),
                    LoadAction = (path) => ".x:X",
                };
                var streamService = new StreamService { OpenFileAction = (path) => new MemoryStream(content) };
                var result = Common.Evaluate("io.file.mixin:" + filename, fileService, streamService: streamService);
                return (result.Children.First().Get<string>(), null);
            }
            catch (HyperlambdaException err)
            {
                return (null, err.Message);
            }
        }

        static void Pin(string text)
        {
            var bytes = Encoding.UTF8.GetBytes(text);
            Assert.Equal(Run(bytes, false), Run(bytes, true));
        }

        [Theory]
        [InlineData("")]
        [InlineData("<p>no placeholders at all</p>")]
        [InlineData("a{{*/.x}}b")]
        [InlineData("a{{.x}}b")]
        [InlineData("{{.x}}")]
        [InlineData("{{*/.x}}{{*/.x}}{{*/.x}}")]
        [InlineData("{{.x}}{{.x}}{{.x}}")]
        [InlineData("a\\{{*/.x}}b")]
        [InlineData("a\\\\b")]
        [InlineData("trailing backslash\\")]
        [InlineData("trailing brace {")]
        [InlineData("single { brace } inside")]
        [InlineData("{{.x")]
        [InlineData("{{.x}")]
        [InlineData("{{.missing}}")]
        [InlineData("{{*/.x\\}}}")]
        [InlineData("{{ .x}}")]
        [InlineData("}}{{.x}}}}")]
        [InlineData("é😀 {{*/.x}} ü")]
        [InlineData("line one\r\nline two {{*/.x}}\r\n")]
        public void KnownCases_MatchTheCharacterByCharacterImplementation(string text)
        {
            Pin(text);
        }

        [Fact]
        public void ByteOrderMark_IsHandledTheSame()
        {
            var bytes = new byte[] { 0xEF, 0xBB, 0xBF }.Concat(Encoding.UTF8.GetBytes("<p>{{*/.x}}</p>")).ToArray();
            Assert.Equal(Run(bytes, false), Run(bytes, true));
        }

        [Fact]
        public void RandomDocuments_MatchTheCharacterByCharacterImplementation()
        {
            var parts = new[] { "a", "b", " ", "\n", "é", "😀", "{", "}", "\\", "{{*/.x}}", "{{.x}}", "{{*/.missing}}", "{{", "}}", "<div class=\"x\">", "</div>" };
            var random = new Random(5000);
            for (var iteration = 0; iteration < 3000; iteration++)
            {
                var builder = new StringBuilder();
                for (var idx = random.Next(0, 14); idx > 0; idx--)
                    builder.Append(parts[random.Next(parts.Length)]);
                Pin(builder.ToString());
            }
        }

        [Fact]
        public void LargeDocument_MatchesTheCharacterByCharacterImplementation()
        {
            var builder = new StringBuilder();
            for (var idx = 0; idx < 2000; idx++)
                builder.Append("<p class=\"entry\">paragraph ").Append(idx).Append(" with {{*/.x}} and \\{ escaped</p>\n");
            Pin(builder.ToString());
        }
    }
}
