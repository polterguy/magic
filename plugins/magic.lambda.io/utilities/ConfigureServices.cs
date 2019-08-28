
/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.IO;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.common.contracts;

namespace magic.lambda.io.utilities
{
    class ConfigureServices : IConfigureServices
    {
        public void Configure(IServiceCollection services, IConfiguration configuration)
        {
            RootResolver.Root = (configuration["io:root-folder"] ?? "~/files")
                .Replace("~", Directory.GetCurrentDirectory())
                .TrimEnd('/');
        }
    }
}
