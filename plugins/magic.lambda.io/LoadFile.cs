/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.io.utilities;

namespace magic.lambda.io
{
    [Slot(Name = "load-file")]
    public class LoadFile : ISlot
    {
        readonly ISignaler _signaler;

        public LoadFile(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            var filename = RootResolver.Root + input.GetEx<string>(_signaler);
            input.Value = File.ReadAllText(filename, Encoding.UTF8);
        }
    }
}
