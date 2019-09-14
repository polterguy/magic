/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.signals.contracts;

namespace magic.node.extensions
{
    public static class NodeExtensions
    {
        public static object GetEx(this Node node, ISignaler signaler, bool evaluate = true)
        {
            if (node.Value is Signal signal)
            {
                signaler.Signal(signal.Content.Name, signal.Content);
                return signal.Content.Value;
            }
            return node.Get(evaluate);
        }

        public static T GetEx<T>(this Node node, ISignaler signaler)
        {
            if (node.Value is Signal signal)
            {
                signaler.Signal(signal.Content.Name, signal.Content);
                return signal.Content.Get<T>();
            }
            if (node.Value is Expression exp)
            {
                var value = exp.Evaluate(node);
                if (value.Count() > 1)
                    throw new ApplicationException("Multiple resulting nodes from expression");
                if (!value.Any())
                    return default(T);
                return value.First().GetEx<T>(signaler);
            }
            return node.Get<T>();
        }
    }
}
