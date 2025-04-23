/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Reflection;

namespace magic.lambda.openai.utilities
{
    internal static class EmbeddedResource
    {
        internal static string Read(string name)
        {
            var assembly = typeof(EmbeddedResource).GetTypeInfo().Assembly;
            if (assembly == null)
                throw new NullReferenceException("Resource not found");

            var resourceNames = assembly.GetManifestResourceNames();

            using Stream? resource = assembly.GetManifestResourceStream(resourceNames.First(x => x.EndsWith(name)));
            if (resource == null)
                throw new NullReferenceException("Resource not found");

            using var reader = new StreamReader(resource);
            return reader.ReadToEnd();
        }
    }
}