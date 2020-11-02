/*
 * Magic, Copyright(c) Thomas Hansen 2019 - 2020, thomas@servergardens.com, all rights reserved.
 * See the enclosed LICENSE file for details.
 */

using Microsoft.Extensions.Configuration;
using magic.node;
using magic.signals.contracts;

namespace magic.signals.services
{
    /// <summary>
    /// [license.raw] slot for returning license in raw signed format.
    /// </summary>
    [Slot(Name = "license.raw")]
    public class LicenseRaw : ISlot
    {
        readonly IConfiguration _configuration;

        public LicenseRaw(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Handles the signal for the class.
        /// </summary>
        /// <param name="signaler">Signaler used to signal the slot.</param>
        /// <param name="input">Root node for invocation.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = _configuration["magic:license"];
        }
    }
}
