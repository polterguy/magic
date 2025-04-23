/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.IO;
using System.Net;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts;
using magic.endpoint.contracts.poco;
using magic.endpoint.controller.utilities;

namespace magic.endpoint.controller
{
    /// <summary>
    /// Dynamic controller for executing dynamic logic, resolved with dynamic endpoint URLs,
    /// which again is passed into the executor service, to allow it to dynamically resolve
    /// towards whatever it wants to resolve the request with.
    /// 
    /// Can be used to execute scripts and such, based upon what URL is supplied by caller.
    /// Normally used for executing Hyperlambda files, resolving to files on disc, using the URL
    /// supplied as a file path and name.
    /// 
    /// Basically, anything starting with "magic" in its name, will be resolved using this
    /// controller, as long as it is a POST, PUT, GET, DELETE or PATCH request.
    /// </summary>
    public class EndpointController : ControllerBase
    {
        // Signal implementation needed to invoke slots.
        readonly ISignaler _signaler;

        // Service implementation responsible for executing the request.
        readonly IHttpExecutorAsync _executor;

        /*
         * Registered Content-Type payload handlers, responsible for handling requests and parametrising invocation
         * according to Content-Type specified by caller.
         */
        static readonly Dictionary<string, Func<ISignaler, HttpRequest, Task<Node>>> _payloadHandlers = new()
        {
            { "application/json", RequestHandlers.JsonHandler },
            { "application/x-json", RequestHandlers.JsonHandler },
            { "application/x-www-form-urlencoded", RequestHandlers.UrlEncodedHandler },
            { "application/www-form-urlencoded", RequestHandlers.UrlEncodedHandler },
            { "multipart/form-data", RequestHandlers.FormDataHandler },
        };

        /*
         * Registered Content-Type handlers, responsible for handling response and returning an IActionResult
         * according to the Content-Type of the response.
         */
        readonly static Dictionary<string, Func<MagicResponse, IActionResult>> _responseHandlers = new()
        {
            {
                "application/json", ResponseHandlers.JsonHandler
            }
        };

        /// <summary>
        /// Creates a new instance of your controller.
        /// </summary>
        /// <param name="executor">Service implementation for executing URLs.</param>
        /// <param name="signaler">Super signals implementation, needed to convert from JSON to Node.</param>
        public EndpointController(IHttpExecutorAsync executor, ISignaler signaler)
        {
            _executor = executor;
            _signaler = signaler;
        }

        /// <summary>
        /// Executes a dynamically resolved HTTP endpoint.
        /// </summary>
        /// <param name="url">The requested URL.</param>
        [HttpGet]
        [HttpPut]
        [HttpPost]
        [HttpPatch]
        [HttpDelete]
        [Route("{*url}")]
        [RequestFormLimits(ValueLengthLimit = int.MaxValue, MultipartBodyLengthLimit = int.MaxValue)]
        public async Task<IActionResult> Execute(string url)
        {
            return await HandleRequest(Request.Method?.ToLowerInvariant(), url);
        }

        /// <summary>
        /// Registers a Content-Type handler for specified Content-Type, allowing you to
        /// have a custom HTTP request handler for specified Content-Type, that will be used to parametrise
        /// your invocations to your executor.
        /// 
        /// Notice, this method is not thread safe, and should be invoked during startup of your
        /// application, for then to later be left alone and not tampered with.
        /// </summary>
        /// <param name="contentType">Content-Type to register</param>
        /// <param name="functor">Function to be invoked once specified Content-Type is provided to your endpoints</param>
        public static void RegisterContentType(string contentType, Func<ISignaler, HttpRequest, Task<Node>> functor)
        {
            _payloadHandlers[contentType] = functor;
        }

        /// <summary>
        /// Registers a Content-Type handler for specified Content-Type, allowing you to
        /// have a custom HTTP response handler for specified Content-Type, that will be used to
        /// return an IActionResult to the core.
        /// 
        /// Notice, this method is not thread safe, and should be invoked during startup of your
        /// application, for then to later be left alone and not tampered with.
        /// </summary>
        /// <param name="contentType">Content-Type to register</param>
        /// <param name="functor">Function to be invoked once specified Content-Type is returned from your endpoint</param>
        public static void RegisterContentType(string contentType, Func<MagicResponse, IActionResult> functor)
        {
            _responseHandlers[contentType] = functor;
        }

        #region [ -- Private helper methods -- ]

