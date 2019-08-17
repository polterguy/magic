
/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.IO;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.endpoint.contracts;
using magic.common.contracts;

namespace magic.endpoint.services.init
{
    class ConfigureServices : IConfigureServices
    {
        public void Configure(IServiceCollection services, IConfiguration configuration)
        {
            services.AddSingleton<IExecutor, Executor>();

            Root = (configuration["io:root-folder"] ?? "~/files")
                .Replace("~", Directory.GetCurrentDirectory())
                .TrimEnd('/') + "/";
        }

        public static string Root { get; private set; }
    }
}
