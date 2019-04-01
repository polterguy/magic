/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Mvc;
using magic.todo.contracts;
using magic.common.web.controller;
using db = magic.todo.model;
using www = magic.todo.web.model;

namespace magic.email.web.controller
{
    [Route("api/todos")]
    public class TodosController : CrudController<www.Todo, db.Todo>
    {
        public TodosController(ITodoService service)
            : base(service)
        { }
    }
}
