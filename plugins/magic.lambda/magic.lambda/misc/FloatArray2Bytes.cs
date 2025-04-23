/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Sys = System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.misc
{
    /// <summary>
    /// [byte-array] slot converting whatever values are found in its expression to a byte array.
    /// </summary>
    [Slot(Name = "floatArray2bytes")]
    public class FloatArray2Bytes : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var array = input.Evaluate().Select(x => x.GetEx<float>()).ToArray();
            byte[] result = new byte[array.Length * sizeof(float)];
            Sys.Buffer.BlockCopy(array, 0, result, 0, result.Length);
            input.Value = result;
        }
    }
}
