/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.system.helpers;

namespace magic.lambda.system.plugins
{
    /// <summary>
    /// [system.compile] slot that allows for compiling C# code creating a CLR assembly as its output
    /// returning the assembly as an array of raw byte[].
    /// </summary>
    [Slot(Name = "system.compile")]
    public class Compile : ISlot
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Extracting arguments.
            var code = input.Children.FirstOrDefault(x => x.Name == "code")?.GetEx<string>() ??
                throw new HyperlambdaException("No [code] argument supplied to [system.compile]");

            var assemblyName = input.Children.FirstOrDefault(x => x.Name == "assembly-name")?.GetEx<string>() ??
                throw new HyperlambdaException("No [assembly-name] argument supplied to [system.compile]");

            var references = input.Children.FirstOrDefault(x => x.Name == "references")?.Children.Select(x => x.GetEx<string>()) ??
                throw new HyperlambdaException("No [references] supplied to [system.compile]");

            // Compiling code and returning result to caller as byte[].
            input.Value = Compiler.Compile(code, assemblyName, references);

            // House cleaning.
            input.Clear();
        }
    }
}
