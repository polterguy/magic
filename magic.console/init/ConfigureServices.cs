/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.common.contracts;

namespace magic.console.init
{
    public class ConfigureServices : IConfigureServices
    {
        #region [ -- Interface implementations -- ]

        public void Configure(IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IScopedResolver, ScopedResolver>();
        }

        #endregion
    }
}
