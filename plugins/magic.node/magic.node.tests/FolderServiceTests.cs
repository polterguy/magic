/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Threading.Tasks;
using Xunit;
using magic.node.services;
using magic.node.extensions;

namespace magic.node.tests
{
    public sealed class FolderServiceTests : IDisposable
    {
        readonly string _root = Path.Combine(Path.GetTempPath(), "magic-folderservice-" + Guid.NewGuid().ToString("N"));
        readonly FileService _files = new FileService();
        readonly FolderService _folders;

        public FolderServiceTests()
        {
            Directory.CreateDirectory(_root);
            _folders = new FolderService(_files);
        }

        public void Dispose()
        {
            Directory.Delete(_root, true);
        }

        string P(string name) => Path.Combine(_root, name).Replace("\\", "/");

        [Fact]
        public async Task CreateExistsAndDelete()
        {
            Assert.False(await _folders.ExistsAsync(P("a/b")));
            await _folders.CreateAsync(P("a/b"));
            Assert.True(await _folders.ExistsAsync(P("a/b")));
            await _folders.DeleteAsync(P("a"));
            Assert.False(await _folders.ExistsAsync(P("a")));
        }

        [Fact]
        public async Task CopyCopiesFilesAndSubFolders()
        {
            await _folders.CreateAsync(P("source/sub"));
            await _files.SaveAsync(P("source/one.txt"), "one");
            await _files.SaveAsync(P("source/sub/two.txt"), "two");

            await _folders.CopyAsync(P("source"), P("copy"));

            Assert.Equal("one", await _files.LoadAsync(P("copy/one.txt")));
            Assert.Equal("two", await _files.LoadAsync(P("copy/sub/two.txt")));
            Assert.True(await _folders.ExistsAsync(P("source")));
        }

        [Fact]
        public async Task CopyOfMissingFolderThrows()
        {
            var ex = await Assert.ThrowsAsync<HyperlambdaException>(() => _folders.CopyAsync(P("nope"), P("copy")));
            Assert.Contains("nope", ex.Message);
        }

        [Fact]
        public async Task MoveRemovesTheSource()
        {
            await _folders.CreateAsync(P("source/sub"));
            await _files.SaveAsync(P("source/sub/two.txt"), "two");

            await _folders.MoveAsync(P("source"), P("moved"));

            Assert.False(await _folders.ExistsAsync(P("source")));
            Assert.Equal("two", await _files.LoadAsync(P("moved/sub/two.txt")));
        }

        [Fact]
        public async Task ListReturnsOnlyDirectChildrenSortedWithTrailingSlash()
        {
            await _folders.CreateAsync(P("b"));
            await _folders.CreateAsync(P("a/inner"));
            await _files.SaveAsync(P("file.txt"), "x");

            Assert.Equal(new[] { P("a") + "/", P("b") + "/" }, _folders.List(P("")).ToArray());
        }

        [Fact]
        public async Task ListAllReturnsEveryFolderDepthFirst()
        {
            await _folders.CreateAsync(P("a/inner/deep"));
            await _folders.CreateAsync(P("b"));

            Assert.Equal(
                new[] { P("a") + "/", P("a/inner") + "/", P("a/inner/deep") + "/", P("b") + "/" },
                _folders.ListAll(P("")).ToArray());
        }
    }

    static class ListExtensions
    {
        public static T[] ToArray<T>(this System.Collections.Generic.List<T> list) => list.ToArray();
    }
}
