/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;
using magic.lambda.utilities;
using magic.signals.contracts;

namespace magic.lambda.change
{
    [Slot(Name = "set-node")]
    public class SetNode : ISlot
    {
        readonly ISignaler _signaler;

        public SetNode(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            var dest = input.Get<Expression>().Evaluate(new Node[] { input });
            var source = XUtil.Single(_signaler, input, false);
            if (source == null)
            {
                // To avoid modifying collection during enumeration removal process.
                foreach (var idx in dest.ToList())
                {
                    idx.Parent.Remove(idx);
                }
            }
            else
            {
                foreach (var idx in dest)
                {
                    idx.Name = source.Name;
                    idx.Value = source.Value;
                    idx.Clear();
                    foreach (var idxSrcChild in source.Children)
                    {
                        idx.Add(idxSrcChild.Clone());
                    }
                }
            }
        }
    }
}
