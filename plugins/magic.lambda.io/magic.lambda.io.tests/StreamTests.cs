/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;
using magic.lambda.io.tests.helpers;

namespace magic.lambda.io.tests
{
    public class StreamTests
    {
        [Fact]
        public void OpenAndSaveFileFromStream()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = false;
            var openFileInvoked = false;
            var deleteInvoked = false;
            var streamService = new StreamService
            {
                SaveFileAction = (stream, path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/') + "/bar",
                        path);
                    Assert.True(stream.Length > 0);
                    var reader = new StreamReader(stream);
                    var content = reader.ReadToEnd();
                    Assert.Equal("foo bar", content);
                    saveInvoked = true;
                },
                OpenFileAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/') + "/foo",
                        path);
                    var stream = new MemoryStream();
                    var writer = new StreamWriter(stream);
                    writer.Write("foo bar");
                    writer.Flush();
                    stream.Flush();
                    stream.Position = 0;
                    openFileInvoked = true;
                    return stream;
                },
                ExistsAction = (path) => true,
                DeleteAction = (path) => 
                {
                    deleteInvoked = true;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.stream.open-file:foo
io.stream.save-file:bar
   get-value:x:@io.stream.open-file
io.stream.close:x:@io.stream.open-file
", null, null, streamService);
            Assert.True(saveInvoked);
            Assert.True(openFileInvoked);
            Assert.False(deleteInvoked);
        }

        [Fact]
        public async Task OpenAndSaveFileFromStreamAsync()
        {
            #region [ -- Setting up mock service(s) -- ]

            var saveInvoked = false;
            var openFileInvoked = false;
            var streamService = new StreamService
            {
                SaveFileAction = (stream, path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/') + "/bar",
                        path);
                    Assert.True(stream.Length > 0);
                    var reader = new StreamReader(stream);
                    var content = reader.ReadToEnd();
                    Assert.Equal("foo bar", content);
                    saveInvoked = true;
                },
                OpenFileAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/') + "/foo",
                        path);
                    var stream = new MemoryStream();
                    var writer = new StreamWriter(stream);
                    writer.Write("foo bar");
                    writer.Flush();
                    stream.Flush();
                    stream.Position = 0;
                    openFileInvoked = true;
                    return stream;
                },
                ExistsAction = (path) => false,
                DeleteAction = (path) => throw new HyperlambdaException("Shouldn't come here!")
            };

            #endregion

            var lambda = await Common.EvaluateAsync(@"
io.stream.open-file:foo
io.stream.save-file:bar
   get-value:x:@io.stream.open-file
", null, null, streamService);
            Assert.True(saveInvoked);
            Assert.True(openFileInvoked);
        }

        [Fact]
        public void OpenAndReadFileFromStream()
        {
            #region [ -- Setting up mock service(s) -- ]

            var openFileInvoked = false;
            var streamService = new StreamService
            {
                OpenFileAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/') + "/foo",
                        path);
                    var stream = new MemoryStream();
                    var writer = new StreamWriter(stream);
                    writer.Write("foo bar");
                    writer.Flush();
                    stream.Flush();
                    stream.Position = 0;
                    openFileInvoked = true;
                    return stream;
                }
            };

            #endregion

            var lambda = Common.Evaluate(@"
io.stream.open-file:foo
io.stream.read:x:@io.stream.open-file
convert:x:-
   type:string
", null, null, streamService);
            Assert.True(openFileInvoked);
            Assert.Equal("foo bar", lambda.Children.Skip(2).First().Value);
        }

        [Fact]
        public async Task OpenAndReadFileFromStreamAsync()
        {
            #region [ -- Setting up mock service(s) -- ]

            var openFileInvoked = false;
            var streamService = new StreamService
            {
                OpenFileAction = (path) =>
                {
                    Assert.Equal(
                        AppDomain.CurrentDomain.BaseDirectory.Replace("\\", "/").TrimEnd('/') + "/foo",
                        path);
                    var stream = new MemoryStream();
                    var writer = new StreamWriter(stream);
                    writer.Write("foo bar");
                    writer.Flush();
                    stream.Flush();
                    stream.Position = 0;
                    openFileInvoked = true;
                    return stream;
                }
            };

            #endregion

            var lambda = await Common.EvaluateAsync(@"
io.stream.open-file:foo
io.stream.read:x:@io.stream.open-file
convert:x:-
   type:string
", null, null, streamService);
            Assert.True(openFileInvoked);
            Assert.Equal("foo bar", lambda.Children.Skip(2).First().Value);
        }
    }
}
