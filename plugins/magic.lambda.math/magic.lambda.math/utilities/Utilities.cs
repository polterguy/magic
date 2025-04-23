/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
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

        public static dynamic GetStep(Node input)
        {
            return input.Children.FirstOrDefault()?.Value ?? 1;
        }
    }
}