        /*
         * Helper that handles the HTTP request with the specified verb and URL.
         */
        async Task<IActionResult> HandleRequest(string verb, string url)
        {
            // Creating and decorating our request object.
            var request = new MagicRequest
            {
                URL = WebUtility.UrlDecode(url ?? ""),
                Verb = verb,
                Query = Request.Query.ToDictionary(x => x.Key, x => x.Value.ToString()),
                Headers = Request.Headers.ToDictionary(x => x.Key, x => x.Value.ToString()),
                Cookies = Request.Cookies.ToDictionary(x => x.Key, x => x.Value.ToString()),
                Host = Request.Host.Value,
                Scheme = Request.Scheme,
                Ip = Request.HttpContext.Connection.RemoteIpAddress,
            };

            // Notice, we only attach payload arguments to PUT, POST and PATCH requests.
            switch (verb)
            {
                case "put":
                case "post":
                case "patch":
                    request.Payload = await GetPayload();
                    break;

                case "get":
                case "delete":
                    break; // Request is accepted, even though we don't care about its payload.

                default:
                    throw new HyperlambdaException($"Sorry, I don't know how to handle the {verb} HTTP verb");
            }

            // Executing request and transforming to an IActionResult accordingly.
            return HandleResponse(await _executor.ExecuteAsync(request));
        }

        /*
         * Helper method to create arguments from body payload.
         */
        async Task<Node> GetPayload()
        {
            // Figuring out Content-Type of request.
            var contentType = Request.ContentType?
                .Split(';')
                .Select(x => x.Trim())
                .FirstOrDefault()?
                .ToLowerInvariant() ??
                "application/json";

            /*
             * Figuring out how to read request, which depends upon its Content-Type, and
             * whether or not we have a registered handler for specified Content-Type or not.
             */
            if (_payloadHandlers.TryGetValue(contentType, out var value))
                return await value(_signaler, Request); // Specialised handler
            else
                return new Node("", null, [new Node("body", Request.Body)]); // Default handler, simply adding raw Stream as [body].
        }

        /*
         * Transforms from our internal HttpResponse wrapper to an ActionResult
         */
        IActionResult HandleResponse(MagicResponse response)
        {
            // Decorating envelope of response which returns Content-Type to us.
            var contentType = DecorateResponseEnvelope(response);

            // If empty result, we return nothing.
            if (response.Content == null)
                return new StatusCodeResult(response.Result);

            /*
             * Figuring out how to return response, which depends upon its Content-Type, and
             * whether or not we have a registered handler for specified Content-Type or not.
             */
            if (_responseHandlers.TryGetValue(contentType, out var functor))
            {
                return functor(response);
            }
            else
            {
                // Generic handler for everything except specialised handlers registered for different content types.
                if (response.Content is string strResponse)
                    return new ContentResult { Content = strResponse, StatusCode = response.Result };

                if (response.Content is byte[] bytesResponse)
                    return new FileContentResult(bytesResponse, Response.ContentType);

                if (response.Content is Stream streamResponse)
                    return new FileStreamResult(streamResponse, Response.ContentType);

                throw new HyperlambdaException($"Unsupported return value from Hyperlambda, returning objects of type '{response.Content.GetType().FullName}' is not supported");
            }
        }

        /*
         * Responsible for decorating envlope of HTTP response.
         */
        string DecorateResponseEnvelope(MagicResponse response)
        {
            // Making sure we attach any explicitly added HTTP headers to the response.
            foreach (var idx in response.Headers)
            {
                Response.Headers[idx.Key] = idx.Value;
            }

#if DEBUG
            // Making it easier to debug locally by simply "turning off" all CORS safe guards in DEBUG builds.
            if (!Response.Headers.ContainsKey("Access-Control-Allow-Origin"))
                Response.Headers["Access-Control-Allow-Origin"] = "*";
#endif

            // Making sure we attach all cookies.
            foreach (var idx in response.Cookies)
            {
                var options = new CookieOptions
                {
                    Secure = idx.Secure,
                    Expires = idx.Expires,
                    HttpOnly = idx.HttpOnly,
                    Domain = idx.Domain,    
                    Path = idx.Path,
                };
                if (!string.IsNullOrEmpty(idx.SameSite))
                    options.SameSite = (SameSiteMode)Enum.Parse(typeof(SameSiteMode), idx.SameSite, true);
                Response.Cookies.Append(idx.Name, idx.Value, options);
            }

            // Unless explicitly overridden by service, we default Content-Type to JSON / UTF8.
            if (!response.Headers.TryGetValue("Content-Type", out string value) || string.IsNullOrEmpty(value))
            {
                Response.ContentType = "application/json; char-set=utf-8";
                return "application/json";
            }
            else
            {
                // Figuring out Content-Type (minus arguments).
                return Response.ContentType
                    .Split(';')
                    .Select(x => x.Trim())
                    .FirstOrDefault()
                    .ToLowerInvariant();
            }
        }

        #endregion
    }
}

