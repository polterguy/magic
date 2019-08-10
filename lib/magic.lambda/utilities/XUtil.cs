/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.utilities
{
    public static class XUtil
    {
        public static Node Single(ISignaler signaler, Node input, bool firstLevel = false)
        {
            signaler.Signal("eval", input);
            if (input.Children.Count() > 1)
                throw new ApplicationException("Too many sources for slot expecting single event");

            var levelOne = input.Children.FirstOrDefault();
            if (firstLevel)
                return levelOne;

            if (levelOne?.Children.Count() > 1)
                throw new ApplicationException("Too many sources for slot expecting single event");

            return levelOne?.Children.FirstOrDefault();
        }
    }
}
