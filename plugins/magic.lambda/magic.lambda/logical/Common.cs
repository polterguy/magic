/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.logical
{
    /*
     * Common helper class for conditional slots, being [and] and [or].
     */
    internal static class Common
    {
        /*
         * Signals each children node of specified input node, until condition
         * is somehow returned from invocation. If condition is reached,
         * the method returns true - Otherwise it'll return false.
         */
        static internal bool Signal(ISignaler signaler, Node input, bool condition)
        {
            foreach (var idx in input.Children)
            {
                if (idx.Name != string.Empty && idx.Name.FirstOrDefault() != '.')
                {
                    signaler.Signal(idx.Name, idx);
                }
                if (idx.GetEx<bool>() == condition)
                    return true;
            }
            return false;
        }
    }
}
