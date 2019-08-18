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
        Node _root;

        public Eval(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            // Sanity checking invocation. Notice non [eval] keywords might have expressions and children.
            if (input.Name == "eval" && input.Value != null && input.Children.Any())
                throw new ApplicationException("[eval] cannot handle both expression values and children at the same time");

            if (input.Value is hyperlambda.Signal signal)
                UnrollSignal(input);

            // Children have precedence, in case invocation is from a non [eval] keyword.
            if (input.Children.Any())
            {
                Execute(input.Children);
            }
            else if (input.Name == "eval" && input.Value != null)
            {
                var nodes = input.Evaluate();
                Execute(nodes.SelectMany((x) => x.Children));
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "x");
            yield return new Node("*", "*");
        }

        #region [ -- Private helper methods -- ]

        void UnrollSignal(Node input)
        {
            var inner = input.Get<hyperlambda.Signal>().Content;
            _signaler.Signal(inner.Name, inner);
            input.Value = inner.Value;
            input.AddRange(inner.Children.ToList());
        }

        void Execute(IEnumerable<Node> nodes)
        {
            foreach (var idx in nodes)
            {
                if (idx.Name == "" || idx.Name.FirstOrDefault() == '.')
                    continue;

                if (idx.Value is hyperlambda.Signal signal)
                    UnrollSignal(idx);

                _signaler.Signal(idx.Name, idx);

                // Checking if execution for some reasons was terminated.
                if (Terminate(idx))
                    return;
            }
        }

        bool Terminate(Node idx)
        {
            if (_root == null)
            {
                _root = idx.Parent;
                while (_root.Parent != null)
                    _root = _root.Parent;
            }
            if (_root.Value != null)
                return true;
            return false;
        }

        #endregion
    }
}
