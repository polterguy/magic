/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda
{
    [Slot(Name = "load-file")]
    public class LoadFile : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            string filename;
            if (input.Value is string strValue)
            {
                filename = strValue;
            }
            else
            {
                var nodes = input.Get<Expression>().Evaluate(new Node[] { input });
                if (nodes.Count() != 1)
                    throw new ApplicationException("Expression for [load-file] yielded less or more than one result");
                filename = nodes.First().Get<string>();
            }
            input.Value = File.ReadAllText(filename);
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
