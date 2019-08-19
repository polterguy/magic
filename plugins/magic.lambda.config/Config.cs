/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.signals.contracts;
using magic.hyperlambda.utils;
using Microsoft.Extensions.Configuration;

namespace magic.lambda
{
    [Slot(Name = "config")]
    public class Config : ISlot, IMeta
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

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
