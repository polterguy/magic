/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.signals.contracts;

namespace magic.lambda.config
{
    /// <summary>
    /// [config.load] slot returning the entire contents of appsettings.json file raw to caller.
    /// </summary>
    [Slot(Name = "config.load")]
    public class LoadAppSettings : ISlotAsync
    {
        readonly IFileService _fileService;
        readonly IRootResolver _rootResolver;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="fileService">Needed to be able to save configuration settings.</param>
        /// <param name="rootResolver">Needed to be able to resolve root filename for configuration settings file.</param>
        public LoadAppSettings(
            IFileService fileService,
            IRootResolver rootResolver)
        {
            _fileService = fileService;
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            input.Value = await _fileService.LoadAsync(_rootResolver.RootFolder + "files/config/appsettings.json");
        }
    }
}
