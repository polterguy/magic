/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using Microsoft.AspNetCore.Http;
using magic.common.contracts;

namespace magic.backend.init
{
    // TODO: This resolver does not work if a background thread without access
    // to the HTTP context attempts to create an instance.
    // Implement support for some kind of "thread local storage" to allow for
    // background threads to resolve instances, in case the HttpContext
    // is null.
    public class ScopedResolver : IScopedResolver
    {
        readonly IServiceProvider _services;

        public ScopedResolver(IServiceProvider services)
        {
            _services = services ?? throw new ArgumentNullException(nameof(services));
        }

        #region [ -- Interface implementations -- ]

        public T GetScopedInstance<T>() where T : new()
        {
            // Getting HttpContext.
            var key = typeof(T).FullName;
            var contextAccessor = _services.GetService(typeof(IHttpContextAccessor)) as IHttpContextAccessor;
            var context = contextAccessor.HttpContext;
            if (context == null)
                throw new ApplicationException($"You cannot create an instance of {nameof(T)} without an HTTP context");

            // Checking if we have already created an instance of T for the current request.
            if (context.Items.ContainsKey(key))
                return (T)context.Items[key];

            /*
             * Creating our T instance, and storing it in the HttpContext.
             * Notice, we cannot use the _services to instantiate our T, since
             * that would result in a stack overflow, since the type of T is
             * supposed to be configured such that it is resolved using the
             * IScopedResolver, which would end up invoking this method recursively,
             * in a never ending recursive loop.
             */
            var result = new T();
            context.Items[key] = result;
            return result;
        }

        #endregion
    }
}
