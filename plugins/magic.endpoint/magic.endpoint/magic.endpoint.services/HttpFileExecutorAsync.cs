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
        const string WwwFolder = "/etc/www/";
        const string ContentTypeHeader = "Content-Type";
        const string LocationHeader = "Location";
        const string TextHtml = "text/html";

        readonly ISignaler _signaler;
        readonly IFileService _fileService;
        readonly IStreamService _streamService;
        readonly IRootResolver _rootResolver;
        readonly IHttpArgumentsHandler _argumentsHandler;
        readonly IExecutionRegistry _executionRegistry;

        /*
         * The parsed "/etc/www/.config", shared by every request until the file changes, instead of being read and parsed
         * up to three times for each of them.
         *
         * Notice, shared between threads, which is only safe since nothing ever changes it. Whoever uses it must not either.
         */
        static volatile ConfigSnapshot _config;

        sealed record ConfigSnapshot(string Path, FileStamp Stamp, Node Config);

        static readonly Expression _headersForAllFiles = Expression.Create("*/static_files/*/headers/*/\\*/*");

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
            { "html", TextHtml },
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
            IHttpArgumentsHandler argumentsHandler,
            IExecutionRegistry executionRegistry)
        {
            _signaler = signaler;
            _fileService = fileService;
            _streamService = streamService;
            _rootResolver = rootResolver;
            _argumentsHandler = argumentsHandler;
            _executionRegistry = executionRegistry;
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
                response.Headers[LocationHeader] = request.Scheme + "://" + request.Host + "/" + request.URL.TrimEnd('/');
                return response;
            }

            // Avoiding duplicated content.
            if (request.URL.EndsWith(".html", StringComparison.Ordinal))
            {
                var response = new MagicResponse { Result = 301 };
                response.Headers[LocationHeader] = request.Scheme + "://" + request.Host + "/" + request.URL.Substring(0, request.URL.Length - 5);
                return response;
            }

            // Avoiding duplicated content.
            if (request.URL.EndsWith("index", StringComparison.Ordinal))
            {
                var response = new MagicResponse { Result = 301 };
                response.Headers[LocationHeader] = request.Scheme + "://" + request.Host + "/" + request.URL.Substring(0, request.URL.Length - 6);
                return response;
            }

            // Checking if we've got a redirect for URL.
            var config = await GetConfigAsync();
            if (config != null)
            {
                var redirectNode = config.Children.FirstOrDefault(x => x.Name == "redirect");
                if (redirectNode != null)
                {
                    foreach (var idxRedirect in redirectNode.Children.Where(
                        n => n.Children.Any(x => x.Name == "from" && x.Get<string>() == request.URL)))
                    {
                        // Redirecting.
                        var response = new MagicResponse
                        {
                            Result = 301
                        };
                        response.Headers[LocationHeader] = idxRedirect.Children.FirstOrDefault(x => x.Name == "to").Get<string>();
                        return response;
                    }
                }
            }

            // Checking if this is a mixin file.
            if (Utilities.IsHtmlFileRequest(request.URL))
                return await ServeHtmlFileAsync(request, config); // HTML file, might have Hyperlambda codebehind file.

            // Statically served file.
            return await ServeStaticFileAsync(WwwFolder + request.URL, config);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns the parsed "/etc/www/.config", or null if there is none. Parsed again only when the file has changed, and
         * only ever handed out for reading.
         */
        async Task<Node> GetConfigAsync()
        {
            var path = _rootResolver.AbsolutePath("/etc/www/.config");

            // A file service that cannot tell whether a file has changed without reading it gets no caching.
            if (_fileService is not IFileStamps stamps)
                return await _fileService.ExistsAsync(path) ? HyperlambdaParser.Parse(await _fileService.LoadAsync(path)) : null;

            var stamp = stamps.GetStamp(path);
            if (stamp == null)
                return null;

            var snapshot = _config;
            if (snapshot != null && snapshot.Path == path && snapshot.Stamp == stamp.Value)
                return snapshot.Config;

            // Notice, the stamp was taken before the file was read, so a file changing meanwhile is parsed again by the next request.
            var config = HyperlambdaParser.Parse(await _fileService.LoadAsync(path));
            _config = new ConfigSnapshot(path, stamp.Value, config);
            return config;
        }

        /*
         * Serves an HTML file that might have a Hyperlambda codebehind file associated with it.
         */
        async Task<MagicResponse> ServeHtmlFileAsync(MagicRequest request, Node config)
        {
            // Getting mixin file and sanity checking request.
            var file = await GetHtmlFilename(request.URL, config);
            if (file == null)
                return await Serve404Page(request, config);

            // Checking if Hyperlambda codebehind file exists.
            var codebehindFile = (file.Contains('.') ? file.Substring(0, file.LastIndexOf('.')) : file) + ".hl";
            if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(codebehindFile)))
                return await ServeDynamicPage(request, file, codebehindFile, config); // Codebehind file exists.

             // No codebehind file, serving file as static content file.
            return await ServeStaticFileAsync(file, config);
        }

        /*
         * Serves 404 page if existing.
         */
        async Task<MagicResponse> Serve404Page(MagicRequest request, Node config)
        {
            // Checking if we've got a 404 file.
            if (config != null)
            {
                var not_found = config.Children.FirstOrDefault(x => x.Name == "not_found")?.Get<string>() ?? "/etc/www/.components/404.html";
                if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(not_found)))
                {
                    // Checking if Hyperlambda codebehind file exists.
                    var codebehindFile2 = string.Concat(not_found.AsSpan(0, not_found.Length - 5), ".hl");
                    if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(codebehindFile2)))
                    {
                        var tmp = await ServeDynamicPage(request, not_found, codebehindFile2, config); // Codebehind file exists.
                        tmp.Headers[ContentTypeHeader] = TextHtml;
                        tmp.Result = 404;
                        return tmp;
                    }

                    // No codebehind file, serving file as static content file.
                    var tmp2 = await ServeStaticFileAsync(not_found, config);
                    tmp2.Headers[ContentTypeHeader] = TextHtml;
                    tmp2.Result = 404;
                    return tmp2;
                }
                return new MagicResponse
                {
                    Content = "Not found",
                    Result = 404,
                    Headers = new Dictionary<string, string>
                    {
                        { ContentTypeHeader, TextHtml }
                    }
                };
            }
            return new MagicResponse
            {
                Content = "Not found",
                Result = 404,
                Headers = new Dictionary<string, string>
                {
                    { ContentTypeHeader, TextHtml }
                }
            };
        }

        /*
         * Serves an HTML file that has an associated Hyperlambda codebehind file.
         */
        async Task<MagicResponse> ServeDynamicPage(MagicRequest request, string htmlFile, string codebehindFile, Node config)
        {
            try
            {
                // Creating our initial lambda object.
                var lambda = new Node("");
                lambda.Add(new Node("io.file.mixin", htmlFile));
                lambda.Add(new Node("return", Expression.Create("-")));

                // Applying interceptors.
                lambda = await Utilities.ApplyInterceptors(_rootResolver, _fileService, lambda, codebehindFile);

                // Attaching arguments.
                _argumentsHandler.Attach(lambda, request.Query, request.Payload);

                // Creating our result wrapper, wrapping whatever the endpoint wants to return to the client.
                var response = new MagicResponse();
                var result = new Node();
                var execution = _executionRegistry.Create(request.Aborted);
                response.Headers[ContentTypeHeader] = TextHtml;
                response.Headers["X-Execution-Id"] = execution.ExecutionId;

                /*
                 * Cancelling the execution if the client disconnects before we're done, rather than
                 * finishing work nobody is waiting for. See the note in HttpApiExecutorAsync for why
                 * this is a registration we dispose, and not a linked token source.
                 */
                var aborted = request.Aborted.Register(() => execution.Cancel());
                try
                {
                    await _signaler.ScopeAsync(
                        [
                            ("execution.context", execution),
                            ("dynamic.execution-id", execution.ExecutionId),
                            ("http.request", request),
                            ("http.response", response),
                            ("slots.result", result),
                        ],
                        () => _signaler.SignalAsync("eval", lambda, skipWhitelist: true));
                    response.Content = result.Value;
                    return response;
                }
                finally
                {
                    await aborted.DisposeAsync();
                    _executionRegistry.Complete(execution.ExecutionId);
                }
            }
            catch (HyperlambdaException err)
            {
                if (err.Status == 404)
                    return await Serve404Page(request, config);
                throw;
            }
        }

        /*
         * Returns the filename for the mixin file matching the specified URL, if any.
         */
        async Task<string> GetHtmlFilename(string url, Node config)
        {
            // Checking if this is a request for root folder, at which point we append "index.html" to it.
            if (url == "")
                url = "index";
            else if (url.StartsWith('/'))
                url = url.Substring(1);

            // Trying to resolve URL as a direct filename request.
            if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(WwwFolder + url)))
                return WwwFolder + url;

            // Trying to resolve URL as a direct filename request with HTML extension.
            if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(WwwFolder + url + ".html")))
                return WwwFolder + url + ".html";

            // File didn't exists, checking if /FOLDER/INDEX.HTML exists.
            if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(WwwFolder + url + "/index.html")))
                return WwwFolder + url + "/index.html";

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
                if (await _fileService.ExistsAsync(_rootResolver.AbsolutePath(WwwFolder + cur)))
                    return WwwFolder + cur;
                if (splits.Length == 0)
                    break;
                splits = splits.Take(splits.Length - 1).ToArray();
            }

            // Checking if site has been configured to serve pages as SPA pages (frontend routing type of resolving),
            // which it has if the [spa_enabled] node exists and has a value of boolean true.
            if (config != null &&
                (config.Children.FirstOrDefault(x => x.Name == "spa_enabled")?.GetEx<bool>() ?? false) &&
                await _fileService.ExistsAsync(_rootResolver.AbsolutePath("/etc/www/index.html")))
                return "/etc/www/index.html";

            // Nothing found that can resolve specified URL.
            return null;
        }

        /*
         * Serves a static file.
         */
        async Task<MagicResponse> ServeStaticFileAsync(string url, Node config)
        {
            // Transforming to absolute path and verifying file exists.
            var absPath = _rootResolver.AbsolutePath(url);
            if (!await _fileService.ExistsAsync(absPath))
                return new MagicResponse { Result = 404, Content = "Not found" };

            // Creating response to return to caller.
            var response = new MagicResponse();

            // Resolving the extension from the filename only, falling back to the full filename for extensionless
            // files (e.g. "/.well-known/oauth-authorization-server") so these stay mappable through ".config".
            var fileName = url.Substring(url.LastIndexOf('/') + 1);
            var ext = fileName.Contains('.') ? fileName.Substring(fileName.LastIndexOf('.') + 1) : fileName;
            if (_mimeTypes.TryGetValue(ext, out string value))
                response.Headers[ContentTypeHeader] = value;
            else
                response.Headers[ContentTypeHeader] = "application/octet-stream"; // Defaulting to binary content

            // Adding default headers from .config file.
            AddDefaultStaticHttpHeaders(response, ext, config);

            // Checking if Content-Type is application/json, at which point we load the file before returning it.
            if (response.Headers[ContentTypeHeader].Contains("application/json"))
                response.Content = await _fileService.LoadAsync(_rootResolver.AbsolutePath(url));
            else
                response.Content = await _streamService.OpenFileAsync(_rootResolver.AbsolutePath(url));

            return response;
        }

        /*
         * Adds default HTTP headers according to config file to response.
         */
        static void AddDefaultStaticHttpHeaders(MagicResponse response, string extension, Node config)
        {
            if (config != null)
            {
                // Headers that applies for all files.
                foreach (var idx in _headersForAllFiles.Evaluate(config))
                {
                    response.Headers[idx.Name] = idx.GetEx<string>();
                }

                // Headers that applies only for files with the specified extension (or filename, for extensionless files).
                foreach (var idx in Expression.CreateUncached($"*/static_files/*/headers/*/{extension}/*").Evaluate(config))
                {
                    response.Headers[idx.Name] = idx.GetEx<string>();
                }
            }
        }

        #endregion
    }
}
