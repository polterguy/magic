/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using magic.endpoint.contracts;

namespace magic.endpoint.services
{
    public class Executor : IExecutor
    {
        public object Execute()
        {
            return "Foo bar";
        }
    }
}
