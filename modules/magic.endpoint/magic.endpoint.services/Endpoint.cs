/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;
using magic.endpoint.services.init;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.endpoint.services
{
    [Slot(Name = "system.endpoint")]
    public class Endpoint : ISlot
    {
        readonly ISignaler _signaler;

        public Endpoint(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException();
        }

        public void Signal(Node input)
        {
            // Retrieving arguments to invocation.
            var url = input.Children.First(x => x.Name == "url").GetEx<string>(_signaler);
            var verb = input.Children.First(x => x.Name == "verb").GetEx<string>(_signaler);
            if (!Utilities.IsLegalHttpName(url))
                throw new ApplicationException($"Oops, '{url}' is not a valid HTTP URL for Magic");

            switch(verb)
            {
                case "get":
                case "delete":
                case "post":
                case "put":
                    break;
                default:
                    throw new ApplicationException($"I don't know how to '{verb}', only 'post', 'put', 'delete' and 'get'");
            }

            // Cleaning out results.
            input.Clear();
            input.Value = null;

            // Opening file, and trying to find its [.arguments] node.
            var filename = RootResolver.Root + url.TrimStart('/') + "." + verb + ".hl";
            if (!File.Exists(filename))
                throw new ApplicationException($"No endpoint found at '{url}' for verb '{verb}'");

            using (var stream = File.OpenRead(filename))
            {
                var lambda = new Parser(stream).Lambda();
                var argsNode = lambda.Children.FirstOrDefault(x => x.Name == ".arguments");
                if (argsNode == null)
                    return;

                // We have arguments in file endpoint.
                input.AddRange(argsNode.Children.ToList());
            }
        }
    }
}
