/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;
using Mapster;
using magic.contracts.todo;
using magic.web.controller.common;
using db = magic.model.todo;
using www = magic.web.model.todo;

namespace magic.web.controller.email
{
    [ApiController]
    [Route("api/todo")]
    public class TodoController : CrudController<www.Todo, db.Todo>
    {
        public TodoController(IAdapter adapter, ITodoService service)
            : base(adapter, service)
        { }
    }
}
