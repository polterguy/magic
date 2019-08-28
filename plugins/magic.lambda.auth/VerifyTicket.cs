/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.lambda.auth.init;
using magic.signals.contracts;

namespace magic.lambda
{
	[Slot(Name = "auth.verify-ticket")]
	public class VerifyTicket : ISlot, IMeta
	{
        readonly IServiceProvider _services;
        readonly HttpService _httpService;
        readonly ISignaler _signaler;

        public VerifyTicket(
            IServiceProvider services,
            HttpService httpService,
            ISignaler signaler)
		{
            _services = services ?? throw new ArgumentNullException(nameof(services));
            _httpService = httpService ?? throw new ArgumentNullException(nameof(httpService));
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
		{
            _httpService.VerifyTicket(_services, input.GetEx<string>(_signaler));
            input.Value = true;
		}

        public IEnumerable<Node> GetArguments()
		{
            yield return new Node(":", "*");
        }
    }
}
