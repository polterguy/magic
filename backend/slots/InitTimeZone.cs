/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using Microsoft.Extensions.Configuration;

namespace magic.backend.slots
{
    /// <summary>
    /// [timezone.init] slot for reloading the time zone setting from configuration file.
    /// </summary>
    [Slot(Name = "timezone.init")]
    public class InitTimeZone : ISlot
    {
        readonly IConfiguration _configuration;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="configuration">Needed to read time zone setting from configuration file</param>
        public InitTimeZone(IConfiguration configuration)
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
            var defaultTimeZone = _configuration["magic:culture:defaultTimeZone"]?.ToLowerInvariant() ?? "none";
            Converter.DefaultTimeZone = defaultTimeZone;
        }
    }
}
