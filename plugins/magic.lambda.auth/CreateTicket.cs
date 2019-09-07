/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Text;
using System.Security.Claims;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda
{
	[Slot(Name = "auth.create-ticket")]
	public class CreateTicket : ISlot, IMeta
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
                throw new ApplicationException("[authenticate] can only handle [username] and [roles] children nodes");

            var usernameNode = input.Children.Where(x => x.Name == "username");
            var rolesNode = input.Children.Where(x => x.Name == "roles");

            if (usernameNode.Count() != 1 || rolesNode.Count() != 1)
                throw new ApplicationException("[authenticate] must be given exactly one [username] and one [roles] children nodes");

            var username = usernameNode.First().GetEx<string>(_signaler);
            var roles = rolesNode.First().Children.Select(x => x.GetEx<string>(_signaler));

            input.Clear();
            input.Value = CreateJWTToken(username, roles);
		}

        public IEnumerable<Node> GetArguments()
		{
            yield return new Node("username", 1);
            yield return new Node("roles", 1);
        }

        #region [ -- Private helper methods -- ]

        string CreateJWTToken(string username, IEnumerable<string> roles)
        {
            // Getting data to put into token.
            var secret = _configuration["auth:secret"];
            var validMinutes = int.Parse(_configuration["auth:valid-minutes"]);
            var key = Encoding.ASCII.GetBytes(secret);

            // Creating our token.
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new Claim(ClaimTypes.Name, username),
                }),
                Expires = DateTime.UtcNow.AddMinutes(validMinutes),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha512Signature),
            };

            // Adding all roles.
            tokenDescriptor.Subject.AddClaims(roles.Select(x => new Claim(ClaimTypes.Role, x)));

            // Creating token and returning to caller.
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        #endregion
    }
}
