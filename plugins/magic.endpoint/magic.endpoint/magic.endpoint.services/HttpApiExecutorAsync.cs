/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts;
using magic.endpoint.contracts.poco;
using magic.endpoint.services.utilities;
using magic.node.extensions.hyperlambda;

namespace magic.endpoint.services
{
    /// <summary>
    /// Implementation of IExecutor service contract, allowing you to
    /// execute a dynamically created Hyperlambda endpoint.
    /// </summary>
    public class HttpApiExecutorAsync : IHttpExecutorAsync
    {
        readonly ISignaler _signaler;
        readonly IFileService _fileService;
        readonly IRootResolver _rootResolver;
        readonly IHttpArgumentsHandler _argumentsHandler;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="signaler">Signaler necessary to execute endpoint.</param>
        /// <param name="fileService">Needed to resolve endpoint files.</param>
        /// <param name="rootResolver">Needed to resolve root folder names.</param>
        /// <param name="argumentsHandler">Needed to attach arguments to endpoint invocation.</param>
        public HttpApiExecutorAsync(
            ISignaler signaler,
            IFileService fileService,
            IRootResolver rootResolver,
            IHttpArgumentsHandler argumentsHandler)
        {
            _signaler = signaler;
            _fileService = fileService;
            _rootResolver = rootResolver;
            _argumentsHandler = argumentsHandler;
        }

        /// <inheritdoc/>
        public async Task<MagicResponse> ExecuteAsync(MagicRequest request)
        {
            // Normalising URL according to expectations. (removing "magic/" parts)
            var url = request.URL.Substring(6);

            // Making sure we never resolve to anything outside of "modules/" and "system/" folder.
            if (!url.StartsWith("modules/") && !url.StartsWith("system/"))
                return new MagicResponse { Result = 401 };

            // Figuring out file to execute, and doing some basic sanity checking.
            var path = Utilities.GetEndpointFilePath(_rootResolver, url, request.Verb);
            if (!await _fileService.ExistsAsync(path))
                return new MagicResponse { Result = 404 };

            // Creating our lambda object by loading Hyperlambda file.
            var lambda = HyperlambdaParser.Parse(await _fileService.LoadAsync(path));

            // Applying interceptors.
            lambda = await Utilities.ApplyInterceptors(_rootResolver, _fileService, lambda, url);

            // Attaching arguments.
            _argumentsHandler.Attach(lambda, request.Query, request.Payload);

            // Invoking method responsible for actually executing lambda object.
            return await ExecuteAsync(lambda, request);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Method responsible for actually executing lambda object after file has been loaded,
         * interceptors and arguments have been applied, and transforming result of invocation
         * to a MagicResponse.
         */
        async Task<MagicResponse> ExecuteAsync(Node lambda, MagicRequest request)
        {
            // Creating our result wrapper, wrapping whatever the endpoint wants to return to the client.
            var result = new Node();
            var response = new MagicResponse();
            try
            {
                await _signaler.ScopeAsync("http.request", request, async () =>
                {
                    await _signaler.ScopeAsync("http.response", response, async () =>
                    {
                        await _signaler.ScopeAsync("slots.result", result, async () =>
                        {
                            await _signaler.SignalAsync("eval", lambda);
                        });
                    });
                });
                response.Content = GetReturnValue(response, result);
                return response;
            }
            catch
            {
                if (result.Value is IDisposable disposable)
                    disposable.Dispose();
                if (response.Content is IDisposable disposable2 && !ReferenceEquals(response.Content, result.Value))
                    disposable2.Dispose();
                throw;
            }
        }

        /*
         * Creates a returned payload of some sort and returning to caller.
         */
        object GetReturnValue(MagicResponse httpResponse, Node lambda)
        {
            /*
             * An endpoint can return either a Node/Lambda hierarchy or a simple value.
             * First we check if endpoint returned a simple value, at which point we convert it to
             * a string. Notice, we're prioritising simple values, implying if return node has a
             * simple value, none of its children nodes will be returned.
             */
            if (lambda.Value != null)
            {
                // IDisposables (Streams e.g.) are automatically disposed by ASP.NET Core.
                if (lambda.Value is IDisposable || lambda.Value is byte[])
                    return lambda.Value;

                return lambda.Get<string>();
            }
            else if (lambda.Children.Any())
            {
                // Checking if we should return content as Hyperlambda.
                if (httpResponse.Headers.TryGetValue("Content-Type", out var val) && val == "application/x-hyperlambda")
                    return HyperlambdaGenerator.GetHyperlambda(lambda.Children);

                // Defaulting to returning content as JSON by converting from Lambda to JSON.
                var convert = new Node();
                convert.AddRange(lambda.Children.ToList());
                _signaler.Signal(".lambda2json-raw", convert);
                return convert.Value;
            }
            return null; // No content
        }

        #endregion
    }
}
