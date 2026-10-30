/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;
using magic.endpoint.services.slots.meta;

namespace magic.endpoint.services.slots.misc
{
    /// <summary>
    /// [endpoints.list] slot for returning all dynamica Hyperlambda endpoints
    /// for your application, in addition to their meta information.
    /// </summary>
    [Slot(
        Name = "endpoints.list",
        Description = "Lists dynamic Hyperlambda endpoints with metadata",
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "endpoint-list,node-list",
        ReturnsElementKind = "endpoint,lambda-tree",
        ReturnsDescription = "Resolves to one child node per discovered endpoint, including its endpoint metadata")]
    public class ListEndpoints : ISlotAsync
    {
        /*
         * Resolvers for meta data.
         *
         * These are the default meta retrievers, but can easily be extended by creating your 
         * own meta resolvers using the static `AddMetaDataResolver` method.
         */
        static readonly List<Func<Node, string, Node, IEnumerable<Node>>> _endpointMetaRetrievers =
            new List<Func<Node, string, Node, IEnumerable<Node>>>
        {
            (lambda, verb, args) => MetaRetrievers.EndpointType(lambda, verb, args),
            (lambda, verb, args) => MetaRetrievers.CrudEndpointMetaGet(lambda, verb, args),
            (lambda, verb, args) => MetaRetrievers.ContentType(lambda, verb, args),
            (lambda, verb, args) => MetaRetrievers.Accepts(lambda, verb, args),
        };

        readonly IRootResolver _rootResolver;
        readonly IFileService _fileService;
        Dictionary<string, string> _content;

        /// <summary>
        /// Creates an instance of your object
        /// </summary>
        /// <param name="rootResolver">Needed to resolve root folder path for files and folders.</param>
        /// <param name="fileService">Needed to resolve files in system.</param>
        public ListEndpoints(
            IRootResolver rootResolver,
            IFileService fileService)
        {
            _rootResolver = rootResolver;
            _fileService = fileService;
        }

        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler that invoked your slot.</param>
        /// <param name="input">Arguments to your slot.</param>
        /// <returns>Awaitable task</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Endpoints can only exist under system/ and modules/, so we only load those folders.
            _content = (await _fileService
                .LoadAllAsync(_rootResolver.AbsolutePath("system/"), ".hl"))
                .Concat(await _fileService
                    .LoadAllAsync(_rootResolver.AbsolutePath("modules/"), ".hl"))
                .ToDictionary(x => x.Filename, x => Encoding.UTF8.GetString(x.Content));

            input.AddRange(
                HandleFiles(
                    _rootResolver.DynamicFiles,
                    _rootResolver.AbsolutePath("system/")));
            input.AddRange(
                HandleFiles(
                    _rootResolver.DynamicFiles,
                    _rootResolver.AbsolutePath("modules/")));
        }

