/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Text;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;
using magic.hyperlambda.utils;
using magic.lambda.io.utilities;

namespace magic.lambda.io
{
    [Slot(Name = "create-folder")]
    public class CreateFolder : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public CreateFolder(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            var path = ConfigureServices.Root + input.GetEx<string>(_signaler);
            if (Directory.Exists(path))
                input.Value = false;

            Directory.CreateDirectory(path);
            input.Value = true;
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
