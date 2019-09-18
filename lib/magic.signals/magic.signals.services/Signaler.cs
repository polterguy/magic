/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.signals.services
{
    public class Signaler : ISignaler
    {
        readonly IServiceProvider _provider;
        readonly ISignalsProvider _signals;

        public Signaler(IServiceProvider provider, ISignalsProvider signals)
        {
            _provider = provider ?? throw new ArgumentNullException(nameof(provider));
            _signals = signals ?? throw new ArgumentNullException(nameof(signals));
        }

        #region [ -- Interface implementations -- ]

        public void Signal(string name, Node input)
        {
            var type = _signals.GetSignaler(name);
            if (type == null)
                throw new ApplicationException($"No slot exists for [{name}]");

            var instance = _provider.GetService(type) as ISlot;
            instance.Signal(input);
        }

        public IEnumerable<string> Slots => _signals.Keys;

        #endregion
    }
}
