/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node.contracts;
using magic.node.extensions;

namespace magic.node.services
{
    /// <inheritdoc/>
    public class FolderService : IFolderService
    {
        static IFileService _fileService;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="fileService">Needed for some operations to copy and move files</param>
        public FolderService(IFileService fileService)
        {
            _fileService = fileService;
        }

        /// <inheritdoc/>
        public Task CreateAsync(string path)
        {
            Directory.CreateDirectory(path);
            return Task.CompletedTask;
        }

        /// <inheritdoc/>
        public Task DeleteAsync(string path)
        {
            Directory.Delete(path, true);
            return Task.CompletedTask;
        }

        /// <inheritdoc/>
        public Task<bool> ExistsAsync(string path)
        {
            return Task.FromResult(Directory.Exists(path));
        }

        /// <inheritdoc/>
        public async Task MoveAsync(string source, string destination)
        {
            await CopyAsync(source, destination);
            Directory.Delete(source, true);
        }

        /// <inheritdoc/>
        public async Task CopyAsync(string source, string destination)
        {
            // Sanity checking invocation, and verifying source folder exists.
            var sourceFolder = new DirectoryInfo(source);
            if (!sourceFolder.Exists)
                throw new HyperlambdaException($"Source directory does not exist or could not be found '{source}'");
            Directory.CreateDirectory(destination);

            foreach (var file in sourceFolder.GetFiles())
            {
                await _fileService.CopyAsync(file.FullName, Path.Combine(destination, file.Name));
            }
            foreach (var idxSub in sourceFolder.GetDirectories())
            {
                await CopyAsync(idxSub.FullName, Path.Combine(destination, idxSub.Name));
            }
        }

        /// <inheritdoc/>
        public List<string> List(string folder)
        {
            var result = Directory
                .GetDirectories(folder)
                .Select(x => x.Replace("\\", "/") + "/")
                .ToList();
            result.Sort();
            return result;
        }

        /// <inheritdoc/>
        public List<string> ListAll(string folder)
        {
            var tmpResult = Directory
                .GetDirectories(folder)
                .Select(x => x.Replace("\\", "/") + "/")
                .ToList();
            tmpResult.Sort();
            var result = new List<string>();
            foreach (var idx in tmpResult)
            {
                result.Add(idx);
                result.AddRange(ListAll(idx));
            }
            return result;
        }
    }
}
