/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using MySql.Data.MySqlClient;
using magic.utils;
using magic.common.contracts;

namespace magic.lambda.mysql.init
{
    public class ConfigureServices : IConfigureServices
    {
        public void Configure(IServiceCollection services, IConfiguration configuration)
        {
            services.AddTransient((svc) => svc.GetService<IScopedResolver>().GetScopedInstance<Stack<MySqlConnection>>());
        }
    }
}
