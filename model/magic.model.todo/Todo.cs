/*
 * Poetry, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using magic.model.common;

namespace magic.model.todo
{
    public class Todo : Model
    {
        public virtual string Header { get; set; }
        public virtual string Description { get; set; }
        public virtual bool Done { get; set; }
    }
}
