/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.common.contracts;
using magic.lambda.utilities;

namespace magic.console.init
{
    public class ScopedResolver : IScopedResolver
    {
        readonly Synchronizer<Dictionary<Type, object>> _items = new Synchronizer<Dictionary<Type, object>>(new Dictionary<Type, object>());

        #region [ -- Interface implementations -- ]

        public T GetScopedInstance<T>() where T : class, new()
        {
            // Checking if we have already created an instance of type.
            var item = _items.Read((dict) =>
            {
                if (dict.TryGetValue(typeof(T), out object i))
                    return (T)i;
                return default;
            });

            if (item != null)
                return item;

            // Creating a new instance and storing it in dictionary.
            item = new T();
            _items.Write((dict) => dict[typeof(T)] = item);
            return item;
        }

        #endregion
    }
}
