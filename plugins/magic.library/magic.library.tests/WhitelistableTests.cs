/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Xunit;
using magic.signals.contracts;

namespace magic.library.tests
{
    /*
     * magic.library references every plugin, which makes it the one place the slots declaring that a [whitelist] can
     * never name them can be checked together. A new slot is whitelistable unless its author says otherwise, so
     * whoever adds a slot that hands a sandboxed caller the host itself, and whoever removes such a declaration,
     * has to change this list on purpose. Every git slot is on it, since the ones that talk to a remote take caller-supplied remotes, refspecs, branches and URLs,
     * which git reads as options, and [--upload-pack] and [--receive-pack] run a command, and the rest read or rewrite any repository the server can reach,
     * and so are the GitHub slots, which act with the server's token. The slots that read the server's log can't be granted either, since a log can carry stack traces and context
     * that only the host should see. The [io] slots that change the file system are on it too, since a sandbox that has to
     * write a file executes a file that does, pinned by name, rather than being handed the ability itself. The same goes for every [tasks] slot, since a task is code the server runs later. Notice, [python.execute] is also never whitelistable, but the python
     * plugin is referenced by the backend and not by magic.library, so it can't be checked here.
     */
    public class WhitelistableTests
    {
        static readonly string[] NeverWhitelistable =
        [
            "auth.ticket.create",
            "config.get",
            "config.load",
            "config.save",
            "config.section",
            "function",
            "git.branch.list",
            "git.checkout",
            "git.clone-repo",
            "git.commit",
            "git.create-repo",
            "git.delete-repo",
            "git.diff",
            "git.fetch",
            "git.log",
            "git.merge",
            "git.pull",
            "git.push",
            "git.remote.add",
            "git.restore",
            "git.status",
            "github.repo.create",
            "github.repo.delete",
            "github.repo.list",
            "io.file.copy",
            "io.file.delete",
            "io.file.move",
            "io.file.patch",
            "io.file.save",
            "io.file.save.binary",
            "io.file.unzip",
            "io.folder.copy",
            "io.folder.create",
            "io.folder.delete",
            "io.folder.move",
            "io.stream.save-file",
            "log.capabilities",
            "log.count",
            "log.get",
            "log.query",
            "log.timeshift",
            "puppeteer.click",
            "puppeteer.close",
            "puppeteer.connect",
            "puppeteer.content",
            "puppeteer.evaluate",
            "puppeteer.fill",
            "puppeteer.goto",
            "puppeteer.press",
            "puppeteer.screenshot",
            "puppeteer.select",
            "puppeteer.title",
            "puppeteer.type",
            "puppeteer.url",
            "puppeteer.wait-for-selector",
            "puppeteer.wait-for-url",
            "slots.create",
            "slots.delete",
            "sqlite.load-extension",
            "system.compile",
            "system.execute",
            "system.plugin.execute",
            "system.plugin.list",
            "system.plugin.load",
            "system.plugin.unload",
            "tasks.count",
            "tasks.create",
            "tasks.delete",
            "tasks.execute",
            "tasks.get",
            "tasks.list",
            "tasks.schedule",
            "tasks.schedule.delete",
            "tasks.update",
        ];

        /*
         * The slots a [whitelist] can only name with a pin, since their argument is their security boundary and an
         * entry without a value grants them for every argument.
         */
        static readonly string[] MustBePinned =
        [
            "http.delete",
            "http.get",
            "http.patch",
            "http.post",
            "http.put",
        ];

        static string[] Declaring(Func<SlotAttribute, bool> declares)
        {
            // Plugins are only loaded once something needs them, so loading them all, the way Magic does at startup.
            var loaded = AppDomain.CurrentDomain.GetAssemblies().Select(x => x.Location).ToHashSet(StringComparer.OrdinalIgnoreCase);
            foreach (var idx in Directory.GetFiles(AppDomain.CurrentDomain.BaseDirectory, "magic.*.dll").Where(x => !loaded.Contains(x)))
            {
                Assembly.LoadFrom(idx);
            }
            return AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && x.FullName.StartsWith("magic.", StringComparison.Ordinal) && !x.FullName.Contains(".tests"))
                .SelectMany(x => x.GetTypes())
                .SelectMany(x => x.GetCustomAttributes(true).OfType<SlotAttribute>())
                .Where(declares)
                .Select(x => x.Name)
                .Order(StringComparer.Ordinal)
                .ToArray();
        }

        [Fact]
        public void OnlyTheExpectedSlotsDeclareThemselvesNotWhitelistable()
        {
            Assert.Equal(NeverWhitelistable, Declaring(x => !x.Whitelistable));
        }

        [Fact]
        public void OnlyTheExpectedSlotsDeclareThatTheyMustBePinned()
        {
            Assert.Equal(MustBePinned, Declaring(x => x.PinRequired));
        }
    }
}
