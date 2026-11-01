/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.git.tests
{
    /*
     * Remotes without a network, since a bare repository in another folder works as one.
     */
    public class RemoteGitTests
    {
        static string Identity => Runtime.Identity;

        static async Task<string> BareRemote(Runtime runtime)
        {
            await runtime.Call("git.create-repo", "/remote.git/", ("bare", true), ("branch", "main"));
            return runtime.FullPath("remote.git");
        }

        [GitFact]
        public async Task PushSendsCommitsToTheRemote()
        {
            using var runtime = new Runtime();
            var remote = await BareRemote(runtime);
            await runtime.Repo("/local/");
            await runtime.Call("git.remote.add", "/local/", ("url", remote));
            await runtime.Call("git.push", "/local/", ("branch", "main"), ("set-upstream", true));

            await runtime.Call("git.clone-repo", remote, ("path", "/check/"));
            Assert.Equal("one", File.ReadAllText(runtime.FullPath("check/a.txt")));
        }

        [GitFact]
        public async Task RemoteAddRequiresAUrlAndAcceptsAName()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/local/");
            Assert.Contains("'url'", (await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.remote.add", "/local/"))).Message);
            await runtime.Call("git.remote.add", "/local/", ("name", "upstream"), ("url", runtime.FullPath("somewhere.git")));
            await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.remote.add", "/local/", ("name", "upstream"), ("url", "x")));
        }

        [GitFact]
        public async Task PushToAnUnknownRemoteThrows()
        {
            using var runtime = new Runtime();
            await runtime.Repo("/local/");
            await Assert.ThrowsAsync<HyperlambdaException>(() => runtime.Call("git.push", "/local/", ("branch", "main")));
        }

        [GitFact]
        public async Task CloneHonoursBranchAndDepth()
        {
            using var runtime = new Runtime();
            var remote = await BareRemote(runtime);
            await runtime.Repo("/local/");
            await runtime.Call("git.remote.add", "/local/", ("url", remote));
            File.WriteAllText(runtime.FullPath("local/a.txt"), "two");
            await runtime.Commit("/local/", "second");
            await runtime.Call("git.checkout", "/local/", ("branch", "feature"), ("create", true));
            File.WriteAllText(runtime.FullPath("local/f.txt"), "feature");
            await runtime.Commit("/local/", "feature commit");
            await runtime.Call("git.push", "/local/", ("branch", "main"));
            await runtime.Call("git.push", "/local/", ("branch", "feature"));

            await runtime.Call("git.clone-repo", "file://" + remote, ("path", "/clone/"), ("branch", "feature"), ("depth", "1"));
            Assert.True(File.Exists(runtime.FullPath("clone/f.txt")));
            var log = await runtime.Call("git.log", "/clone/");
            Assert.Single(log.Get<string>().Split('\n'));
        }

        [GitFact]
        public async Task FetchAndPullBringInRemoteCommits()
        {
            using var runtime = new Runtime();
            var remote = await BareRemote(runtime);
            await runtime.Repo("/local/");
            await runtime.Call("git.remote.add", "/local/", ("url", remote));
            await runtime.Call("git.push", "/local/", ("branch", "main"), ("set-upstream", true));
            await runtime.Call("git.clone-repo", remote, ("path", "/other/"));

            File.WriteAllText(runtime.FullPath("other/new.txt"), "from other");
            await runtime.Commit("/other/", "other commit");
            await runtime.Call("git.push", "/other/", ("branch", "main"));

            await runtime.Call("git.fetch", "/local/");
            Assert.False(File.Exists(runtime.FullPath("local/new.txt")));
            var remoteBranches = await runtime.Call("git.branch.list", "/local/", ("remote", true));
            Assert.Contains(remoteBranches.Children, x => x.Get<string>().Contains("origin/main"));

            await runtime.Call("git.pull", "/local/", ("ff-only", true), ("branch", "main"));
            Assert.Equal("from other", File.ReadAllText(runtime.FullPath("local/new.txt")));
        }

        [GitFact]
        public async Task FetchWithARefspec()
        {
            using var runtime = new Runtime();
            var remote = await BareRemote(runtime);
            await runtime.Repo("/local/");
            await runtime.Call("git.remote.add", "/local/", ("url", remote));
            await runtime.Call("git.push", "/local/", ("branch", "main"));
            await runtime.Call("git.fetch", "/local/", ("remote", "origin"), ("refspec", "main"));
        }

        [GitFact]
        public async Task PullCanRebaseOrMerge()
        {
            using var runtime = new Runtime();
            var remote = await BareRemote(runtime);
            await runtime.Repo("/local/");
            await runtime.Call("git.remote.add", "/local/", ("url", remote));
            await runtime.Call("git.push", "/local/", ("branch", "main"), ("set-upstream", true));
            await runtime.Call("git.clone-repo", remote, ("path", "/other/"));

            File.WriteAllText(runtime.FullPath("other/other.txt"), "other");
            await runtime.Commit("/other/", "other commit");
            await runtime.Call("git.push", "/other/", ("branch", "main"));
            File.WriteAllText(runtime.FullPath("local/local.txt"), "local");
            await runtime.Commit("/local/", "local commit");

            await runtime.Call("git.pull", "/local/", ("rebase", true), ("branch", "main"), ("name", Identity), ("email", "t@example.com"));
            Assert.True(File.Exists(runtime.FullPath("local/other.txt")));
            var log = (await runtime.Call("git.log", "/local/")).Get<string>().Split('\n');
            Assert.Equal(3, log.Length);

            File.WriteAllText(runtime.FullPath("other/more.txt"), "more");
            await runtime.Commit("/other/", "more");
            await runtime.Call("git.push", "/other/", ("branch", "main"));
            File.WriteAllText(runtime.FullPath("local/mine.txt"), "mine");
            await runtime.Commit("/local/", "mine");
            await runtime.Call("git.pull", "/local/", ("merge", true), ("branch", "main"), ("name", Identity), ("email", "t@example.com"));
            Assert.True(File.Exists(runtime.FullPath("local/more.txt")));
        }

        [GitFact]
        public async Task GitHubCredentialsAreHandedToGitAsAnExtraHeader()
        {
            using var runtime = new Runtime(configuration: new()
            {
                ["magic:git:github:username"] = "octocat",
                ["magic:git:github:token"] = "secret-token",
            });
            await runtime.Repo("/local/");
            var status = await runtime.Call("git.status", "/local/", ("porcelain", true));
            Assert.True(string.IsNullOrEmpty(status.Get<string>()));
        }
    }
}
