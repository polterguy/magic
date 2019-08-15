/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda
{
    [Slot(Name = "eval")]
    public class Eval : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Eval(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            // Sanity checking invocation. Notice non [eval] keywords might have expressions.
            if (input.Name == "eval" && input.Value != null && input.Children.Any())
                throw new ApplicationException("[eval] cannot handle both expression values and children at the same time");

            // Children have precedence, in case invocation is from a non [eval] keyword.
            if (input.Children.Any())
            {
                foreach (var idx in input.Children)
                {
                    if (idx.Name == "" || idx.Name.FirstOrDefault() == '.')
                        continue;
                    _signaler.Signal(idx.Name, idx);

                    // Checking if execution for some reasons was terminated.
                    var root = idx.Parent;
                    while (root.Parent != null)
                        root = root.Parent;
                    if (root.Value is List<Node>)
                        return;
                }
            }
            else if (input.Name == "eval" && input.Value != null)
            {
                var nodes = input.Evaluate();
                foreach (var idxOuter in nodes.Select((x) => x.Clone())) // Notice, cloning here!
                {
                    foreach (var idx in idxOuter.Children)
                    {
                        if (idx.Name.FirstOrDefault() == '.')
                            continue;
                        _signaler.Signal(idx.Name, idx);

                        // Checking if execution for some reasons was terminated.
                        var root = idx.Parent;
                        while (root.Parent != null)
                            root = root.Parent;
                        if (root.Value is List<Node>)
                            return;
                    }
                }
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*x");
            yield return new Node("*", "*");
        }
    }
}
