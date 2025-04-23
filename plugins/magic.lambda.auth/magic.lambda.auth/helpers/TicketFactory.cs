/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.auth.contracts;

namespace magic.lambda.auth.helpers
{
    /// <summary>
    /// Helper class for creating, retrieving and verifying a JWT token from a ticket.
    /// </summary>
    public static class TicketFactory
    {
        /// <summary>
        /// Creates a JWT token from the specified ticket.
        /// </summary>
        /// <param name="settings">Configuration settings</param>
        /// <param name="ticket">Existing user ticket, containing username and roles</param>
        /// <returns>A JWT token</returns>
        public static string CreateTicket(
            IAuthSettings settings,
            Ticket ticket)
        {
            // Getting data to put into token.
            var secret = settings.Secret ?? "";
            if (secret.Length < 50)
                secret += "abcdefghijklmnopqrstuvwxyz1234567890";
            var key = Encoding.UTF8.GetBytes(secret);

            // Creating our token descriptor.
            var tokenHandler = new JwtSecurityTokenHandler();
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new Claim[]
                {
                    new(ClaimTypes.Name, ticket.Username),
                }),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
            };

            // Setting expiration date of ticket.
            if (ticket.Expires.HasValue)
            {
                // Notice, if expiration date is min value of DateTime we assume caller wants a token that "never expires", hence setting it 5 years into the future!
                if (ticket.Expires.Value != DateTime.MinValue)
                    tokenDescriptor.Expires = ticket.Expires.Value;
                else
                    tokenDescriptor.Expires = DateTime.Now.AddYears(5);
            }
            else
            {
                // Using default expiration value from configuration for JWT ticket.
                var validMinutes = settings.ValidMinutes;
                tokenDescriptor.Expires = DateTime.UtcNow.AddMinutes(validMinutes);
            }

            // Adding all roles.
            tokenDescriptor.Subject.AddClaims(ticket.Roles.Select(x => new Claim(ClaimTypes.Role, x)));

            // Adding all additional claims.
            tokenDescriptor.Subject.AddClaims(ticket.Claims.Select(x => new Claim(x.Name, x.Value)));

            // Creating token and returning to caller.
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>
        /// Verifies that the current user belongs to the specified role.
        /// </summary>
        /// <param name="ticketProvider">Service provider, needed to retrieve the IHttpContextAccessor</param>
        /// <param name="roles"></param>
        public static void VerifyTicket(
            ITicketProvider ticketProvider,
            string roles,
            ISignaler signaler)
        {
            // Checking if we've got a context stored ticket.
            var signalerAuth = signaler.Peek<Node>(".auth.ticket.get");
            if (signalerAuth != null)
            {
                // Retrieving roles from scoped context.
                var userRoles = signalerAuth.Children.FirstOrDefault(x2 => x2.Name == "roles").Children;

                // Checking if user is root, at which point user ALWAYS has access, regardless of the role declaration of the lambda object.
                if (userRoles.Any(x => x.Get<string>() == "root"))
                    return;

                // Checking if user belongs to at least one of the specified roles.
                if (!string.IsNullOrEmpty(roles) && !roles.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Any(x => userRoles.Any(x3 => x3.Get<string>() == x)))
                    throw new HyperlambdaException("Access denied", true, 401);

                return; // Success, found at least one roles in context.
            }

            if (ticketProvider == null || !ticketProvider.IsHttp || !ticketProvider.IsAuthenticated())
                throw new HyperlambdaException("Access denied", true, 401);

            if (!string.IsNullOrEmpty(roles) && !ticketProvider.InRole("root") && !roles.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Any(x => ticketProvider.InRole(x)))
                throw new HyperlambdaException("Access denied", true, 401);
        }

        /// <summary>
        /// Returns true if user belongs to any of the specified role(s) supplied as
        /// a comma separated list of values.
        /// </summary>
        /// <param name="ticketProvider">Service provider, needed to retrieve the IHttpContextAccessor</param>
        /// <param name="roles"></param>
        public static bool InRole(
            ITicketProvider ticketProvider,
            string roles,
            ISignaler signaler)
        {
            // Checking if we've got a context stored ticket.
            var signalerAuth = signaler.Peek<Node>(".auth.ticket.get");
            if (signalerAuth != null)
            {
                if (!string.IsNullOrEmpty(roles) && !roles.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Any(x => signalerAuth.Children.FirstOrDefault(x2 => x2.Name == "roles").Children.Any(x3 => x3.Get<string>() == x)))
                    return false;
                return true; // Success, found at least one roles in context.
            }

            if (ticketProvider == null || !ticketProvider.IsHttp || !ticketProvider.IsAuthenticated())
                return false;

            if (string.IsNullOrEmpty(roles))
                return false;
            return roles.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries).Any(x => ticketProvider.InRole(x));
        }

        /// <summary>
        /// Returns the ticket belonging to the specified user.
        /// </summary>
        /// <param name="ticketProvider">Service provider, necessary to retrieve the IHttpContextAccessor</param>
        /// <returns></returns>
        public static Ticket GetTicket(ITicketProvider ticketProvider, ISignaler signaler)
        {
            var signalerAuth = signaler.Peek<Node>(".auth.ticket.get");
            if (signalerAuth != null)
            {
                return new Ticket(
                    signalerAuth.Get<string>(),
                    signalerAuth.Children.FirstOrDefault(x => x.Name == "roles")?.Children.Select(x => x.Get<string>()) ?? [],
                    signalerAuth.Children.FirstOrDefault(x => x.Name == "claims")?.Children.Select(x => {
                        return (x.Name, Value: x.Get<string>());
                    }) ?? []);
            }

            if (ticketProvider == null || !ticketProvider.IsHttp)
                return null;

            return new Ticket(ticketProvider.Username, ticketProvider.Roles, ticketProvider.Claims);
        }
    }
}
