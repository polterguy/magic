/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
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

            var lhs = input.Children.First().Get();
            var rhs = input.Children.Skip(1).First().Get();
            input.Value = functor(lhs, rhs);
        }
    }
}
