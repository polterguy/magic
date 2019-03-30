/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using FluentNHibernate.Mapping;

namespace magic.todo.model.mapping
{
    public class TodoMap : ClassMap<Todo>
    {
        public TodoMap()
        {
            Table("todos");
            Id(x => x.Id);

            Map(x => x.Header)
                .Not.Nullable()
                .Length(256);
            Map(x => x.Description)
                .Not.Nullable()
                .Length(4096);
            Map(x => x.Done)
                .Not.Nullable();
        }
    }
}
