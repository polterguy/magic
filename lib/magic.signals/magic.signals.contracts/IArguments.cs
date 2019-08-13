/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using magic.node;
using System.Collections.Generic;

namespace magic.signals.contracts
{
    public interface IArguments
    {
        IEnumerable<Node> GetArguments();
    }
}
