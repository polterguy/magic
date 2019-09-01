/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings
{
    [Slot(Name = "replace")]
    public class Replace : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Replace(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            var original = input.GetEx<string>(_signaler);
            var what = input.Children.First(x => x.Name == "what").GetEx<string>(_signaler);
            var with = input.Children.First(x => x.Name == "with").GetEx<string>(_signaler);
            input.Value = original.Replace(what, with);
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("what", 1);
            yield return new Node("with", 1);
        }
    }
}
