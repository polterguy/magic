/*
 * Poetry, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using magic.model.todo;
using magic.contracts.common;

namespace magic.contracts.todo
{
    public interface ITodoService : ICrudService<Todo>
    { }
}
