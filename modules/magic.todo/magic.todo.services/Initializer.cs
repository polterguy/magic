/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Builder;
using Ninject;
using magic.todo.services;
using magic.todo.contracts;
using magic.common.contracts;

namespace magic.todo.services
{
    public class Initializer : IConfigureApplication
    {
        public void Configure(IApplicationBuilder app, IKernel kernel)
        {
            kernel.Bind<ITodoService>().To<TodoService>();
        }
    }
}
