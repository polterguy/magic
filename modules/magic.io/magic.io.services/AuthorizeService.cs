/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.Linq;
using magic.io.contracts;

namespace magic.io.services
{
    public class AuthorizeService : IAuthorize
    {
        public bool Authorize(string path, string username, string[] roles, AccessType type)
        {
            // TODO: Implement Hyperlambda slot callback here, to allow for overriding authorization more dynamically
            return roles.Any(x => x == "root");
        }
    }
}
