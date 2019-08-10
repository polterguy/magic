/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using magic.node;

namespace magic.signals.contracts
{
    public interface ISignaler
    {
        void Signal(string name, Node input);
    }
}
