/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Security;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using magic.io.contracts;
using magic.io.services.utilities;

namespace magic.io.services
{
    public class FileService : IFileService
    {
        readonly Utilities _utilities;

        public FileService(IConfiguration configuration, IServiceProvider kernel)
        {
            _utilities = new Utilities(configuration, kernel);
        }

        #region [ -- Interface implementations -- ]

        public FileResult Download(
            string path,
            string username,
            string[] roles)
        {
            path = _utilities.GetFullPath(path);
            if (!_utilities.HasAccess(
                path,
                username,
                roles,
                AccessType.ReadFile))
                throw new SecurityException("Access denied");

            if (!File.Exists(path))
                throw new FileNotFoundException($"File '{path}' does not exist");

            return new FileStreamResult(
                File.OpenRead(path),
                _utilities.GetMimeType(path))
            {
                FileDownloadName = Path.GetFileName(path)
            };
        }

        public void Delete(string path, string username, string[] roles)
        {
            path = _utilities.GetFullPath(path);
            if (!_utilities.HasAccess(
                path,
                username,
                roles,
                AccessType.DeleteFile))
                throw new SecurityException("Access denied");

            if (!File.Exists(path))
                throw new FileNotFoundException($"File '{path}' does not exist");

            File.Delete(path);
        }

        public void Upload(IFormFile file, string folder, string username, string[] roles)
        {
            if (file.Length <= 0)
                throw new ArgumentException($"File '{file.FileName}' is empty");

            var filename = _utilities.GetFullPath(folder, true) + file.FileName;
            if (!_utilities.HasAccess(
                filename,
                username,
                roles,
                AccessType.WriteFile))
                throw new SecurityException("Access denied");

            if (File.Exists(filename))
            {
                if (!_utilities.HasAccess(
                    filename,
                    username,
                    roles,
                    AccessType.DeleteFile))
                    throw new SecurityException("Access denied");

                File.Delete(filename);
            }

            using (var stream = File.Create(filename))
            {
                file.CopyTo(stream);
            }
        }

        public void Copy(string source, string destination, string username, string[] roles)
        {
            if (string.IsNullOrEmpty(source))
                throw new ArgumentNullException(nameof(source));
            if (string.IsNullOrEmpty(destination))
                throw new ArgumentNullException(nameof(destination));

            source = _utilities.GetFullPath(source);
            if (!File.Exists(source))
                throw new FileNotFoundException($"File '{source}' does not exist");

            if (!_utilities.HasAccess(
                source,
                username,
                roles,
                AccessType.ReadFile))
                throw new SecurityException("Access denied");

            destination = _utilities.GetFullPath(destination);

            if (!_utilities.HasAccess(
                destination,
                username,
                roles,
                AccessType.WriteFile))
                throw new SecurityException("Access denied");

            if (File.Exists(destination))
            {
                if (!_utilities.HasAccess(
                    destination,
                    username,
                    roles,
                    AccessType.DeleteFile))
                    throw new SecurityException("Access denied");

                File.Delete(destination);
            }

            File.Copy(source, destination);
        }

        public void Move(string source, string destination, string username, string[] roles)
        {
            if (string.IsNullOrEmpty(source))
                throw new ArgumentNullException(nameof(source));
            if (string.IsNullOrEmpty(destination))
                throw new ArgumentNullException(nameof(destination));

            source = _utilities.GetFullPath(source);
            if (!File.Exists(source))
                throw new FileNotFoundException($"File '{source}' does not exist");

            if (!_utilities.HasAccess(
                source,
                username,
                roles,
                AccessType.ReadFile))
                throw new SecurityException("Access denied");

            if (!_utilities.HasAccess(
                source,
                username,
                roles,
                AccessType.DeleteFile))
                throw new SecurityException("Access denied");

            destination = _utilities.GetFullPath(destination);

            if (!_utilities.HasAccess(
                destination,
                username,
                roles,
                AccessType.WriteFile))
                throw new SecurityException("Access denied");

            if (File.Exists(destination))
            {
                if (!_utilities.HasAccess(
                    destination,
                    username,
                    roles,
                    AccessType.DeleteFile))
                    throw new SecurityException("Access denied");

                File.Delete(destination);
            }

            File.Move(source, destination);
        }

        #endregion
    }
}
