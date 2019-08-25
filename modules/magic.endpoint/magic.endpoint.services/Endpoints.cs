/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System.IO;
using System.Linq;
using System.Collections.Generic;
using magic.endpoint.services.init;
using magic.node;
using magic.signals.contracts;

namespace magic.endpoint.services
{
    [Slot(Name = "system.endpoints")]
    public class Endpoints : ISlot, IMeta
    {
        public void Signal(Node input)
        {
            input.AddRange(AddCustomEndpoints(ConfigureServices.Root).ToList());
        }

        public IEnumerable<Node> GetArguments()
        {
            yield break;
        }

        #region [ -- Private helper methods -- ]

        IEnumerable<Node> AddCustomEndpoints(string currentFolder)
        {
            foreach (var idxFolder in Directory.GetDirectories(currentFolder))
            {
                var folder = idxFolder.Substring(ConfigureServices.Root.Length);
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
                var curRelativeFilepath = idxFile.Substring(ConfigureServices.Root.Length);
                var entities = curRelativeFilepath.Split('.');
                if (entities.Length == 3)
                {
                    if (entities[1] == "delete")
                        yield return new Node("", entities[0] + ".delete");
                    if (entities[1] == "get")
                        yield return new Node("", entities[0] + ".get");
                    if (entities[1] == "post")
                        yield return new Node("", entities[0] + ".post");
                    if (entities[1] == "put")
                        yield return new Node("", entities[0] + ".put");
                }
            }
            yield break;
        }

        #endregion
    }
}
