/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using log4net;
using Mapster;
using Ninject;
using Ninject.Activation;

namespace magic.backend.init
{
    public class InitializeNinject
    {
        public static IKernel Initialize(IApplicationBuilder app,
            IConfiguration configuration,
            Func<IContext, object> requestScope)
        {
            var kernel = new StandardKernel();
            foreach (var ctrlType in app.GetControllerTypes())
            {
                kernel.Bind(ctrlType).ToSelf().InScope(requestScope);
            }
            kernel.Bind<IConfiguration>().ToConstant(configuration);
            kernel.Bind<IAdapter>().To<Adapter>();
            kernel.Bind<ILog>().ToMethod((ctx) => LogManager.GetLogger(typeof(IKernel)));
            return kernel;
        }
    }
}