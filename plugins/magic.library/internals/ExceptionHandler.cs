/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Newtonsoft.Json.Linq;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.logging.contracts;

namespace magic.library.internals
{
    /*
     * Internal helper class to handle unhandled exceptions.
     */
    internal sealed class ExceptionHandler : IExceptionHandler
    {
        const string DEFAULT_ERROR_MESSAGE = "Guru meditation, come back when Universe is in order!";

        /*
         * Handles the unhandled exception.
         */
        public async Task HandleException(
            IApplicationBuilder app,
            HttpContext context,
            IRootResolver rootResolver,
            IFileService fileService)
        {
            // Getting the path of the unhandled exception.
            var ex = context.Features.Get<IExceptionHandlerPathFeature>();

            // Ensuring we have access to the exception handler path feature before proceeding.
            if (ex != null)
            {
                // Defaulting status code and response Content-Type.
                context.Response.StatusCode = 500;
                context.Response.ContentType = "application/json";

                // Try custom handler first, and if no handler found, resorting to default handler.
                if (!await TryCustomExceptionHandler(rootResolver, fileService, app, ex, context))
                    await DefaultHandler(app, context, ex);
            }
        }

        #region [ -- Private helper methods -- ]

        /*
         * Tries to execute custom exception handler, and if we can find a custom handler,
         * returning true to caller - Otherwise returning false.
         */
        static async Task<bool> TryCustomExceptionHandler(
            IRootResolver rootResolver,
            IFileService fileService,
            IApplicationBuilder app,
            IExceptionHandlerPathFeature ex,
            HttpContext context)
        {
            /*
             * Figuring out sections of path of invocation,
             * removing last part which is the filename we're executing, in addition
             * to the virtual "magic" parts of the URL.
             */
            var sections = ex.Path.Split('/', StringSplitOptions.RemoveEmptyEntries);
            var folders = sections
                .Skip(1)
                .Take(sections.Length - 2);

            // Iterating upwards in hierarchy to see if we have a custom exception handler in folders upwards.
            while (true)
            {
                // Checking if we can find en "exceptions.hl" file in currently iterated folder.
                var filename = rootResolver.AbsolutePath(string.Join("/", folders).TrimEnd('/') + "/exceptions.hl");

                // Checking if file exists, and if so, passing on responsibility for handling exception to the file.
                if (await fileService.ExistsAsync(filename))
                    return await CustomHandler(
                        app,
                        ex,
                        context,
                        string.Join("/", folders) + "/exceptions.hl");

                // Checking if we have more folders to traverse upwards in hierarchy.
                if (!folders.Any())
                    return false; // No custom exception handler found.

                // Removing last folder and continuing iteration.
                folders = folders.Take(folders.Count() - 1);
            }
        }

        /*
         * Invoked when a custom exception handler Hyperlambda file is found.
         */
        static async Task<bool> CustomHandler(
            IApplicationBuilder app,
            IExceptionHandlerPathFeature ex,
            HttpContext context,
            string exceptionHandlerFile)
        {
            // Decorating invocation to exception handler.
            var lambda = GetArgumentsToCustomHandler(ex, exceptionHandlerFile);

            // Making sure default exception handler kicks in if exception handler file throws an exception.
            try
            {
                // Executing file passing in arguments created above.
                var signaler = app.ApplicationServices.GetService<ISignaler>();
                await signaler.SignalAsync("io.file.execute", lambda);

                // Rendering custom exception response.
                await RenderCustomExceptionResponse(context, signaler, lambda);

                // Returning true to inform caller we have handled the exception.
                return true;
            }
            catch (Exception error)
            {
                /*
                 * Oops, exception handler file threw an exception,
                 * hence returning false to caller, and logging the
                 * fact that we've got a bogus exception handler file.
                 */
                try
                {
                    var logger = app.ApplicationServices.GetService<ILogger>();
                    await logger.FatalAsync($"Bogus 'exceptions.hl' file named '{exceptionHandlerFile}', exception was '{error.Message}'");
                }
                catch
                {
                    // Oops, no logger in configured, implying we're pretty much screwed, but we'll try to recover anyways ...!! :S
                }
                return false;
            }
        }

