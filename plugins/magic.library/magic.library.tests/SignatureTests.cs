/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Collections.Generic;
using Xunit;
using magic.signals.contracts;

namespace magic.library.tests
{
    /*
     * magic.library references every plugin, which makes it the one place where the signatures of all of them can
     * be checked together, including those of plugins that have no test project of their own.
     */
    public class SignatureTests
    {
        static List<Type> Signatures()
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
                .Where(x => typeof(ISlotSignature).IsAssignableFrom(x) && !x.IsAbstract && !x.IsInterface)
                .ToList();
        }

        static IEnumerable<SlotChild> Descendants(IEnumerable<SlotChild> children)
        {
            foreach (var idx in children)
            {
                yield return idx;
                foreach (var inner in Descendants(idx.Children ?? []))
                {
                    yield return inner;
                }
            }
        }

        [Fact]
        public void EverySignatureDescribesItself()
        {
            var signatures = Signatures();
            Assert.True(signatures.Count > 150, "Expected well over a hundred signatures, found " + signatures.Count);

            var problems = new List<string>();
            foreach (var type in signatures)
            {
                try
                {
                    var signature = (ISlotSignature)Activator.CreateInstance(type);
                    var children = signature.Children.ToList();
                    var output = signature.OutputChildren.ToList();
                    var constraints = signature.Constraints.ToList();
                    foreach (var child in Descendants(children).Concat(Descendants(output)))
                    {
                        if (string.IsNullOrEmpty(child.Name))
                            problems.Add(type.FullName + " has a child without a name");
                    }
                    foreach (var constraint in constraints)
                    {
                        if (constraint.Values == null)
                            problems.Add(type.FullName + " has a constraint without values");
                    }
                }
                catch (Exception error)
                {
                    problems.Add(type.FullName + ": " + error.Message);
                }
            }
            Assert.True(problems.Count == 0, string.Join("\n", problems));
        }

        [Fact]
        public void EverySlotNamesItsSignatureType()
        {
            // A signature type named by a slot must be one that can be created, and must have been described.
            var problems = new List<string>();
            foreach (var type in Signatures().Select(x => x.Assembly).Distinct().SelectMany(x => x.GetTypes()))
            {
                foreach (var slot in type.GetCustomAttributes<SlotAttribute>(false))
                {
                    if (string.IsNullOrEmpty(slot.Name))
                        problems.Add(type.FullName + " has a slot without a name");
                    if (slot.SignatureType != null && !typeof(ISlotSignature).IsAssignableFrom(slot.SignatureType))
                        problems.Add(type.FullName + " names a signature type that is not an ISlotSignature");
                }
            }
            Assert.True(problems.Count == 0, string.Join("\n", problems));
        }
    }
}
