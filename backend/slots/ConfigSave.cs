/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

using System.IO;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [config.save] slot saving its value to your "appsettings.json" file.
    /// </summary>
    [Slot(Name = "config.save")]
    public class SaveAppSettings : ISlot
    {
        readonly IConfiguration _configuration;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="configRoot">Needed to force a reload of configuration settings after having saved the file.</param>
        public SaveAppSettings(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Retrieving appsettings JSON from input node as a string.
            var json = input.GetEx<string>();

            /*
             * This little bugger will validate that the JSON is actually valid JSON,
             * which prevents saving of non-valid JSON to configuration file.
             */
            var jObject = JObject.Parse(json);

            // Saving JSON as text to "appsettings.json" file.
            File.WriteAllText(
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "config",
                    "appsettings.json"),
                json);
        }
    }
}
