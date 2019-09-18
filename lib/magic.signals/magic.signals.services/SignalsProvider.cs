/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.signals.services
{
    public class SignalsProvider : ISignalsProvider
    {
        readonly Dictionary<string, Type> _slots = new Dictionary<string, Type>();

        public SignalsProvider(IEnumerable<Type> types)
        {
            foreach (var idxType in types)
            {
                foreach (var idxAtrName in idxType.GetCustomAttributes(true).OfType<SlotAttribute>().Select(x => x.Name))
                {
                    if (string.IsNullOrEmpty(idxAtrName))
                        throw new ArgumentNullException($"No name specified for type '{idxType}' in Slot attribute");

                    if (_slots.ContainsKey(idxAtrName))
                        throw new ApplicationException($"Slot [{idxAtrName}] already taken by another type");

                    _slots[idxAtrName] = idxType;
                }
            }
        }

        public IEnumerable<string> Keys => _slots.Keys;

        public Type GetSignaler(string name)
        {
            _slots.TryGetValue(name, out Type result);
            return result;
        }
    }
}
