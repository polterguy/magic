/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Ninject;
using magic.todo.contracts;
using magic.common.contracts;
using Microsoft.Extensions.Configuration;

namespace magic.todo.services
{
    public class ConfigureNinject : IConfigureNinject
    {
        public void Configure(IKernel kernel, IConfiguration configuration)
        {
            kernel.Bind<ITodoService>().To<TodoService>();
        }
    }
}
