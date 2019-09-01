/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.strings
{
    [Slot(Name = "regex-replace")]
    public class RegexReplace : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public RegexReplace(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            var original = input.GetEx<string>(_signaler);
            var what = input.Children.First(x => x.Name == "what").GetEx<string>(_signaler);
            var with = input.Children.First(x => x.Name == "with").GetEx<string>(_signaler);
            var ex = new Regex(what);
            input.Value = ex.Replace(original, with);
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("what", 1);
            yield return new Node("with", 1);
        }
    }
}
