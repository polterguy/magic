/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Xunit;

namespace magic.lambda.sqlite.tests
{
    /*
     * Tests the two slots the other runtime tests leave out. [sqlite.backup] writes into a folder relative to the
     * working directory of the process, which is where the test creates and removes its file, and
     * [sqlite.load-extension] is given extensions that do not exist, since it is the code leading up to
     * loading one, and the failure of loading it, that is tested.
     */
    public class SqliteBackupAndExtensionTests : IDisposable
    {
        readonly Runtime _runtime = new Runtime();

        public void Dispose()
        {
            _runtime.Dispose();
            GC.SuppressFinalize(this);
        }

        [Fact]
        public async Task BackupWritesTheDatabaseToDisc()
        {
            var folder = Path.Combine("files", "data");
            Directory.CreateDirectory(folder);
            var name = "magic-backup-test-" + Guid.NewGuid().ToString("N") + ".db";
            var path = Path.Combine(folder, name);
            try
            {
                await _runtime.EvaluateAsync(@"sqlite.connect:{db}
   sqlite.execute:create table people (id integer primary key autoincrement, name text not null)
   sqlite.execute:insert into people (name) values ('Ada')
   sqlite.backup:" + name);
                Assert.True(File.Exists(path));
                Assert.True(new FileInfo(path).Length > 0);
            }
            finally
            {
                SqliteConnection.ClearAllPools();
                if (File.Exists(path))
                    File.Delete(path);
            }
        }

        [Theory]
        [InlineData("../escaped.db")]
        [InlineData("sub/escaped.db")]
        [InlineData("..")]
        public async Task BackupRefusesNamesThatAreNotAFilename(string name)
        {
            // Anything but a bare filename, which would reach outside files/data/.
            var ex = await Assert.ThrowsAnyAsync<Exception>(() => _runtime.EvaluateAsync(@"sqlite.connect:{db}
   sqlite.execute:create table people (id integer primary key autoincrement, name text not null)
   sqlite.backup:" + name));
            Assert.Contains("expects a filename", ex.Message);
        }

        [Fact]
        public async Task LoadMissingExtensionThrows()
        {
            await Assert.ThrowsAnyAsync<Exception>(() => _runtime.EvaluateAsync(@"sqlite.connect:{db}
   sqlite.load-extension
      file:magic-extension-that-does-not-exist"));
        }

        [Fact]
        public async Task LoadMissingExtensionWithEntryPointThrows()
        {
            await Assert.ThrowsAnyAsync<Exception>(() => _runtime.EvaluateAsync(@"sqlite.connect:{db}
   sqlite.load-extension
      file:magic-extension-that-does-not-exist
      proc:some_init_function"));
        }

        [Fact]
        public async Task LoadMissingExtensionWithoutPlatformSuffixThrows()
        {
            await Assert.ThrowsAnyAsync<Exception>(() => _runtime.EvaluateAsync(@"sqlite.connect:{db}
   sqlite.load-extension
      file:magic-extension-that-does-not-exist
      append-platform:bool:false"));
        }

        [Fact]
        public async Task LoadMissingExtensionWithPlatformSuffixThrows()
        {
            await Assert.ThrowsAnyAsync<Exception>(() => _runtime.EvaluateAsync(@"sqlite.connect:{db}
   sqlite.load-extension
      file:magic-extension-that-does-not-exist
      append-platform:bool:true"));
        }
    }
}
