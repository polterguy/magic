/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using log4net;
using Ninject;
using NHibernate;
using magic.todo.model;
using magic.todo.contracts;
using magic.common.services;

namespace magic.todo.services
{
    public class TodoService : CrudService<Todo>, ITodoService
    {
        public TodoService([Named("default")] ISession session)
            : base(session)
        { }
    }
}
