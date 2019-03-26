/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using magic.todo.model;
using magic.common.contracts;

namespace magic.todo.contracts
{
    public interface ITodoService : ICrudService<Todo>
    { }
}
