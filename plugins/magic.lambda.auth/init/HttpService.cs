/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using magic.lambda.auth.helpers;

namespace magic.lambda.auth.init
{
    public class HttpService
    {
        public void VerifyTicket(IServiceProvider services, string role)
        {
            // Retrieving the HttpContext object.
            var contextAccessor = services.GetService(typeof(IHttpContextAccessor)) as IHttpContextAccessor;
            var context = contextAccessor.HttpContext;
            if (context == null)
                throw new ApplicationException("No HTTP context exists");

            // Verifying we're dealing with an authenticated user.
            var user = context.User;
            if (user == null || !user.Identity.IsAuthenticated)
                throw new ApplicationException("Access denied");

            // Checking if caller is also trying to check if user belongs to some role(s).
            if (!string.IsNullOrEmpty(role))
            {
                // Verifying the users belongs to (at least) one of the comma separated roles supplied.
                var inRole = false;
                foreach (var idxRole in role.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
                {
                    if (user.IsInRole(idxRole.Trim()))
                    {
                        inRole = true;
                        break;
                    }
                }

                // Throwing an exception unless the user belongs to the specified role.
                if (!inRole)
                    throw new ApplicationException("Access denied");
            }
        }

        public Ticket GetTicket(IServiceProvider services)
        {
            // Retrieving the HttpContext object.
            var contextAccessor = services.GetService(typeof(IHttpContextAccessor)) as IHttpContextAccessor;
            var context = contextAccessor.HttpContext;
            if (context == null)
                throw new ApplicationException("No HTTP context exists");

            // Verifying we're dealing with an authenticated user.
            var user = context.User;
            if (user == null || !user.Identity.IsAuthenticated)
                throw new ApplicationException("Access denied");

            // Finding roles for user.
            var identity = user.Identity as ClaimsIdentity;
            var username = identity.Claims
                .Where(c => c.Type == ClaimTypes.Name)
                .Select(c => c.Value).First();
            var roles = identity.Claims
                .Where(c => c.Type == ClaimTypes.Role)
                .Select(c => c.Value);
            return new Ticket(username, roles);
        }
    }
}
