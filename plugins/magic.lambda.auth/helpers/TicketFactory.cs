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

namespace magic.lambda.auth.helpers
{
	public static class TickerFactory
	{
        public static string CreateTicket(
            IConfiguration configuration, 
            string username, 
            IEnumerable<string> roles)
        {
            // Getting data to put into token.
            var secret = configuration["auth:secret"];
            var validMinutes = int.Parse(configuration["auth:valid-minutes"]);
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
    }
}
