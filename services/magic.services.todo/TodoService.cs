/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using log4net;
using NHibernate;
using magic.model.todo;
using magic.contracts.todo;
using magic.services.common;

namespace magic.services.todo
{
    public sealed class TodoService : CrudService<Todo>, ITodoService
    {
        public TodoService(ISession session)
            : base(session, LogManager.GetLogger(typeof(TodoService)))
        { }
    }
}
