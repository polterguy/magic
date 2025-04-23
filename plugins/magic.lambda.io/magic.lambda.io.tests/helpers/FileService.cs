/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node.contracts;

namespace magic.lambda.io.tests.helpers
{
    public class FileService : IFileService
    {
        public Action<string, string> CopyAction { get; set; }

        public Action<string> DeleteAction { get; set; }

        public Func<string, bool> ExistsAction { get; set; }

        public Func<string, List<string>> ListFilesAction { get; set; }

        public Func<string, string, List<string>> ListFilesRecursivelyAction { get; set; }

        public Func<string, string, IEnumerable<(string Filename, byte[] Content)>> LoadRecursivelyAction { get; set; }

        public Func<string, string> LoadAction { get; set; }

        public Func<string, byte[]> LoadBinaryAction { get; set; }

        public Action<string, string> MoveAction { get; set; }

        public Action<string, string> SaveAction { get; set; }

        public Task<bool> ExistsAsync(string path)
        {
            return Task.FromResult(ExistsAction(path));
        }

        public Task DeleteAsync(string path)
        {
            DeleteAction(path);
            return Task.CompletedTask;
        }

        public Task CopyAsync(string source, string destination)
        {
            CopyAction(source, destination);
            return Task.CompletedTask;
        }

        public Task MoveAsync(string source, string destination)
        {
            MoveAction(source, destination);
            return Task.CompletedTask;
        }

        public Task<string> LoadAsync(string path)
        {
            return Task.FromResult(LoadAction(path));
        }

        public Task<byte[]> LoadBinaryAsync(string path)
        {
            return Task.FromResult(LoadBinaryAction(path));
        }

        public Task SaveAsync(string filename, string content)
        {
            SaveAction(filename, content);
            return Task.CompletedTask;
        }

        public Task SaveAsync(string filename, byte[] content)
        {
            SaveAction(filename, Encoding.UTF8.GetString(content));
            return Task.CompletedTask;
        }

        public List<string> List(string folder, string extension = null)
        {
            return ListFilesAction(folder);
        }

        public Task<IEnumerable<(string Filename, byte[] Content)>> LoadAllAsync(string folder, string extension)
        {
            return Task.FromResult(LoadRecursivelyAction(folder, extension));
        }

        public List<string> ListAll(string folder, string extension = null)
        {
            return ListFilesRecursivelyAction(folder, extension);
        }
    }
}
