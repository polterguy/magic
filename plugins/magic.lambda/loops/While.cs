/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;
using magic.hyperlambda.utils;

namespace magic.lambda.loops
{
    [Slot(Name = "while")]
    public class While : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public While(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() != 2)
                throw new ApplicationException("Keyword [while] requires exactly two child nodes");

            while(true)
            {
                // Making sure we can reset back to original nodes after every single iteration.
                var old = input.Children.Select((x) => x.Clone()).ToList();

                // This will evaluate the condition.
                _signaler.Signal("eval", input);

                // Verifying we're supposed to proceed into body of [while].
                if (!input.Children.First().GetEx<bool>(_signaler))
                    break;

                // Retrieving [.lambda] node and doing basic sanity check.
                var lambda = input.Children.Skip(1).First();
                if (lambda.Name != ".lambda")
                    throw new ApplicationException("Keyword [while] requires its second child to be [.lambda]");

                // Evaluating "body" lambda of [while].
                _signaler.Signal("eval", lambda);

                // Resetting back to original nodes.
                input.Clear();

                // Notice, cloning in case we've got another iteration, to avoid changing original nodes' values.
                input.AddRange(old.Select((x) => x.Clone()));
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", 1);
            yield return new Node(".lambda", 1);
        }
    }
}
