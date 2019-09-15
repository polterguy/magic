/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda
{
    [Slot(Name = "config")]
    public class Config : ISlot
    {
        readonly ISignaler _signaler;
        readonly IConfiguration _configuration;

        public Config(IConfiguration configuration, ISignaler signaler)
        {
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Children.Any())
                throw new ApplicationException("[config] cannot handle children nodes");

            input.Value = _configuration[input.GetEx<string>(_signaler)];
        }
    }
}
