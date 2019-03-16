/*
 * Poetry, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Ninject;
using magic.services.todo;
using magic.contracts.todo;
using magic.contracts.common;

namespace poetry.services.email
{
    public class Initializer : IInitialize
    {
        public void Initialize(IKernel kernel)
        {
            kernel.Bind<ITodoService>().To<TodoService>();
        }
    }
}
