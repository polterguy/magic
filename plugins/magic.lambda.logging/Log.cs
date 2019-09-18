/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using log4net;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.json
{
    [Slot(Name = "log")]
    public class Log : ISlot
    {
        readonly static ILog _logger = LogManager.GetLogger(typeof(Log));
        readonly ISignaler _signaler;

        public Log(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            var entry = input.GetEx<string>(_signaler);
            _logger.Info(entry);
        }
    }
}
