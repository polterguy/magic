/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [console.log] for writing entries to the console.
    /// </summary>
    [Slot(Name = "console.log")]
    public class ConsoleLog : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            Console.WriteLine(input.GetEx<string>());
        }
    }
}
