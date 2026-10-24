/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
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

            // JSON created by the executor, which is already UTF8 encoded, and only needs to be written.
            if (response.Content is JsonContent jsonContent)
                return new JsonBytesResult(jsonContent.Utf8, response.Result);

            // Not JSON we know how to return, which has always been returned as null.
            return new ContentResult { Content = "null", StatusCode = response.Result };
        }
    }

    /*
     * Writes JSON that is already UTF8 encoded to the response, with the length of it, so the response is never chunked.
     */
    internal sealed class JsonBytesResult : IActionResult
    {
        readonly byte[] _utf8;
        readonly int _status;

        public JsonBytesResult(byte[] utf8, int status)
        {
            _utf8 = utf8;
            _status = status;
        }

        public Task ExecuteResultAsync(ActionContext context)
        {
            var response = context.HttpContext.Response;
            response.StatusCode = _status;
            response.ContentLength = _utf8.Length;
            return response.Body.WriteAsync(_utf8).AsTask();
        }
    }
}
