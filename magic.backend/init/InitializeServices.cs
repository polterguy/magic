/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Ninject;
using magic.common.contracts;

namespace magic.backend.init
{
    public class InitializeServices
    {
        public static void Initialize(IKernel kernel)
        {
            // Instantiating and invoking IInitialize.Initialize on all types that requires such
            var type = typeof(IInitialize);
            var types = AppDomain.CurrentDomain.GetAssemblies()
                .SelectMany(s => s.GetTypes())
                .Where(p => type.IsAssignableFrom(p) && !p.IsInterface && !p.IsAbstract);
            foreach (var idx in types)
            {
                var initializer = Activator.CreateInstance(idx) as IInitialize;
                initializer.Initialize(kernel);
            }
        }
    }
}