/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.signals.contracts;
using magic.hyperlambda.utils;

namespace magic.lambda
{
    [Slot(Name = "config-list")]
    public class ConfigList : ISlot, IMeta
    {
        readonly ISignaler _signaler;
        readonly IConfiguration _configuration;

        public ConfigList(IConfiguration configuration, ISignaler signaler)
        {
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            if (input.Children.Any())
                throw new ApplicationException("[config-list] cannot handle children nodes");

            var settings = _configuration.GetSection(input.GetEx<string>(_signaler)).Get<Dictionary<string, string>>();

            input.Value = null;
            input.AddRange(settings.Select((x) => new Node(x.Key, x.Value)));
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
        }
    }
}
