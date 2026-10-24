/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.json.utilities
{
    /*
     * Internal helper/implementation class, doing the heavy lifting.
     */
    internal static class Lambda2JsonTransformer
    {
        /*
         * Returns "source node" for [lambda2xxx] conversions.
         */
        internal static Node GetSourceNode(Node input)
        {
            // Figuring out what to convert.
            var result = new Node();
            if (input.Value != null)
                result.AddRange(input.Evaluate().Select(x => x.Clone()));
            else
                result.AddRange(input.Children.Select(x => x.Clone()));
            return result;
        }
    }
}
