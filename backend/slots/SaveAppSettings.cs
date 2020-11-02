/*
 * Magic, Copyright(c) Thomas Hansen 2019 - 2020, thomas@servergardens.com, all rights reserved.
 * See the enclosed LICENSE file for details.
 */

using System.IO;
using Newtonsoft.Json.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [save-app-settings] slot saving its value to your "appsettings.json" file.
    /// </summary>
    [Slot(Name = "save-app-settings")]
    public class SaveAppSettings : ISlot
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var json = input.GetEx<string>();

            /*
             * This little bugger will validate that the JSON is actually valid JSON,
             * which prevents saving of non-valid JSON to configuration file.
             */
            JObject.Parse(json);
            File.WriteAllText(
                Directory.GetCurrentDirectory().Replace("\\", "/").TrimEnd('/') +
                "/appsettings.json",
                json);
        }
    }
}
