/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.Extensions.Configuration;
using Ninject;
using magic.common.contracts;
using magic.http.contracts;

namespace magic.http.services
{
    public class Startup : IStartup
    {
        #region [ -- Interface implementations -- ]

        public void Configure(IKernel kernel, IConfiguration configuration)
        {
            kernel.Bind<IHttpClient>().To<HttpClient>();
        }

        #endregion
    }
}
