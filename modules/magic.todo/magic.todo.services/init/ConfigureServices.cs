/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using magic.todo.contracts;
using magic.common.contracts;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace magic.todo.services.init
{
    public class ConfigureServices : IConfigureServices
    {
        public void Configure(IServiceCollection kernel, IConfiguration configuration)
        {
            kernel.AddTransient<ITodoService, TodoService>();
        }
    }
}
