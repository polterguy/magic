/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.math.utilities
{
    internal static class Utilities
    {
        public static dynamic GetBase(Node node)
        {
            if (node.Value != null)
                return node.GetEx<dynamic>() ?? throw new HyperlambdaException("No base number found during calculation attempt");
            return node.Children.FirstOrDefault()?.GetEx<dynamic>() ?? throw new HyperlambdaException("No base number found during calculation attempt");
        }

        public static IEnumerable<dynamic> AllButBase(Node node)
        {
            if (node.Value != null)
                return node.Children.Select(x => x.GetEx<dynamic>());
            return node.Children.Skip(1).Select(x => x.GetEx<dynamic>());
        }

        /*
         * Every operand of [math.max] and [math.min]. A value expression without children supplies all
         * of them, one per node it matches, as in [math.max:x:@.numbers/*]; otherwise the operands are
         * the base followed by the children, as for every other arithmetic slot.
         */
        public static List<dynamic> AllOperands(Node node)
        {
            if (node.Value is not Expression || node.Children.Any())
                return AllButBase(node).Prepend((object)GetBase(node)).ToList();
            var result = node.Evaluate().Select(x => x.GetEx<dynamic>()).ToList();
            if (result.Count == 0)
                throw new HyperlambdaException($"Expression '{node.Value}' did not match any values during calculation attempt");
            return result;
        }

        public static dynamic GetStep(Node input)
        {
            return input.Children.FirstOrDefault()?.Value ?? 1;
        }
    }
}
