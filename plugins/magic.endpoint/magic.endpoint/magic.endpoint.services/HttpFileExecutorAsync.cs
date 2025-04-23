/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
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
    public class HttpFileExecutorAsync : IHttpExecutorAsync
    {
        readonly ISignaler _signaler;
        readonly IFileService _fileService;
        readonly IStreamService _streamService;
        readonly IRootResolver _rootResolver;
        readonly IHttpArgumentsHandler _argumentsHandler;

        /*
         * Registered Content-Type payload handlers, responsible for handling requests and parametrising invocation
         * according to Content-Type specified by caller.
         */
        static readonly Dictionary<string, string> _mimeTypes = new()
        {
            { "json", "application/json" },
            { "css", "text/css" },
            { "txt", "text/plain" },
            { "js", "application/javascript" },
            { "jpeg", "image/jpeg" },
            { "jpg", "image/jpeg" },
            { "webp", "image/webp" },
            { "png", "image/png" },
            { "gif", "image/gif" },
            { "svg", "image/svg+xml" },
            { "md", "text/markdown" },
            { "html", "text/html" },
        };

        /*
         * Associates a file extension with a MIME type.
         */
        internal static void AddMimeType(string extension, string mimeType)
        {
            lock (_mimeTypes)
            {
                _mimeTypes[extension] = mimeType;
            }
        }

        /*
         * Returns all file extensions to IME types associations in the system.
         */
        internal static IEnumerable<(string Ext, string Mime)> GetMimeTypes()
        {
            lock (_mimeTypes)
            {
                foreach (var idx in _mimeTypes)
                {
                    yield return (idx.Key, idx.Value);
                }
            }
        }

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="signaler">Signaler necessary to execute endpoint.</param>
        /// <param name="fileService">Needed to resolve endpoint files.</param>
        /// <param name="streamService">Needed to resolve endpoint files.</param>
        /// <param name="rootResolver">Needed to resolve root folder names.</param>
        /// <param name="argumentsHandler">Needed to attach arguments to endpoint invocation.</param>
        public HttpFileExecutorAsync(
            ISignaler signaler,
            IFileService fileService,
            IStreamService streamService,
            IRootResolver rootResolver,
            IHttpArgumentsHandler argumentsHandler)
        {
            _signaler = signaler;
            _fileService = fileService;
            _streamService = streamService;
            _rootResolver = rootResolver;
            _argumentsHandler = argumentsHandler;
        }

        /// <inheritdoc/>
        public async Task<MagicResponse> ExecuteAsync(MagicRequest request)
        {
            // Making sure request is legal.
            if (!Utilities.IsLegalFileRequest(request.URL))
                return new MagicResponse { Result = 404 };

            // Avoiding duplicated content.
            if (request.URL.EndsWith('/'))
            {
                var response = new MagicResponse { Result = 301 };
                response.Headers["Location"] = request.Scheme + "://" + request.Host + "/" + request.URL.TrimEnd('/');
                return response;
            }

            // Avoiding duplicated content.
            if (request.URL.EndsWith(".html"))
            {
                var response = new MagicResponse { Result = 301 };
                response.Headers["Location"] = request.Scheme + "://" + request.Host + "/" + request.URL.Substring(0, request.URL.Length - 5);
                return response;
            }

            // Avoiding duplicated content.
            if (request.URL == "index")
            {
                var response = new MagicResponse { Result = 301 };
                response.Headers["Location"] = request.Scheme + "://" + request.Host;
                return response;
            }

            // Checking if we've got a redirect for URL.
            var configFilename = _rootResolver.AbsolutePath("/etc/www/.config");
            if (await _fileService.ExistsAsync(configFilename))
            {
                var config = HyperlambdaParser.Parse(await _fileService.LoadAsync(configFilename));
                var redirectNode = config.Children.FirstOrDefault(x => x.Name == "redirect");
                if (redirectNode != null)
                {
                    foreach (var idxRedirect in redirectNode.Children)
                    {
                        if (idxRedirect.Children.Any(x => x.Name == "from" && x.Get<string>() == request.URL))
                        {
                            // Redirecting.
                            var response = new MagicResponse
                            {
                                Result = 301
                            };
                            response.Headers["Location"] = idxRedirect.Children.FirstOrDefault(x => x.Name == "to").Get<string>();
                            return response;
                        }
                    }
                }
            }

            // Checking if this is a mixin file.
            if (Utilities.IsHtmlFileRequest(request.URL))
                return await ServeHtmlFileAsync(request); // HTML file, might have Hyperlambda codebehind file.

            // Statically served file.
            return await ServeStaticFileAsync("/etc/www/" + request.URL);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Serves an HTML file that might have a Hyperlambda codebehind file associated with it.
         */
        async Task<MagicResponse> ServeHtmlFileAsync(MagicRequest request)
        {
            // Getting mixin file and sanity checking request.
            var file = await GetHtmlFilename(request.URL);
            if (file == null)
                return await Serve404Page(request);

            // Checking if Hyperlambda codebehind file exists.
            var codebehindFile = (file.Contains('.') ? file.Substring(0, file.LastIndexOf('.')) : file.Substring(0, file.Length - 5)) + ".hl";
            if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(codebehindFile)))
                return await ServeDynamicPage(request, file, codebehindFile); // Codebehind file exists.

             // No codebehind file, serving file as static content file.
            return await ServeStaticFileAsync(file);
        }

        /*
         * Serves 404 page if existing.
         */
        async Task<MagicResponse> Serve404Page(MagicRequest request)
        {
            // Checking if we've got a 404 file.
            var configFilename = _rootResolver.AbsolutePath("/etc/www/.config");
            if (await _fileService.ExistsAsync(configFilename))
            {
                var config = HyperlambdaParser.Parse(await _fileService.LoadAsync(configFilename));
                var not_found = config.Children.FirstOrDefault(x => x.Name == "not_found")?.Get<string>() ?? "/etc/www/.components/404.html";
                if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(not_found)))
                {
                    // Checking if Hyperlambda codebehind file exists.
                    var codebehindFile2 = not_found.Substring(0, not_found.Length - 5) + ".hl";
                    if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(codebehindFile2)))
                    {
                        var tmp = await ServeDynamicPage(request, not_found, codebehindFile2); // Codebehind file exists.
                        tmp.Result = 404;
                        return tmp;
                    }

                    // No codebehind file, serving file as static content file.
                    var tmp2 = await ServeStaticFileAsync(not_found);
                    tmp2.Result = 404;
                    return tmp2;
                }
                return new MagicResponse { Content = "Not found", Result = 404 };
            }
            return new MagicResponse { Content = "Not found", Result = 404 };
        }

        /*
         * Serves an HTML file that has an associated Hyperlambda codebehind file.
         */
        async Task<MagicResponse> ServeDynamicPage(MagicRequest request, string htmlFile, string codebehindFile)
        {
            try
            {
                // Creating our initial lambda object.
                var lambda = new Node("");
                lambda.Add(new Node("io.file.mixin", htmlFile));
                lambda.Add(new Node("return", new Expression("-")));

                // Applying interceptors.
                lambda = await Utilities.ApplyInterceptors(_rootResolver, _fileService, lambda, codebehindFile);

                // Attaching arguments.
                _argumentsHandler.Attach(lambda, request.Query, request.Payload);

                // Creating our result wrapper, wrapping whatever the endpoint wants to return to the client.
                var response = new MagicResponse();
                var result = new Node();
                response.Headers["Content-Type"] = "text/html";
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
                response.Content = result.Value;
                return response;
            }
            catch (HyperlambdaException err)
            {
                if (err.Status == 404)
                    return await Serve404Page(request);
                throw;
            }
        }

        /*
         * Returns the filename for the mixin file matching the specified URL, if any.
         */
        async Task<string> GetHtmlFilename(string url)
        {
            // Checking if this is a request for a folder, at which point we append "index.html" to it.
            if (url == "")
                url = "/index.html";
            else if (!url.Contains('.') && !url.EndsWith(".html"))
                url += ".html"; // Apppending ".html" to resolve correct document.
            if (url.StartsWith('/'))
                url = url.Substring(1);

            // Trying to resolve URL as a direct filename request.
            if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath("/etc/www/" + url)))
                return "/etc/www/" + url;

            /*
             * Traversing upwards in folder hierarchy and returning the
             * first "default.html" page we can find, if any.
             *
             * This allows you to have "wildcard resolvers" for entire folder hierarchies.
             */
            var splits = url.Split(['/'], StringSplitOptions.RemoveEmptyEntries);
            if (splits.Length > 0)
                splits = splits.Take(splits.Length - 1).ToArray();
            while (true)
            {
                var cur = string.Join("/", splits) + "/" + "default.html";
                if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath("/etc/www/" + cur)))
                    return "/etc/www/" + cur;
                if (splits.Length == 0)
                    break;
                splits = splits.Take(splits.Length - 1).ToArray();
            }

            // Checking if site has been configured to serve pages as SPA pages (frontend routing type of resolving).
            var configFilename = _rootResolver.AbsolutePath("/etc/www/.config");
            if (await _fileService.ExistsAsync(configFilename))
            {
                var config = HyperlambdaParser.Parse(await _fileService.LoadAsync(configFilename));

                // Checking if [spa-enabled] node exists, and has a value of boolean true.
                if (config.Children.FirstOrDefault(x => x.Name == "spa_enabled")?.GetEx<bool>() ?? false)
                {
                    if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath("/etc/www/index.html")))
                        return "/etc/www/index.html";
                }
            }

            // Nothing found that can resolve specified URL.
            return null;
        }

        /*
         * Serves a static file.
         */
        async Task<MagicResponse> ServeStaticFileAsync(string url)
        {
            // Transforming to absolute path and verifying file exists.
            var absPath = _rootResolver.AbsolutePath(url);
            if (!await _fileService.ExistsAsync(absPath))
                return new MagicResponse { Result = 404, Content = "Not found" };

            // Creating response to return to caller.
            var response = new MagicResponse();
            var ext = url.Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries).Last();
            if (_mimeTypes.TryGetValue(ext, out string value))
                response.Headers["Content-Type"] = value;
            else
                response.Headers["Content-Type"] = "application/octet-stream"; // Defaulting to binary content

            // Adding default headers from .config file.
            await AddDefaultStaticHttpHeaders(response, url);

            // Checking if Content-Type is application/json, at which point we load the file before returning it.
            if (response.Headers["Content-Type"].Contains("application/json"))
                response.Content = await _fileService.LoadAsync(_rootResolver.AbsolutePath(url));
            else
                response.Content = await _streamService.OpenFileAsync(_rootResolver.AbsolutePath(url));

            return response;
        }

        /*
         * Adds default HTTP headers according to config file to response.
         */
        async Task AddDefaultStaticHttpHeaders(MagicResponse response, string url)
        {
            var configFilename = _rootResolver.AbsolutePath("/etc/www/.config");
            if (await _fileService.ExistsAsync(configFilename))
            {
                var config = HyperlambdaParser.Parse(await _fileService.LoadAsync(configFilename));

                // Headers that applies for all files.
                foreach (var idx in new Expression("*/static_files/*/headers/*/\\*/*").Evaluate(config))
                {
                    response.Headers[idx.Name] = idx.GetEx<string>();
                }

                // Headers that applies for only files with specified extension.
                var extension = url.Substring(url.LastIndexOf('.') + 1);
                foreach (var idx in new Expression($"*/static_files/*/headers/*/{extension}/*").Evaluate(config))
                {
                    response.Headers[idx.Name] = idx.GetEx<string>();
                }
            }
        }

        #endregion
    }
}