        /*
         * Responsible for rendering custom exception handler's result to HTTP response,
         * and decorating HTTP response according to exception handler's return value(s).
         */
        static async Task RenderCustomExceptionResponse(
            HttpContext context,
            ISignaler signaler,
            Node nodeResult)
        {
            // Decorating status code for HTTP response and removing [status] from payload response.
            var status = nodeResult.Children.FirstOrDefault(x => x.Name == "status");
            context.Response.StatusCode = status?.Get<int>() ?? 500;
            status?.UnTie();

            /*
             * Returning response according to result of above invocation,
             * making sure we return default message if no message was returned from
             * Hyperlambda file.
             */
            signaler.Signal(".lambda2json-raw", nodeResult);
            var response = nodeResult.Get<JObject>();
            if (response["message"] == null)
                response["message"] = DEFAULT_ERROR_MESSAGE;

            /*
             * Notice, we have no way to determine the frontend used unless we find an explicit configuration part.
             * Hence, we've got no other options than to simply turn on everything if no frontends are declared
             * in configuration.
             */
            context.Response.Headers["Access-Control-Allow-Origin"] = "*"; //NOSONAR

            // Writing exception to response and returning success.
            await context.Response.WriteAsync(response.ToString(Newtonsoft.Json.Formatting.Indented));
        }

        /*
         * Responsible for decorating invocation to custom exception handler.
         */
        static Node GetArgumentsToCustomHandler(IExceptionHandlerPathFeature ex, string exceptionHandlerFile)
        {
            // Creating arguments to exception handler file.
            var args = new Node("", exceptionHandlerFile);
            args.Add(new Node("message", ex.Error.Message));
            args.Add(new Node("path", ex.Path));
            args.Add(new Node("stack", ex.Error.StackTrace));
            args.Add(new Node("source", ex.Error.Source));

            /*
             * Checking if this is a Hyperlambda exception, at which point we further
             * parametrise invocation to exception file invocation with properties
             * from Hyperlambda exception class.
             */
            if (ex.Error is HyperlambdaException hypEx)
            {
                if (!string.IsNullOrEmpty(hypEx.FieldName))
                    args.Add(new Node("field", hypEx.FieldName));
                args.Add(new Node("status", hypEx.Status));
                args.Add(new Node("public", hypEx.IsPublic));
            }
            return args;
        }

        /*
         * Default handler that will kick in if no "exception.hl" file is found.
         *
         * This one simply logs the exception as is, and returns the exception response accordingly.
         */
        static async Task DefaultHandler(
            IApplicationBuilder app,
            HttpContext context,
            IExceptionHandlerPathFeature ex)
        {
            var logger = app.ApplicationServices.GetService<ILogger>();
            try
            {
                await logger.ErrorAsync($"Unhandled exception occurred '{ex.Error.Message}' at '{ex.Path}'", ex.Error.StackTrace);
            }
            catch
            {
                // Silently catching to avoid new exception due to logger not being configured correctly ...
            }

            // Making sure we return exception according to specifications to caller as JSON of some sort.
            var response = GetDefaultExceptionResponse(ex, context, ex.Error.Message);

            /*
             * Notice, we have no way to determine the frontend used unless we find an explicit configuration part.
             * Hence, we've got no other options than to simply turn on everything if no frontends are declared
             * in configuration.
             */
            context.Response.Headers["Access-Control-Allow-Origin"] = "*"; //NOSONAR

            await context.Response.WriteAsync(response.ToString(Newtonsoft.Json.Formatting.Indented));
        }

        /*
         * Helper method to create a JSON result from an exception, and returning
         * the result to the caller.
         */
        static JObject GetDefaultExceptionResponse(
            IExceptionHandlerPathFeature ex,
            HttpContext context,
            string msg)
        {
            // Checking if exception is a HyperlambdaException, which is handled in a custom way.
            var hypEx = ex.Error as HyperlambdaException;
            if (hypEx != null)
            {
                /*
                 * Checking if caller wants to expose exception details to client,
                 * and retrieving status code, etc from exception details.
                 */
                context.Response.StatusCode = hypEx.Status;
                if (hypEx.IsPublic)
                {
                    // Exception details is supposed to be publicly visible.
                    var response = new JObject
                    {
                        ["message"] = msg,
                    };

                    /*
                     * Checking if we've got a field name of some sort, which allows client
                     * to semantically display errors related to validators, or fields of some sort,
                     * creating more detailed feedback to the user.
                     */
                    if (!string.IsNullOrEmpty(hypEx.FieldName))
                        response["field"] = hypEx.FieldName;
                    return response;
                }
                else
                {
                    // Exception details is not supposed to be publicly visible.
                    return new JObject
                    {
                        ["message"] = DEFAULT_ERROR_MESSAGE
                    };
                }
            }
            else
            {
                // Default exception response, returned if exception is not Hyperlambda exception.
                return new JObject
                {
                    ["message"] = DEFAULT_ERROR_MESSAGE
                };
            }
        }

        #endregion
    }
}