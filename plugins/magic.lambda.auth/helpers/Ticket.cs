/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;

namespace magic.lambda.auth.helpers
{
	public class Ticket
	{
        public Ticket(string username, IEnumerable<string> roles)
        {
            Username = username ?? throw new ArgumentNullException(nameof(username));

            if (roles == null || roles.Count() == 0)
                throw new ArgumentException(nameof(roles));
            Roles = new List<string>(roles);
        }

        public string Username { get; private set; }

        public List<string> Roles { get; private set; }
    }
}
