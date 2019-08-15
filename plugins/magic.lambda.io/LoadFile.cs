/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.IO;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.io
{
    [Slot(Name = "load-file")]
    public class LoadFile : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            input.Value = File.ReadAllText(input.Get<string>());
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
