/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.services;

namespace magic.node.tests
{
    public sealed class FileServiceTests : IDisposable
    {
        readonly string _root = Path.Combine(Path.GetTempPath(), "magic-fileservice-" + Guid.NewGuid().ToString("N"));
        readonly FileService _service = new FileService();

        public FileServiceTests()
        {
            Directory.CreateDirectory(_root);
        }

        public void Dispose()
        {
            Directory.Delete(_root, true);
        }

        string Path_(string name) => Path.Combine(_root, name).Replace("\\", "/");

        [Fact]
        public async Task SaveLoadText()
        {
            await _service.SaveAsync(Path_("a.txt"), "hello");
            Assert.Equal("hello", await _service.LoadAsync(Path_("a.txt")));
        }

        [Fact]
        public async Task SaveLoadBinary()
        {
            var bytes = new byte[] { 1, 2, 3, 255 };
            await _service.SaveAsync(Path_("a.bin"), bytes);
            Assert.Equal(bytes, await _service.LoadBinaryAsync(Path_("a.bin")));
        }

        [Fact]
        public async Task Exists()
        {
            Assert.False(await _service.ExistsAsync(Path_("a.txt")));
            await _service.SaveAsync(Path_("a.txt"), "x");
            Assert.True(await _service.ExistsAsync(Path_("a.txt")));
        }

        [Fact]
        public async Task Copy()
        {
            await _service.SaveAsync(Path_("a.txt"), "copy me");
            await _service.CopyAsync(Path_("a.txt"), Path_("b.txt"));
            Assert.Equal("copy me", await _service.LoadAsync(Path_("b.txt")));
            Assert.True(await _service.ExistsAsync(Path_("a.txt")));
        }

        [Fact]
        public async Task Move()
        {
            await _service.SaveAsync(Path_("a.txt"), "move me");
            await _service.MoveAsync(Path_("a.txt"), Path_("b.txt"));
            Assert.Equal("move me", await _service.LoadAsync(Path_("b.txt")));
            Assert.False(await _service.ExistsAsync(Path_("a.txt")));
        }

        [Fact]
        public async Task Delete()
        {
            await _service.SaveAsync(Path_("a.txt"), "x");
            await _service.DeleteAsync(Path_("a.txt"));
            Assert.False(await _service.ExistsAsync(Path_("a.txt")));
        }

        [Fact]
        public async Task Stamp()
        {
            Assert.Null(_service.GetStamp(Path_("a.txt")));
            await _service.SaveAsync(Path_("a.txt"), "12345");
            var stamp = _service.GetStamp(Path_("a.txt"));
            Assert.NotNull(stamp);
            Assert.Equal(5, stamp.Value.Length);
        }

        [Fact]
        public async Task StampChangesWhenContentChanges()
        {
            await _service.SaveAsync(Path_("a.txt"), "12345");
            var before = _service.GetStamp(Path_("a.txt"));
            await _service.SaveAsync(Path_("a.txt"), "123456789");
            Assert.NotEqual(before, _service.GetStamp(Path_("a.txt")));
        }

        [Fact]
        public async Task ListSortedWithAndWithoutExtension()
        {
            await _service.SaveAsync(Path_("b.txt"), "x");
            await _service.SaveAsync(Path_("a.txt"), "x");
            await _service.SaveAsync(Path_("c.hl"), "x");
            Assert.Equal(
                new[] { Path_("a.txt"), Path_("b.txt"), Path_("c.hl") },
                _service.List(_root));
            Assert.Equal(
                new[] { Path_("a.txt"), Path_("b.txt") },
                _service.List(_root, ".txt"));
        }

        [Fact]
        public async Task ListAllRecursesIntoFolders()
        {
            Directory.CreateDirectory(Path_("sub/deeper"));
            await _service.SaveAsync(Path_("a.txt"), "x");
            await _service.SaveAsync(Path_("sub/b.txt"), "x");
            await _service.SaveAsync(Path_("sub/deeper/c.txt"), "x");
            await _service.SaveAsync(Path_("sub/deeper/d.hl"), "x");
            Assert.Equal(
                new[] { Path_("a.txt"), Path_("sub/b.txt"), Path_("sub/deeper/c.txt"), Path_("sub/deeper/d.hl") },
                _service.ListAll(_root));
            Assert.Equal(
                new[] { Path_("a.txt"), Path_("sub/b.txt"), Path_("sub/deeper/c.txt") },
                _service.ListAll(_root, ".txt"));
        }

        [Fact]
        public async Task LoadAllLoadsEveryMatchingFile()
        {
            Directory.CreateDirectory(Path_("sub"));
            await _service.SaveAsync(Path_("a.txt"), "one");
            await _service.SaveAsync(Path_("sub/b.txt"), "two");
            await _service.SaveAsync(Path_("c.hl"), "three");
            var all = (await _service.LoadAllAsync(_root, ".txt")).ToList();
            Assert.Equal(2, all.Count);
            Assert.Equal("one", System.Text.Encoding.UTF8.GetString(all.First(x => x.Filename == Path_("a.txt")).Content));
            Assert.Equal("two", System.Text.Encoding.UTF8.GetString(all.First(x => x.Filename == Path_("sub/b.txt")).Content));
        }
    }
}
