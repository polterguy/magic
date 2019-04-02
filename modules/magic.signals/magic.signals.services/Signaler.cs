/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using Ninject;
using Newtonsoft.Json.Linq;
using magic.signals.contracts;

namespace magic.signals.services
{
    public class Signaler : ISignaler
    {
        readonly Dictionary<string, List<Type>> _slots;
        readonly IKernel _kernel;

        public Signaler(IEnumerable<Type> types, IKernel kernel)
        {
            _kernel = kernel;
            _slots = new Dictionary<string, List<Type>>();
            foreach (var idxType in types)
            {
                var atrs = idxType.GetCustomAttributes(true);
                string name = null;
                foreach (var idxAtr in atrs)
                {
                    if (idxAtr is SlotAttribute slotAtr)
                    {
                        name = slotAtr.Name;
                    }
                }

                if (string.IsNullOrEmpty(name))
                    throw new ArgumentNullException($"No name specified for type '{idxType}'");

                if (!_slots.ContainsKey(name))
                    _slots[name] = new List<Type>();

                _slots[name].Add(idxType);
                _kernel.Bind(idxType).ToSelf();
            }
        }

        #region [ -- Interface implementations -- ]

        public void Signal(string name, JObject input)
        {
            if (!_slots.ContainsKey(name))
                return;

            foreach (var idxType in _slots[name])
            {
                var instance = _kernel.Get(idxType) as ISlot;
                instance.Signal(input);
            }
        }

        #endregion
    }
}
