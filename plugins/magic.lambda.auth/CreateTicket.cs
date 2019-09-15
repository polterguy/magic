/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.lambda.auth.helpers;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.auth
{
	[Slot(Name = "auth.create-ticket")]
	public class CreateTicket : ISlot
	{
		readonly ISignaler _signaler;
		readonly IConfiguration _configuration;

		public CreateTicket(IConfiguration configuration, ISignaler signaler)
		{
			_configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
			_signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
		}

		public void Signal(Node input)
		{
            if (input.Children.Any(x => x.Name != "username" && x.Name != "roles"))
                throw new ApplicationException("[auth.create-ticket] can only handle [username] and [roles] children nodes");

            var usernameNode = input.Children.Where(x => x.Name == "username");
            var rolesNode = input.Children.Where(x => x.Name == "roles");

            if (usernameNode.Count() != 1 || rolesNode.Count() != 1)
                throw new ApplicationException("[auth.create-ticket] must be given exactly one [username] and one [roles] children nodes");

            var username = usernameNode.First().GetEx<string>(_signaler);
            var roles = rolesNode.First().Children.Select(x => x.GetEx<string>(_signaler));

            input.Clear();
            input.Value = TickerFactory.CreateTicket(_configuration, username, roles);
		}
    }
}
