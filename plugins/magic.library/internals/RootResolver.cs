/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.IO;
using Microsoft.Extensions.Configuration;
using magic.node.contracts;
using magic.node.extensions;

namespace magic.library.internals
{
    internal sealed class RootResolver : IRootResolver
    {
        public RootResolver(IConfiguration configuration)
        {
            // By default the root folder for Magic is the current directory.
            RootFolder = Directory.GetCurrentDirectory().Replace("\\", "/").TrimEnd('/') + "/";

            /*
             * By default the root folder for dynamic files in Magic is the current directory + "/files/",
             * but this can be overridden by changing a configuration setting.
             */
            DynamicFiles = (configuration["magic:io:root-folder"] ?? "~/files/").Replace("~/", RootFolder);
        }

        public string DynamicFiles { get; }

        public string RootFolder { get; }

        public string RelativePath(string path)
        {
            // Sanity checking invocation.
            if (!path.StartsWith(DynamicFiles))
                throw new HyperlambdaException("Tried to create a relative path out of a path that is not absolute");

            // Making sure we remove DynamicFiles, but keeping the initial slash (/).
            return path.Substring(DynamicFiles.Length - 1);
        }

        public string AbsolutePath(string path)
        {
            // DynamicFiles should always end with a slash (/).
            return DynamicFiles + path.Replace("\\", "/").TrimStart('/');
        }
    }
}