/*
 * Magic, Copyright(c) Thomas Hansen 2019, thomas@servergardens.com, all rights reserved.
 * See the enclosed LICENSE file for details.
 */

using System.IO;
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
            File.WriteAllText(
                Directory.GetCurrentDirectory().Trim('\\').Trim('/') + "/appsettings.json",
                input.GetEx<string>());
        }
    }
}
