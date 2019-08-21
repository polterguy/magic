/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.IO;
using System.Linq;
using System.Collections.Generic;
using Swashbuckle.AspNetCore.Swagger;
using magic.node;
using magic.signals.contracts;
using magic.endpoint.services.init;
using System;

namespace magic.endpoint.services
{
    [Slot(Name = ".swagger-dox.generic")]
    public class SwaggerDox : ISlot
    {
        readonly ISignaler _signaler;

        public SwaggerDox(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            var doc = input.Value as SwaggerDocument;
            var toRemove = new List<string>(doc.Paths.Keys.Where((x) => x == "/api/endpoint/{url}"));
            foreach (var idx in toRemove)
            {
                doc.Paths.Remove(idx);
            }
            AddCustomEndpoints(doc, ConfigureServices.Root);
        }

        #region [ -- Private helper methods -- ]

        void AddCustomEndpoints(SwaggerDocument doc, string currentFolder)
        {
            foreach (var idx in Directory.GetDirectories(currentFolder))
            {
                var folder = "/" + idx.Substring(ConfigureServices.Root.Length);
                if (IsLegalHttpName(folder))
                    AddAllVerbs(doc, idx);
            }
        }

        void AddAllVerbs(SwaggerDocument doc, string folder)
        {
            foreach (var idxFile in Directory.GetFiles(folder, "*.hl"))
            {
                var filename = "/" + idxFile.Substring(ConfigureServices.Root.Length).Replace("\\", "/");
                if (IsLegalHttpName(filename))
                {
                    var fileInfo = new FileInfo(filename);
                    var splits = fileInfo.Name.Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries);
                    if (splits.Length == 3)
                    {
                        switch (splits[1])
                        {
                            case "get":
                            case "put":
                            case "post":
                            case "delete":
                                AddVerb(doc, splits[1], filename, idxFile);
                                break;
                        }
                    }
                }
            }
        }

        private void AddVerb(SwaggerDocument doc, string verb, string filename, string fullFilename)
        {
            // Figuring out which key to use, and making sure we put an item into dictionary for URL.
            var key = filename.Substring(0, filename.IndexOf("."));
            if (!doc.Paths.ContainsKey(key))
            {
                var p = new PathItem();
                doc.Paths[key] = p;
            }

            // Retrieving existing item from paths.
            var item = doc.Paths[key];

            // Creating our operation item.
            var operation = new Operation();

            // Reading arguments from file.
            var fileContent = File.ReadAllText(fullFilename);
            var node = new Node("", fileContent);
            _signaler.Signal("lambda", node);

            var arguments = node.Children.Where((x) => x.Name == ".arguments");
            if (arguments.Any())
            {
                if (arguments.Count() > 1)
                    throw new ApplicationException($"Too many [.arguments] nodes found in Hyperlambda file '{filename}'");

                operation.Parameters = new List<IParameter>();
                foreach (var idx in arguments.First().Children)
                {
                    IParameter argument;
                    if (verb == "get" || verb == "delete")
                    {
                        argument = new NonBodyParameter
                        {
                            Name = idx.Name,
                        };
                        var typeDecl = idx.Get<string>();
                        if (typeDecl == "string")
                            ((NonBodyParameter)argument).Type = "string";
                    }
                    else
                    {
                        argument = new BodyParameter
                        {
                            Name = idx.Name,
                        };
                    }
                    argument.Required = true;
                    operation.Parameters.Add(argument);
                }
            }

            // Figuring out the type of operation this is.
            switch (verb)
            {
                case "get":
                    operation.Produces = new List<string> { "application/json" };
                    item.Get = operation;
                    break;

                case "delete":
                    operation.Produces = new List<string> { "application/json" };
                    item.Delete = operation;
                    break;

                case "put":
                    operation.Consumes = new List<string> { "application/json" };
                    operation.Produces = new List<string> { "application/json" };
                    item.Put = operation;
                    break;

                case "post":
                    operation.Consumes = new List<string> { "application/json" };
                    operation.Produces = new List<string> { "application/json" };
                    item.Post = operation;
                    break;
            }
        }

        bool IsLegalHttpName(string folder)
        {
            foreach (var idx in folder)
            {
                switch (idx)
                {
                    case '-':
                    case '.':
                    case '/':
                        break;
                    default:
                        if ((idx < 'a' || idx > 'z') && (idx < '0' || idx > '9'))
                            return false;
                        break;
                }
            }
            return true;
        }

        #endregion
    }
}
