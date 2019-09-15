/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.extensions;
using magic.lambda.auth.init;
using magic.signals.contracts;
using magic.lambda.auth.helpers;

namespace magic.lambda.auth
{
	[Slot(Name = "auth.refresh-ticket")]
	public class RefreshTicket : ISlot
	{
        readonly IServiceProvider _services;
        readonly HttpService _httpService;
        readonly ISignaler _signaler;
        readonly IConfiguration _configuration;

        public RefreshTicket(
            IConfiguration configuration,
            IServiceProvider services,
            HttpService httpService,
            ISignaler signaler)
		{
            _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
            _services = services ?? throw new ArgumentNullException(nameof(services));
            _httpService = httpService ?? throw new ArgumentNullException(nameof(httpService));
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
		{
            // This will throw is ticket is expired, doesn't exist, etc.
            _httpService.VerifyTicket(_services, null);

            // Retrieving old ticket and using its data to create a new ticket.
            var ticket = _httpService.GetTicket(_services);
            input.Value = TickerFactory.CreateTicket(_configuration, ticket.Username, ticket.Roles);
		}
    }
}
