/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;

namespace magic.todo.web.model
{
    public class Todo
    {
        public Guid? Id { get; set; }
        public string Header { get; set; }
        public string Description { get; set; }
        public bool Done { get; set; }
    }
}
