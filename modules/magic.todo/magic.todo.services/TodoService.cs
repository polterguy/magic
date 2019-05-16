/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using NHibernate;
using magic.todo.model;
using magic.crud.services;
using magic.todo.contracts;

namespace magic.todo.services
{
    public class TodoService : CrudService<Todo>, ITodoService
    {
        public TodoService(ISession session)
            : base(session)
        { }
    }
}
