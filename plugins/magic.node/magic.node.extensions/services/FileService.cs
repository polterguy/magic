/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node.contracts;

namespace magic.node.services
{
    /// <inheritdoc/>
    public class FileService : IFileService
    {
        /// <inheritdoc/>
        public async Task CopyAsync(string source, string destination)
        {
            using (var sourceStream = File.OpenRead(source))
            {
                using (var destinationStream = File.Create(destination))
                {
                    await sourceStream.CopyToAsync(destinationStream);
                }
            }
        }

        /// <inheritdoc/>
        public async Task MoveAsync(string source, string destination)
        {
            await CopyAsync(source, destination);
            File.Delete(source);
        }

        /// <inheritdoc/>
        public Task DeleteAsync(string path)
        {
            File.Delete(path);
            return Task.CompletedTask;
        }

        /// <inheritdoc/>
        public Task<bool> ExistsAsync(string path)
        {
            return Task.FromResult(File.Exists(path));
        }

        /// <inheritdoc/>
        public async Task<string> LoadAsync(string path)
        {
            using (var file = File.OpenText(path))
            {
                return await file.ReadToEndAsync();
            }
        }

        /// <inheritdoc/>
        public async Task<IEnumerable<(string Filename, byte[] Content)>> LoadAllAsync(
            string folder,
            string extension)
        {
            var files = ListAll(folder, extension);
            var result = new List<(string Filename, byte[] Content)>();
            foreach (var idx in files)
            {
                result.Add((idx, await LoadBinaryAsync(idx)));
            }
            return result;
        }

        /// <inheritdoc/>
        public async Task<byte[]> LoadBinaryAsync(string path)
        {
            return await File.ReadAllBytesAsync(path);
        }

        /// <inheritdoc/>
        public async Task SaveAsync(string path, string content)
        {
            using (var writer = File.CreateText(path))
            {
                await writer.WriteAsync(content);
            }
        }

        /// <inheritdoc/>
        public async Task SaveAsync(string path, byte[] content)
        {
            using (var writer = File.Create(path))
            {
                await writer.WriteAsync(content);
            }
        }

        /// <inheritdoc/>
        public List<string> List(string folder, string extension = null)
        {
            var files = string.IsNullOrEmpty(extension) ?
                Directory
                    .GetFiles(folder)
                    .Select(x => x.Replace("\\", "/"))
                    .ToList() :
                Directory
                    .GetFiles(folder)
                    .Where(x => Path.GetExtension(x) == extension)
                    .Select(x => x.Replace("\\", "/"))
                    .ToList();
            files.Sort();
            return files;
        }

        /// <inheritdoc/>
        public List<string> ListAll(string folder, string extension = null)
        {
            var tmpResult = string.IsNullOrEmpty(extension) ?
                Directory
                    .GetFiles(folder)
                    .Select(x => x.Replace("\\", "/"))
                    .ToList() :
                Directory
                    .GetFiles(folder)
                    .Where(x => Path.GetExtension(x) == extension)
                    .Select(x => x.Replace("\\", "/"))
                    .ToList();
            tmpResult.Sort();
            var result = new List<string>();
            foreach (var idx in tmpResult)
            {
                result.Add(idx);
            }
            foreach (var idx in Directory.GetDirectories(folder))
            {
                result.AddRange(ListAll(idx, extension));
            }
            return result;
        }
    }
}
