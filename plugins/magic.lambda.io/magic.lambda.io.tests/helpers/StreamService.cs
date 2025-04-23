/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Threading.Tasks;
using magic.node.contracts;

namespace magic.lambda.io.tests.helpers
{
    public class StreamService : IStreamService
    {
        public Func<string, Stream> OpenFileAction { get; set; }
        public Action<Stream, string> SaveFileAction { get; set; }

        public Action<string> DeleteAction { get; set; }

        public Func<string, bool> ExistsAction { get; set; }

        public Stream OpenFile(string path)
        {
            return OpenFileAction(path);
        }

        public Task<Stream> OpenFileAsync(string path)
        {
            return Task.FromResult(OpenFileAction(path));
        }

        public void SaveFile(Stream stream, string path, bool overwrite)
        {
            SaveFileAction(stream, path);
        }

        public Task SaveFileAsync(Stream stream, string path, bool overwrite)
        {
            SaveFileAction(stream, path);
            return Task.CompletedTask;
        }

        public void Delete(string path)
        {
            DeleteAction(path);
        }

        public bool Exists(string path)
        {
            return ExistsAction(path);
        }
    }
}
