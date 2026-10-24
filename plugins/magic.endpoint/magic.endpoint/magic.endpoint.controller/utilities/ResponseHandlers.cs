/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Microsoft.AspNetCore.Mvc;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.controller.utilities
{
    /*
     * Default Content-Type response handlers responsible for creating the response according to
     * Content-Type HTTP header provided by Hyperlambda.
     */
    internal static class ResponseHandlers
    {
        /*
         * Default JSON handler, simply returning the JSON as a string to caller.
         */
        internal static IActionResult JsonHandler(MagicResponse response)
        {
            // Checking if JSON is already converted into a string, at which point we return it as such.
            if (response.Content is string strContent)
                return new ContentResult { Content = strContent, StatusCode = response.Result };

            // Not JSON we know how to return, which has always been returned as null.
            return new ContentResult { Content = "null", StatusCode = response.Result };
        }
    }
}
