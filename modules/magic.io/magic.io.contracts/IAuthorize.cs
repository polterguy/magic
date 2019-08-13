/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace magic.io.contracts
{
    public interface IAuthorize
    {
        bool Authorize(
            string path,
            string username,
            string[] roles,
            AccessType type);
    }
}
