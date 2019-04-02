/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Newtonsoft.Json.Linq;

namespace magic.common.contracts
{
    public interface ISlot
    {
        void Signal(JObject input);
    }
}
