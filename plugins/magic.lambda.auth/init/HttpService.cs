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
            var contextAccessor = services.GetService(typeof(IHttpContextAccessor)) as IHttpContextAccessor;
            var context = contextAccessor.HttpContext;
            if (context == null)
                throw new ApplicationException("No HTTP context exists");

            var user = context.User;
            if (user == null ||
                !user.Identity.IsAuthenticated)
                throw new ApplicationException("Access denied");
            var inRole = false;
            foreach (var idxRole in role.Split(new char[] { ',' }, StringSplitOptions.RemoveEmptyEntries))
            {
                if (user.IsInRole(idxRole))
                {
                    inRole = true;
                    break;
                }
            }
            if (!inRole)
                throw new ApplicationException("Access denied");
        }
    }
}
