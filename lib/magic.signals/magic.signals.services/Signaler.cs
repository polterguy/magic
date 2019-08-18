/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;

namespace magic.signals.services
{
    public class Signaler : ISignaler
    {
        readonly Dictionary<string, Type> _slots;
        readonly IServiceProvider _provider;

        internal Signaler(IServiceProvider provider, IEnumerable<Type> types)
        {
            _provider = provider ?? throw new ArgumentNullException(nameof(provider));
            _slots = new Dictionary<string, Type>();
            foreach (var idxType in types)
            {
                var name = idxType.GetCustomAttributes(true).OfType<SlotAttribute>().FirstOrDefault()?.Name;

                if (string.IsNullOrEmpty(name))
                    throw new ArgumentNullException($"No name specified for type '{idxType}'");

                if (_slots.ContainsKey(name))
                    throw new ApplicationException($"Slot [{name}] already taken by another type");
                _slots[name] = idxType;
            }
        }

        #region [ -- Interface implementations -- ]

        public void Signal(string name, Node input)
        {
            if (!_slots.ContainsKey(name))
                throw new ApplicationException($"No slot exists for [{name}]");

            var instance = _provider.GetService(_slots[name]) as ISlot;
            instance.Signal(input);
        }

        public IEnumerable<string> Slots => _slots.Keys;

        public IEnumerable<Node> GetArguments(string name)
        {
            if (!_slots.ContainsKey(name))
                throw new ApplicationException($"No slot exists for [{name}]");

            if (_provider.GetService(_slots[name]) is IMeta instance)
            {
                foreach (var idxArg in instance.GetArguments())
                {
                    yield return idxArg;
                }
            }
        }

        #endregion
    }
}
