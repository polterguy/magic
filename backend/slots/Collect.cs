/*
 * Copyright (c) Aista Ltd, 2021 - 2023 team@ainiro.io.
 */

using System;
using magic.node;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [gc.collect] slot for explicitly running garbage collector.
    /// </summary>
    [Slot(Name = "gc.collect")]
    public class Collect : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            GC.Collect();
        }
    }
}
