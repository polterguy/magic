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
     * has to change this list on purpose.
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
            "python.execute",
            "slots.create",
            "slots.delete",
            "sqlite.load-extension",
            "system.compile",
            "system.execute",
            "system.plugin.execute",
            "system.plugin.list",
            "system.plugin.load",
            "system.plugin.unload",
            "tasks.create",
            "tasks.execute",
            "tasks.schedule",
            "tasks.update",
        ];

        [Fact]
        public void OnlyTheExpectedSlotsDeclareThemselvesNotWhitelistable()
        {
            // Plugins are only loaded once something needs them, so loading them all, the way Magic does at startup.
            var loaded = AppDomain.CurrentDomain.GetAssemblies().Select(x => x.Location).ToHashSet(StringComparer.OrdinalIgnoreCase);
            foreach (var idx in Directory.GetFiles(AppDomain.CurrentDomain.BaseDirectory, "magic.*.dll").Where(x => !loaded.Contains(x)))
            {
                Assembly.LoadFrom(idx);
            }
            var actual = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && x.FullName.StartsWith("magic.", StringComparison.Ordinal) && !x.FullName.Contains(".tests"))
                .SelectMany(x => x.GetTypes())
                .SelectMany(x => x.GetCustomAttributes(true).OfType<SlotAttribute>())
                .Where(x => !x.Whitelistable)
                .Select(x => x.Name)
                .Order(StringComparer.Ordinal)
                .ToArray();
            Assert.Equal(NeverWhitelistable, actual);
        }
    }
}
