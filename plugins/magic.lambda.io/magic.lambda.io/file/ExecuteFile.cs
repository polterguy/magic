/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.io.file
{
    /// <summary>
    /// [io.file.execute] slot for executing a Hyperlambda file on your server.
    /// </summary>
    [Slot(Name = "io.file.execute")]
    [Slot(Name = "execute-file")]
    public class ExecuteFile : ISlotAsync
    {
        readonly IRootResolver _rootResolver;
        readonly IFileService _service;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="rootResolver">Instance used to resolve the root folder of your app.</param>
        /// <param name="service">Underlaying file service implementation.</param>
        public ExecuteFile(IRootResolver rootResolver, IFileService service)
        {
            _rootResolver = rootResolver;
            _service = service;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>An awaitable task.</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Checking if invocation's name is [execute-file] at which point we forward evaluate all descendant nodes.
            if (input.Name == "execute-file")
                Expression.Unwrap(GetDescendants(input), true);

            // Making sure we're able to handle returned values and nodes from slot implementation.
            var result = new Node();
            await signaler.ScopeAsync("slots.result", result, async () =>
            {
                // Loading file and converting its content to Hyperlambda.
                var filename = input.GetEx<string>();
                var hyperlambda = await _service.LoadAsync(_rootResolver.AbsolutePath(filename));

                // Creating and parametrising our lambda object from argument + file's Hyperlambda content.
                var lambda = GetLambda(input, hyperlambda, filename);

                // Evaluating lambda of slot.
                await signaler.SignalAsync("eval", lambda);

                // Applying result.
                ApplyResult(input, result);
            });
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns all descendant nodes for unwrap invocation.
         */
        static IEnumerable<Node> GetDescendants(Node input)
        {
            if (!input.Children.Any())
                yield break;
            foreach (var idx in input.Children)
            {
                yield return idx;
                foreach (var idxInner in GetDescendants(idx))
                {
                    yield return idxInner;
                }
            }
        }

        /*
         * Helper method containing commonalities to retrieve and parametrise lambda object.
         */
        Node GetLambda(Node input, string hyperlambda, string filename)
        {
            // Parsing specified Hyperlambda, creating our lambda object.
            var lambda = HyperlambdaParser.Parse(hyperlambda);

            /*
             * Preparing arguments, if there are any, making sure we remove
             * any declarative [.arguments] first.
             */
            lambda.Children
                .FirstOrDefault(x => x.Name == ".arguments")?
                .UnTie();
            if (input.Children.Any())
                lambda.Insert(0, new Node(".arguments", null, input.Children.ToList()));

            // Making sure we declare our [.filename] node in the lambda object.
            lambda.Insert(0, new Node(".filename", filename));

            // Returning lambda object to caller.
            return lambda;
        }

        /*
         * Commonalities to apply result after invocation of [eval].
         */
        void ApplyResult(Node input, Node result)
        {
            // Clearing Children collection, since it might contain input parameters.
            input.Clear();

            // Making sure we return both value and any children nodes to caller.
            input.Value = result.Value;
            input.AddRange(result.Children.ToList());
        }

        #endregion
    }
}
