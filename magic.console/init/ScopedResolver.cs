/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.common.contracts;

namespace magic.console.init
{
    public class ScopedResolver : IScopedResolver
    {
        readonly Dictionary<Type, object> _items = new Dictionary<Type, object>();

        #region [ -- Interface implementations -- ]

        // TODO: Implement thread safety.
        // Use e.g. Synchronizer or something.
        public T GetScopedInstance<T>() where T : new()
        {
            if (_items.ContainsKey(typeof(T)))
                return (T)_items[typeof(T)];

            var item = new T();
            _items[typeof(T)] = item;
            return item;
        }

        #endregion
    }
}
