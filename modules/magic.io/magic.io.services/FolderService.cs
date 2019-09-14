/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Linq;
using System.Security;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using magic.io.contracts;
using magic.io.services.utilities;

namespace magic.io.services
{
    public class FolderService : IFolderService
    {
        readonly Utilities _utilities;

        public FolderService(IConfiguration configuration, IServiceProvider kernel)
        {
            _utilities = new Utilities(configuration, kernel);
        }

        #region [ -- Interface implementations -- ]

        public IEnumerable<string> ListFolders(
            string path,
            string username,
            string[] roles)
        {
            path = _utilities.GetFullPath(path, true);
            if (!_utilities.HasAccess(
                path,
                username,
                roles,
                AccessType.ReadFolder))
                throw new SecurityException("Access denied");

            return Directory.GetDirectories(path)
                .Select(x => _utilities.GetRelativePath(x) + "/");
        }

        public IEnumerable<string> ListFiles(
            string path,
            string username,
            string[] roles)
        {
            path = _utilities.GetFullPath(path, true);
            if (!_utilities.HasAccess(
                path,
                username,
                roles,
                AccessType.ReadFolder))
                throw new SecurityException("Access denied");

            return Directory.GetFiles(path)
                .Where(x => !x.EndsWith(".DS_Store")) // Removing Mac special files.
                .Select(_utilities.GetRelativePath);
        }

        public void Delete(string path, string username, string[] roles)
        {
            path = _utilities.GetFullPath(path, true);
            if (!_utilities.HasAccess(
                path,
                username,
                roles,
                AccessType.DeleteFolder))
                throw new SecurityException("Access denied");

            Directory.Delete(path, true);
        }

        public void Create(string path, string username, string[] roles)
        {
            path = _utilities.GetFullPath(path, true);
            if (!_utilities.HasAccess(
                path,
                username,
                roles,
                AccessType.WriteFolder))
                throw new SecurityException("Access denied");

            if (Directory.Exists(path))
                Directory.Delete(path, true);

            Directory.CreateDirectory(path);
        }

        public void Move(string source, string destination, string username, string[] roles)
        {
            if (string.IsNullOrEmpty(source))
                throw new ArgumentNullException(nameof(source));
            if (string.IsNullOrEmpty(destination))
                throw new ArgumentNullException(nameof(destination));

            source = _utilities.GetFullPath(source, true);
            if (!Directory.Exists(source))
                throw new ArgumentOutOfRangeException($"Folder '{source}' does not exist");

            if (!_utilities.HasAccess(
                source,
                username,
                roles,
                AccessType.ReadFolder))
                throw new SecurityException("Access denied");
            if (!_utilities.HasAccess(
                source,
                username,
                roles,
                AccessType.DeleteFolder))
                throw new SecurityException("Access denied");

            destination = _utilities.GetFullPath(destination, true);
            if (Directory.Exists(destination))
                Directory.Delete(destination, true);

            if (!_utilities.HasAccess(
                destination,
                username,
                roles,
                AccessType.WriteFolder))
                throw new SecurityException("Access denied");

            Directory.Move(source, destination);
        }

        public bool FolderExists(string path, string username, string[] roles)
        {
            if (string.IsNullOrEmpty(path))
                throw new ArgumentNullException(nameof(path));

            path = _utilities.GetFullPath(path, true);

            if (!_utilities.HasAccess(
                path,
                username,
                roles,
                AccessType.ReadFolder))
                throw new SecurityException("Access denied");

            return Directory.Exists(path);
        }

        public bool FileExists(string path, string username, string[] roles)
        {
            if (string.IsNullOrEmpty(path))
                throw new ArgumentNullException(nameof(path));

            path = _utilities.GetFullPath(path, false);

            if (!_utilities.HasAccess(
                path,
                username,
                roles,
                AccessType.ReadFile))
                throw new SecurityException("Access denied");

            return File.Exists(path);
        }

        #endregion
    }
}
