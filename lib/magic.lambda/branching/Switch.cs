/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.branching
{
    [Slot(Name = "switch")]
    public class Switch : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public Switch(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            if (input.Children.Count() < 2)
                throw new ApplicationException("[switch] must have one retrieval node as its first child, and also at least one [case] child");

            if (input.Children.Skip(1).Any((x) => x.Name != "case" && x.Name != "default"))
                throw new ApplicationException("[switch] can only handle [case] and [default] children, except for its first child");

            if (input.Children.First().Name == "case")
                throw new ApplicationException("No retrieval child found in [switch]");

            var retrieval = input.Children.First();
            _signaler.Signal(retrieval.Name, retrieval);
            var result = retrieval.Value;

            var caseNode = input.Children.Where((x) => x.Name == "case" && x.Value.Equals(result)).FirstOrDefault();
            if (caseNode != null)
            {
                _signaler.Signal("case", caseNode);
            }
            else
            {
                var defaultNode = input.Children.Where((x) => x.Name == "default").FirstOrDefault();
                if (defaultNode != null)
                    _signaler.Signal("default", defaultNode);
            }
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node("*", "*");
        }
    }
}
