/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Collections.Generic;
using magic.node;
using magic.lambda.common;
using magic.lambda.utilities;
using magic.signals.contracts;

namespace magic.lambda
{
    [Slot(Name = "save-file")]
    public class SaveFile : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public SaveFile(IServiceProvider services)
        {
            _signaler = services.GetService(typeof(ISignaler)) as ISignaler;
        }

        public void Signal(Node input)
        {
            var filename = Common.GetFilename(input);
            var source = XUtil.Single(_signaler, input, true);
            File.WriteAllText(filename, source.Get<string>());
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("*", 1);
        }
    }
}