        /// <summary>
        /// Adds a meta data resolver, allowing you to inject your own meta data,
        /// depending upon the lambda structure of the content of the file reolved
        /// in your endpoint.
        /// 
        /// Your function will be invoked with the entire lambda for your file, its verb,
        /// and its arguments. The latter will be found from your file's [.arguments] node.
        /// </summary>
        /// <param name="functor">Function responsible for returning additional meta data for endpoint.</param>
        public static void AddMetaDataResolver(Func<Node, string, Node, IEnumerable<Node>> functor)
        {
            _endpointMetaRetrievers.Add(functor);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns all fildes from current folder that matches some HTTP verb.
         */
        List<Node> HandleFiles(string rootFolder, string folder)
        {
            // Buffer to hold result.
            var result = new List<Node>();

            // Looping through each file in current folder.
            foreach (var idxFile in _content.Keys.Where(x => x.StartsWith(folder, StringComparison.Ordinal)))
            {
                // Removing the root folder, to return only relativ filename back to caller.
                var filename = idxFile.Substring(rootFolder.Length);

                // Making sure we only return files with format of "foo.xxx.hl", where xxx is some valid HTTP verb.
                var entities = filename.Split('.');
                if (entities.Length == 3)
                {
                    // Returning a Node representing the currently iterated file.
                    switch (entities[1])
                    {
                        case "delete":
                        case "put":
                        case "patch":
                        case "post":
                        case "get":
                        case "socket":
                            result.Add(GetFileMetaData(entities[0], entities[1], idxFile));
                            break;
                    }
                }
            }

            // Returning result to caller.
            return result;
        }

        /*
         * Returns a single node, representing the endpoint given
         * as verb/filename/path, and its associated meta information.
         */
        Node GetFileMetaData(
            string path,
            string verb,
            string filename)
        {
            // Creating our result node, and making sure we return path and verb.
            var result = new Node("");
            result.Add(new Node("path", "magic/" + path)); // Must add "Route" parts.
            result.Add(new Node("verb", verb));

            // Ensuring we don't crash the whole meta retrieval bugger if there is an error in one of our endpoints.
            try
            {
                /*
                 * We need to inspect content of file to retrieve meta information about it,
                 * such as authorization, description, etc.
                 */
                var lambda = HyperlambdaParser.Parse(_content[filename], true);

                // Extracting components from file.
                var args = GetInputArguments(lambda, verb);
                result.AddRange(new Node[] {
                    args,
                    GetAuthorization(lambda),
                    GetDescription(lambda),
                }.Where(x => x!= null));

                result.AddRange(GetEndpointCustomInformation(lambda, verb, args));
            }
            catch(Exception error)
            {
                result.Add(new Node("error", error.Message));
            }

            // Returning results to caller.
            return result;
        }

        /*
         * Extracts arguments, if existing.
         */
        static Node GetInputArguments(Node lambda, string verb)
        {
            var result = new Node("input");
            var args = lambda.Children.FirstOrDefault(x => x.Name == ".arguments");
            if (args != null)
            {
                foreach (var idx in args.Children.Where(x => x.Name != ".."))
                {
                    result.Add(CreateArgumentNode(lambda, verb, idx));
                }
            }
            return result.Children.Any() ? result : null;
        }

        /*
         * Creates the node describing a single argument.
         */
        static Node CreateArgumentNode(Node lambda, string verb, Node argument)
        {
            var node = new Node(".");
            node.Add(new Node("name", argument.Name));
            node.Add(new Node("type", argument.Value));
            if (argument.Previous != null && argument.Previous.Name == "..")
                node.Add(new Node("description", argument.Previous.Value));
            if (verb == "post" || verb == "put")
                AddLookups(lambda, argument, node);

            // Checking for handling.
            var handling = lambda
                .Children
                .FirstOrDefault(x => x.Name == ".handling")?
                .Children
                .Where(x => x.Name == argument.Name) ?? Array.Empty<Node>();
            foreach (var idxHa in handling)
            {
                node.Add(new Node("handling", idxHa.Value));
            }
            return node;
        }

        /*
         * Attaches foreign key information if possible.
         */
        static void AddLookups(Node lambda, Node argument, Node node)
        {
            var fkNodes = lambda
                .Children
                .FirstOrDefault(x => x.Name == ".foreign-keys")?
                .Children
                .Where(x => x.Name != "..")
                .Where(x => x.Children.Any(x2 => x2.Name == "column" && x2.GetEx<string>() == argument.Name)) ?? Array.Empty<Node>();
            foreach (var idxFk in fkNodes.Select(x => x.Children))
            {
                var fkNode = new Node("lookup");
                fkNode.Add(new Node("table", idxFk.FirstOrDefault(x => x.Name == "table")?.GetEx<string>()));
                fkNode.Add(new Node("key", idxFk.FirstOrDefault(x => x.Name == "foreign_column")?.GetEx<string>()));
                fkNode.Add(new Node("name", idxFk.FirstOrDefault(x => x.Name == "foreign_name")?.GetEx<string>()));
                fkNode.Add(new Node("long", idxFk.FirstOrDefault(x => x.Name == "long")?.GetEx<bool>()));
                node.Add(fkNode);
            }
        }

        /*
         * Extracts authorization for executing Hyperlambda file.
         */
        static Node GetAuthorization(Node lambda)
        {
            Node result = new Node("auth");
            foreach (var idx in lambda.Children)
            {
                if (idx.Name == "auth.ticket.verify")
                {
                    result.AddRange(
                        idx.GetEx<string>()?
                        .Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => new Node("", x.Trim())) ?? new Node[] { new Node("", "*") });
                }
            }
            return result.Children.Any() ? result : null;
        }

        /*
         * Extracts description, if existing.
         */
        static Node GetDescription(Node lambda)
        {
            var result = lambda
                .Children
                .FirstOrDefault(x => x.Name == ".description")?
                .Get<string>();

            if (!string.IsNullOrEmpty(result))
                return new Node("description", result);

            if (lambda.Children.FirstOrDefault()?.Name == "..")
                return new Node("description", lambda.Children.First().GetEx<string>());

            return null;
        }

        /*
         * Extracts custom information from endpoint,
         * which depends upon what type of endpoint this is.
         */
        static IEnumerable<Node> GetEndpointCustomInformation(
            Node lambda,
            string verb,
            Node args)
        {
            foreach (var idxResult in _endpointMetaRetrievers.SelectMany(x => x(lambda, verb, args)))
            {
                yield return idxResult;
            }
        }

        #endregion
    }
}
