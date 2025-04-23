/*
 * Magic Cloud, copyright AINIRO.IO, Ltd and Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.Text;
using Microsoft.CodeAnalysis.CSharp;
using magic.node.extensions;

namespace magic.lambda.system.helpers
{
    /*
     * Helper class to compile C# code creating a byte array being the assembly
     */
    internal class Compiler
    {
        public static byte[] Compile(string sourceCode, string assemblyName, IEnumerable<string> references)
        {
            var result = GenerateCode(sourceCode, assemblyName, references);
            using (var stream = new MemoryStream())
            {
                var compilationResult = result.Emit(stream);
                if (!compilationResult.Success)
                {
                    var errors = "\r\n\r\n";
                    var failures = compilationResult.Diagnostics
                        .Where(diagnostic => diagnostic.IsWarningAsError || diagnostic.Severity == DiagnosticSeverity.Error);
                    foreach (var idx in failures)
                    {
                        errors += string.Format("{0}: {1} \r\n\r\n", idx.Id, idx.GetMessage());
                    }
                    throw new HyperlambdaException("Compilation did not succeed, errors were; " + errors.Trim());
                }
                stream.Position = 0;
                return stream.ToArray();
            }
        }

        #region [ -- Private helpers -- ]

        /*
         * Compiles the specified source code into the specified assembly and returns result.
         */
        private static CSharpCompilation GenerateCode(
            string sourceCode,
            string assemblyName,
            IEnumerable<string> references)
        {
            // Adding default compiler settings.
            var codeString = SourceText.From(sourceCode);
            var options = CSharpParseOptions.Default.WithLanguageVersion(LanguageVersion.CSharp11);
            var parsedSyntaxTree = SyntaxFactory.ParseSyntaxTree(codeString, options);

            // Adding references.
            var metaReferences = references.Select(x =>
            {
                var file = AppDomain.CurrentDomain.GetAssemblies().SingleOrDefault(assembly => assembly.GetName().Name == x)?.Location ??
                    throw new HyperlambdaException("Couldn't find assembly named; '" + x + "'");
                return MetadataReference.CreateFromFile(file);
            });

            // Ensuring assembly name ends with ".dll" if caller didn't already ensure it.
            if (!assemblyName.EndsWith(".dll"))
                assemblyName += ".dll";

            // Compiling C# and returning result to caller.
            return CSharpCompilation.Create(assemblyName,
                new[] { parsedSyntaxTree }, 
                references: metaReferences.ToArray(), 
                options: new CSharpCompilationOptions(
                    OutputKind.DynamicallyLinkedLibrary, 
                    optimizationLevel: OptimizationLevel.Release,
                    assemblyIdentityComparer: DesktopAssemblyIdentityComparer.Default));
        }
        #endregion
    }
}
