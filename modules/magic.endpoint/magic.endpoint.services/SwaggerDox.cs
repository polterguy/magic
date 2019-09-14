/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using Swashbuckle.AspNetCore.Swagger;
using magic.node;
using magic.signals.contracts;
using magic.endpoint.services.init;

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
            var toRemove = new List<string>(doc.Paths.Keys.Where(x => x == "/api/hl/{url}"));
            foreach (var idx in toRemove)
            {
                doc.Paths.Remove(idx);
            }
            AddCustomEndpoints(doc, RootResolver.Root);
        }

        #region [ -- Private helper methods -- ]

        void AddCustomEndpoints(SwaggerDocument doc, string currentFolder)
        {
            foreach (var idx in Directory.GetDirectories(currentFolder))
            {
                var folder = "/" + idx.Substring(RootResolver.Root.Length);
                if (Utilities.IsLegalHttpName(folder))
                    AddAllVerbs(doc, idx);
            }
        }

        void AddAllVerbs(SwaggerDocument doc, string folder)
        {
            foreach (var idxFile in Directory.GetFiles(folder, "*.hl"))
            {
                var filename = "/" + idxFile.Substring(RootResolver.Root.Length).Replace("\\", "/");
                if (Utilities.IsLegalHttpName(filename.Substring(0, filename.IndexOf(".", StringComparison.InvariantCulture))))
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

        private void AddVerb(
            SwaggerDocument doc, 
            string verb, 
            string filename, 
            string fullFilename)
        {
            // Figuring out which key to use, and making sure we put an item into dictionary for URL.
            var itemType = filename.Substring(0, filename.IndexOf(".")); ;
            var key = "/api/hl" + itemType;
            if (!doc.Paths.ContainsKey(key))
            {
                var p = new PathItem();
                doc.Paths[key] = p;
            }

            // Retrieving existing item from path.
            var item = doc.Paths[key];

            // Creating our operation item.
            var tag = filename.Substring(0, filename.IndexOf(".")).Trim('/');
            var operation = new Operation
            {
                Tags = new List<string> { tag },
            };

            // Figuring out the type of operation this is.
            switch (verb)
            {
                case "get":
                    operation.Produces = new List<string> { "application/json" };
                    operation.Description = $"Returns '{itemType}' from the server";
                    item.Get = operation;
                    break;

                case "delete":
                    operation.Produces = new List<string> { "application/json" };
                    operation.Description = $"Deletes '{itemType}' from the server";
                    item.Delete = operation;
                    break;

                case "put":
                    operation.Consumes = new List<string> { "application/json" };
                    operation.Produces = new List<string> { "application/json" };
                    operation.Description = $"Updates an existing '{itemType}' on the server";
                    item.Put = operation;
                    break;

                case "post":
                    operation.Consumes = new List<string> { "application/json" };
                    operation.Produces = new List<string> { "application/json" };
                    operation.Description = $"Creates a new '{itemType}' on the server";
                    item.Post = operation;
                    break;
            }
        }

        #endregion
    }
}
