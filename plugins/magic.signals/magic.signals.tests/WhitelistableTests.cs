/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using Xunit;
using magic.node;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.signals.tests
{
    [Slot(Name = "whitelistable.never", Whitelistable = false)]
    public class NeverWhitelistableSlot : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = "OK";
        }
    }

    [Slot(Name = "whitelistable.mixed-one", Whitelistable = false)]
    [Slot(Name = "whitelistable.mixed-two")]
    public class MixedWhitelistableSlot : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = "OK";
        }
    }

    [Slot(Name = "whitelistable.default")]
    public class DefaultWhitelistableSlot : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = "OK";
        }
    }

    public class WhitelistableTests
    {
        static SignalsProvider Provider()
        {
            return new SignalsProvider([typeof(NeverWhitelistableSlot), typeof(MixedWhitelistableSlot), typeof(DefaultWhitelistableSlot)]);
        }

        [Fact]
        public void SlotIsWhitelistableByDefault()
        {
            Assert.True(Provider().IsWhitelistable("whitelistable.default"));
        }

        [Fact]
        public void SlotDeclaringItselfNotWhitelistableIsNot()
        {
            Assert.False(Provider().IsWhitelistable("whitelistable.never"));
        }

        [Fact]
        public void WhitelistableIsDeclaredPerSlotName()
        {
            var provider = Provider();
            Assert.False(provider.IsWhitelistable("whitelistable.mixed-one"));
            Assert.True(provider.IsWhitelistable("whitelistable.mixed-two"));
        }

        [Fact]
        public void UnknownNameIsWhitelistable()
        {
            Assert.True(Provider().IsWhitelistable("no.such.slot"));
        }

        [Fact]
        public void AddedAndRemovedSlotsAreTracked()
        {
            var provider = new SignalsProvider([]);
            provider.Add(typeof(NeverWhitelistableSlot));
            Assert.False(provider.IsWhitelistable("whitelistable.never"));
            provider.Remove(typeof(NeverWhitelistableSlot));
            Assert.True(provider.IsWhitelistable("whitelistable.never"));
        }
    }
}
