/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using Xunit;
using magic.node.extensions;

namespace magic.node.tests
{
    /*
     * Changes the PATH of the process while it runs, which is why the tests are not allowed to run beside others.
     */
    [Collection("process-wide state")]
    public sealed class ExecutablesTests : IDisposable
    {
        readonly string _path = Environment.GetEnvironmentVariable("PATH");
        readonly string _folder = Path.Combine(Path.GetTempPath(), "magic-executables-" + Guid.NewGuid().ToString("N"));

        public ExecutablesTests()
        {
            Directory.CreateDirectory(_folder);
        }

        public void Dispose()
        {
            Environment.SetEnvironmentVariable("PATH", _path);
            Directory.Delete(_folder, true);
            GC.SuppressFinalize(this);
        }

        string Tool(string name)
        {
            var path = Path.Combine(_folder, name + (OperatingSystem.IsWindows() ? ".exe" : ""));
            File.WriteAllText(path, "");
            return path;
        }

        [Fact]
        public void ExecutableOnThePathIsFoundByItsAbsolutePath()
        {
            var tool = Tool("magic-test-tool");
            Environment.SetEnvironmentVariable("PATH", _folder);
            var found = Executables.Find("magic-test-tool");
            Assert.Equal(tool, found);
            Assert.True(Path.IsPathRooted(found));
        }

        [Fact]
        public void UnknownExecutableIsNotFound()
        {
            Environment.SetEnvironmentVariable("PATH", _folder);
            Assert.Null(Executables.Find("magic-no-such-tool"));
        }

        [Fact]
        public void FirstFolderOfThePathWins()
        {
            var other = Path.Combine(_folder, "other");
            Directory.CreateDirectory(other);
            var tool = Tool("magic-shared-tool");
            File.WriteAllText(Path.Combine(other, Path.GetFileName(tool)), "");
            Environment.SetEnvironmentVariable("PATH", string.Join(Path.PathSeparator, _folder, other));
            Assert.Equal(tool, Executables.Find("magic-shared-tool"));
        }

        [Fact]
        public void RelativeFoldersOfThePathAreIgnored()
        {
            var tool = Tool("magic-relative-tool");
            var relative = Path.GetRelativePath(Directory.GetCurrentDirectory(), _folder);
            Environment.SetEnvironmentVariable("PATH", relative);
            Assert.False(Path.IsPathRooted(relative));
            Assert.Null(Executables.Find(Path.GetFileNameWithoutExtension(tool)));
        }

        [Fact]
        public void AbsolutePathsAreReturnedWhenTheFileExists()
        {
            var tool = Tool("magic-absolute-tool");
            Assert.Equal(tool, Executables.Find(tool));
            Assert.Null(Executables.Find(Path.Combine(_folder, "does-not-exist")));
        }

        [Fact]
        public void MissingPathVariableFindsNothing()
        {
            Environment.SetEnvironmentVariable("PATH", null);
            Assert.Null(Executables.Find("git"));
        }
    }
}
