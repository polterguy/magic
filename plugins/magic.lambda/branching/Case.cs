/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.branching
{
    [Slot(Name = "case")]
    public class Case : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Case(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Parent?.Name != "switch")
                throw new ApplicationException("[case] must be a child of [switch]");

            _signaler.Signal("eval", input);
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("*", "*");
        }
    }
}
