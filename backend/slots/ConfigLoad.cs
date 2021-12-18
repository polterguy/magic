/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

using System.IO;
using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [config.load] slot returning the entire contents of appsettings.json file raw to caller.
    /// </summary>
    [Slot(Name = "config.load")]
    public class LoadAppSettings : ISlot, ISlotAsync
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = File.ReadAllText(
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "config",
                    "appsettings.json"));
        }

        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            input.Value = await File.ReadAllTextAsync(
                Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "config",
                    "appsettings.json"));
        }
    }
}
