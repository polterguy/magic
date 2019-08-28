/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node.extensions.hyperlambda;

namespace magic.node.extensions
{
    public class Signal : ICloneable
    {
        public Signal(string content)
        {
            if (content == null || content == "" || content.StartsWith(".", StringComparison.InvariantCulture))
                throw new ApplicationException($"Signal supplied is not a valid slot invocation '{content}'");

            var root = new Parser(content).Lambda();
            if (root.Children.Count() != 1)
                throw new ApplicationException($"Illegal signal declaration '{content}'");

            Content = root.Children.First();
            Content.UnTie();
        }

        private Signal()
        { }

        public Node Content { get; private set; }

        #region [ -- Interface implementations -- ]

        public object Clone()
        {
            var result = new Signal
            {
                Content = Content.Clone()
            };
            return result;
        }

        #endregion
    }
}
