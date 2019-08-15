/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.IO;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;
using magic.lambda.common;

namespace magic.lambda
{
    [Slot(Name = "load-file")]
    public class LoadFile : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            input.Value = File.ReadAllText(Common.GetFilename(input));
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
