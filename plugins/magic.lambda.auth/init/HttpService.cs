/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using Microsoft.AspNetCore.Http;

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
            if (user == null ||
                !user.Identity.IsAuthenticated)
                throw new ApplicationException("Access denied");

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
}
