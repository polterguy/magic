/*
 * Magic, Copyright(c) Thomas Hansen 2019 - 2020, thomas@servergardens.com, all rights reserved.
 * See the enclosed LICENSE file for details.
 */

using Microsoft.Extensions.Configuration;
using magic.node;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [license.apply] slot for applying license if given.
    /// </summary>
    [Slot(Name = "license.apply")]
    public class LicenseApply : ISlot
    {
        readonly IConfiguration _configuration;

        public LicenseApply(IConfiguration configuration)
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
            var license = _configuration["magic:license"];
            if (license != "SUPPLY-YOUR-LICENSE-HERE")
                Signaler.SetLicenseKey(license);
        }
    }
}
