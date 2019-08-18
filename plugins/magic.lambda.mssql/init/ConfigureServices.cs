/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using magic.common.contracts;

namespace magic.lambda.mssql.init
{
    public class ConfigureServices : IConfigureServices
    {
        const string _key = "_mssql.connect.ConnectionStack";

        public void Configure(IServiceCollection services, IConfiguration configuration)
        {
            services.AddTransient((svc) =>
            {
                var contextAccessor = svc.GetService<IHttpContextAccessor>();
                var context = contextAccessor.HttpContext;
                if (context.Items.ContainsKey(_key))
                    return context.Items[_key] as ConnectionStack;

                var result = new ConnectionStack();
                context.Items[_key] = result;
                return result;
            });
        }
    }
}
