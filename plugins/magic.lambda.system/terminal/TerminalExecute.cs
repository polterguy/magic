/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Text;
using System.Diagnostics;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.system.terminal
{
    /// <summary>
    /// [system.execute] slot that allows you to execute a system process,
    /// passing in arguments, and returning the result of the execution.
    /// </summary>
    [Slot(Name = "system.execute")]
    public class TerminalExecute : ISlotAsync
    {
        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>Awaitable task</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            await ExecuteAsync(signaler, input);
        }

        #region [ -- Private helper methods -- ]

        async Task ExecuteAsync(ISignaler signaler, Node input)
        {
            /*
             * Checking if caller wants the result to be structured or not.
             */
            var structured = false;
            var structureNode = input.Children.FirstOrDefault(x => x.Name == "structured");
            if (structureNode != null)
            {
                structured = structureNode.GetEx<bool>();
                structureNode.UnTie();
            }

            /*
             * Executing node to make sure we're able to correctly retrieve
             * arguments passed into execution of process.
             */
            await signaler.SignalAsync("eval", input);

            // Retrieving arguments to invocation.
            var args = input.Children.FirstOrDefault()?.GetEx<string>();

            // House cleaning ...
            input.Clear();

            // Creating and decorating process.
            ProcessStartInfo startInfo = null;
            if (string.IsNullOrEmpty(args))
                startInfo = new ProcessStartInfo(input.GetEx<string>())
                {
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                };
            else
                startInfo = new ProcessStartInfo(input.GetEx<string>(), args)
                {
                    RedirectStandardError = true,
                    RedirectStandardOutput = true,
                };

            // Creating and starting process, making sure we clean up after ourselves.
            using (var process = Process.Start(startInfo))
            {
                // Used to create returned result if caller does not want to have a structured result returned.
                var result = new StringBuilder();

                // Making sure we wait for process to finish.
                while (!process.StandardOutput.EndOfStream)
                {
                    if (structured)
                    {
                        input.Add(new Node(".", await process.StandardOutput.ReadLineAsync()));
                    }
                    else
                    {
                        if (result.Length != 0)
                            result.Append("\r\n");
                        result.Append(await process.StandardOutput.ReadLineAsync());
                    }
                }

                /*
                 * Returning result of process execution to caller, but only
                 * if user does not want a structured result.
                 */
                if (structured)
                    input.Value = null;
                else
                    input.Value = result.ToString();
            }
        }


        #endregion
    }
}
