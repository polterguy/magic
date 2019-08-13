/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;

namespace magic.io.contracts
{
    public interface IFileService
    {
        FileResult Download(string path, string username, string[] roles);

        void Delete(string path, string username, string[] roles);

        void Upload(IFormFile file, string folder, string username, string[] roles);

        void Copy(string source, string destination, string username, string[] roles);

        void Move(string source, string destination, string username, string[] roles);
    }
}
