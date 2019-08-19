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

namespace magic.lambda.strings
{
    [Slot(Name = "concat")]
    public class Concat : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Concat(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (!input.Children.Any())
                throw new ApplicationException("No arguments provided to [concat]");

            _signaler.Signal("eval", input);

            input.Value = string.Join("", input.Children.Select((x) => x.GetEx<string>(_signaler)));
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
