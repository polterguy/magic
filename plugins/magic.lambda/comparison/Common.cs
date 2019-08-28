/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.comparison
{
    public static class Common
    {
        public static void Compare(ISignaler signaler, Node input, Func<object, object, bool> functor)
        {
            if (input.Children.Count() != 2)
                throw new ApplicationException("Comparison operations requires exactly two operands");

            signaler.Signal("eval", input);

            var lhs = input.Children.First().GetEx(signaler);
            var rhs = input.Children.Skip(1).First().GetEx(signaler);
            input.Value = functor(lhs, rhs);
        }
    }
}
