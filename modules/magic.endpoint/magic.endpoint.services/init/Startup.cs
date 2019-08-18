
/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using Microsoft.Extensions.Configuration;
using magic.common.contracts;
using magic.hyperlambda.utils;
using magic.signals.contracts;

namespace magic.endpoint.services.init
{
    class Startup : IStartup
    {
        public void Initialize(IServiceProvider kernel, IConfiguration configuration)
        {
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            foreach (var idxModules in Directory.GetDirectories(ConfigureServices.Root))
            {
                foreach (var idxModuleFolder in Directory.GetDirectories(idxModules))
                {
                    var folder = new DirectoryInfo(idxModuleFolder);
                    if (folder.Name == "magic.startup")
                    {
                        // Startup folder, now executing all Hyperlambda files inside of it.
                        foreach (var idxFile in Directory.GetFiles(idxModuleFolder, "*.hl"))
                        {
                            using (var stream = File.OpenRead(idxFile))
                            {
                                var lambda = new Parser(stream).Lambda();
                                signaler.Signal("eval", lambda);
                            }
                        }
                    }
                }
            }
        }
    }
}
