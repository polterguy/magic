/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;
using magic.endpoint.services.init;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.endpoint.services
{
    [Slot(Name = "system.endpoints")]
    public class Endpoints : ISlot
    {
        readonly ISignaler _signaler;

        public Endpoints(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            input.AddRange(AddCustomEndpoints(RootResolver.Root).ToList());
        }

        #region [ -- Private helper methods -- ]

        IEnumerable<Node> AddCustomEndpoints(string currentFolder)
        {
            foreach (var idxFolder in Directory.GetDirectories(currentFolder))
            {
                var folder = idxFolder.Substring(RootResolver.Root.Length);
                if (Utilities.IsLegalHttpName(folder))
                {
                    foreach (var idxVerb in GetVerbForFolder(idxFolder, folder))
                    {
                        yield return idxVerb;
                    }
                }

                // Recursively retrieving inner folder.
                foreach (var idx in AddCustomEndpoints(idxFolder))
                {
                    yield return idx;
                }
            }
        }

        IEnumerable<Node> GetVerbForFolder(string fullFolder, string relativeFolder)
        {
            var folderFiles = Directory.GetFiles(fullFolder, "*.hl").Select(x => x.Replace("\\", "/"));
            foreach (var idxFile in folderFiles)
            {
                var curRelativeFilepath = idxFile.Substring(RootResolver.Root.Length);
                var entities = curRelativeFilepath.Split('.');
                if (entities.Length == 3)
                {
                    if (entities[1] == "delete")
                        yield return GetPath(entities[0], "delete", idxFile);
                    if (entities[1] == "get")
                        yield return GetPath(entities[0], "get", idxFile);
                    if (entities[1] == "post")
                        yield return GetPath(entities[0], "post", idxFile);
                    if (entities[1] == "put")
                        yield return GetPath(entities[0], "put", idxFile);
                }
            }
            yield break;
        }

        Node GetPath(string path, string verb, string filename)
        {
            var result = new Node("");
            result.Add(new Node("path", path));
            result.Add(new Node("verb", verb));
            var auth = new Node("auth");
            using (var stream = File.OpenRead(filename))
            {
                var lambda = new Parser(stream).Lambda();
                foreach (var idx in lambda.Children)
                {
                    if (idx.Name == "auth.verify-ticket")
                    {
                        foreach (var idxRole in idx.GetEx<string>(_signaler)
                            .Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
                        {
                            auth.Add(new Node("", idxRole));
                        }
                    }
                }
            }
            result.Add(auth);
            return result;
        }

        #endregion
    }
}
