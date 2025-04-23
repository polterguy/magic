/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using magic.node.contracts;

namespace magic.lambda.io.tests.helpers
{
    public class FolderService : IFolderService
    {
        public Action<string> CreateAction { get; set; }

        public Func<string, List<string>> ListAction { get; set; }

        public Action<string> DeleteAction { get; set; }

        public Func<string, bool> ExistsAction { get; set; }

        public Action<string, string> MoveAction { get; set; }

        public Action<string, string> CopyAction { get; set; }

        public Func<string, List<string>> ListFoldersRecursivelyAction { get; set; }

        public Func<string, List<string>> ListFoldersRecursivelyAsyncAction { get; set; }

        public void Create(string path)
        {
            CreateAction(path);
        }

        public void Delete(string path)
        {
            DeleteAction(path);
        }

        public bool Exists(string path)
        {
            return ExistsAction(path);
        }

        public List<string> ListFolders(string folder)
        {
            return ListAction(folder);
        }

        public void Move(string source, string destination)
        {
            MoveAction(source, destination);
        }

        public void Copy(string source, string destination)
        {
            CopyAction(source, destination);
        }

        public Task CreateAsync(string path)
        {
            Create(path);
            return Task.CompletedTask;
        }

        public Task<bool> ExistsAsync(string path)
        {
            return Task.FromResult(Exists(path));
        }

        public Task DeleteAsync(string path)
        {
            Delete(path);
            return Task.CompletedTask;
        }

        public Task MoveAsync(string source, string destination)
        {
            Move(source, destination);
            return Task.CompletedTask;
        }

        public Task CopyAsync(string source, string destination)
        {
            Copy(source, destination);
            return Task.CompletedTask;
        }

        public List<string> List(string folder)
        {
            return ListFolders(folder);
        }

        public List<string> ListAll(string folder)
        {
            return ListFoldersRecursivelyAction(folder);
        }
    }
}
