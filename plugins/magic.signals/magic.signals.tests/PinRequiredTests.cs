/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using Xunit;
using magic.node;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.signals.tests
{
    [Slot(Name = "pin.required", PinRequired = true)]
    public class PinRequiredSlot : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = "OK";
        }
    }

    [Slot(Name = "pin.mixed-one", PinRequired = true)]
    [Slot(Name = "pin.mixed-two")]
    public class MixedPinRequiredSlot : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = "OK";
        }
    }

    public class PinRequiredTests
    {
        static SignalsProvider Provider()
        {
            return new SignalsProvider([typeof(PinRequiredSlot), typeof(MixedPinRequiredSlot), typeof(DefaultWhitelistableSlot)]);
        }

        [Fact]
        public void SlotNeedsNoPinByDefault()
        {
            Assert.False(Provider().RequiresPin("whitelistable.default"));
        }

        [Fact]
        public void SlotDeclaringThatItMustBePinnedDoes()
        {
            Assert.True(Provider().RequiresPin("pin.required"));
        }

        [Fact]
        public void PinIsDeclaredPerSlotName()
        {
            var provider = Provider();
            Assert.True(provider.RequiresPin("pin.mixed-one"));
            Assert.False(provider.RequiresPin("pin.mixed-two"));
        }

        [Fact]
        public void UnknownNameNeedsNoPin()
        {
            Assert.False(Provider().RequiresPin("no.such.slot"));
        }

        [Fact]
        public void AddedAndRemovedSlotsAreTracked()
        {
            var provider = new SignalsProvider([]);
            provider.Add(typeof(PinRequiredSlot));
            Assert.True(provider.RequiresPin("pin.required"));
            provider.Remove(typeof(PinRequiredSlot));
            Assert.False(provider.RequiresPin("pin.required"));
        }
    }
}
