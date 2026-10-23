/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Threading;
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
        readonly IExecutionRegistry _executionRegistry;

        /*
         * Parsed endpoints, with their interceptors applied but without any arguments, by the full path of the file.
         *
         * Static since this class is transient, and the cache must outlive every request.
         */
        static readonly ConcurrentDictionary<string, CachedEndpoint> _cache = new();

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
            IHttpArgumentsHandler argumentsHandler,
            IExecutionRegistry executionRegistry)
        {
            _signaler = signaler;
            _fileService = fileService;
            _rootResolver = rootResolver;
            _argumentsHandler = argumentsHandler;
            _executionRegistry = executionRegistry;
        }

        /// <inheritdoc/>
        public async Task<MagicResponse> ExecuteAsync(MagicRequest request)
        {
            // Normalising URL according to expectations. (removing "magic/" parts)
            var url = request.URL.Substring(6);

            // Making sure we never resolve to anything outside of "modules/" and "system/" folder.
            if (!url.StartsWith("modules/", StringComparison.Ordinal) && !url.StartsWith("system/", StringComparison.Ordinal))
                return new MagicResponse { Result = 401 };

            // Figuring out file to execute, and doing some basic sanity checking.
            var path = Utilities.GetEndpointFilePath(_rootResolver, url, request.Verb);
            /*
             * Creating our lambda object by loading Hyperlambda file and applying interceptors, unless
             * none of the files it was created from have changed since the last request, at which point
             * we simply clone what we created back then.
             */
            var lambda = await GetLambdaAsync(url, path);
            if (lambda == null)
                return new MagicResponse { Result = 404 };

            // Attaching arguments, which is the only part that differs between requests to the same endpoint.
            _argumentsHandler.Attach(lambda, request.Query, request.Payload);

            // Invoking method responsible for actually executing lambda object.
            return await ExecuteAsync(lambda, request);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns a lambda object for the specified endpoint file, with interceptors applied and without arguments,
         * or null if the file does not exist. The caller owns the returned lambda, and is free to change it.
         */
        async Task<Node> GetLambdaAsync(string url, string path)
        {
            // Caching requires a file service that can tell whether a file has changed without reading it.
            if (_fileService is not IFileStamps stamps)
                return await CreateLambdaAsync(url, path);

            /*
             * An entry is only created for a file that exists, since the URL is chosen by the client, and an entry for every
             * URL anybody ever requested would let anyone grow the cache for as long as they like.
             *
             * Notice, GetOrAdd always hands every caller the same instance, so there is only one gate for each endpoint.
             */
            if (!_cache.TryGetValue(path, out var entry))
            {
                if (!await _fileService.ExistsAsync(path))
                    return null;
                entry = _cache.GetOrAdd(path, _ => new CachedEndpoint());
            }

            // Common case, nothing has changed, and nobody has to wait for anybody.
            var snapshot = entry.Snapshot;
            if (snapshot != null && snapshot.IsCurrent(stamps))
                return snapshot.Template.Clone();

            /*
             * Only one thread at a time creates the lambda of an endpoint, and any other thread that needs the same
             * endpoint waits here, and then uses what the first thread created. Different endpoints don't wait for each other.
             */
            await entry.Gate.WaitAsync();
            try
            {
                // Somebody else might have created it while we were waiting for our turn.
                snapshot = entry.Snapshot;
                if (snapshot != null && snapshot.IsCurrent(stamps))
                    return snapshot.Template.Clone();

                /*
                 * Taking the stamps before reading any file. If a file changes after this, the stamp we store is older than the
                 * file, and the next request simply creates the lambda again, whereas the opposite order could serve stale content.
                 */
                var paths = new List<string> { path };
                paths.AddRange(Utilities.GetInterceptorFilePaths(_rootResolver, url));
                var observed = paths.Select(x => stamps.GetStamp(x)).ToArray();

                var lambda = await CreateLambdaAsync(url, path);
                if (lambda == null)
                {
                    // The file is gone, so neither the entry nor the lambda it holds is of any use.
                    entry.Snapshot = null;
                    _cache.TryRemove(new KeyValuePair<string, CachedEndpoint>(path, entry));
                    return null;
                }

                // Storing a copy, since the caller will change the lambda we return.
                entry.Snapshot = new Snapshot(paths.ToArray(), observed, lambda.Clone());
                return lambda;
            }
            finally
            {
                entry.Gate.Release();
            }
        }

        /*
         * Loads the endpoint file, parses it and applies interceptors, or returns null if the file does not exist.
         */
        async Task<Node> CreateLambdaAsync(string url, string path)
        {
            if (!await _fileService.ExistsAsync(path))
                return null;

            var lambda = HyperlambdaParser.Parse(await _fileService.LoadAsync(path));
            return await Utilities.ApplyInterceptors(_rootResolver, _fileService, lambda, url);
        }

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
            var execution = _executionRegistry.Create();
            response.Headers["X-Execution-Id"] = execution.ExecutionId;

            /*
             * Cancelling the execution if the client disconnects before we're done, rather than
             * finishing work nobody is waiting for.
             *
             * Notice, deliberately a registration we dispose below, and NOT a linked token source.
             * The context outlives this method whenever a [fork] still holds a reference to it, and
             * a fire and forget thread must survive its endpoint returning - so the link is severed
             * the moment we're done here, before we release our own reference.
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
            finally
            {
                aborted.Dispose();
                _executionRegistry.Complete(execution.ExecutionId);
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
                _signaler.Signal(".lambda2json-raw", convert, skipWhitelist: true);
                return convert.Value;
            }
            return null; // No content
        }

        /*
         * Everything we know about one endpoint. Only [Snapshot] is ever replaced, and only by the thread holding [Gate].
         */
        sealed class CachedEndpoint
        {
            public readonly SemaphoreSlim Gate = new(1, 1);

            volatile Snapshot _snapshot;

            public Snapshot Snapshot
            {
                get => _snapshot;
                set => _snapshot = value;
            }
        }

        /*
         * An immutable copy of a lambda, and the stamps of the files it was created from.
         */
        sealed class Snapshot
        {
            readonly string[] _paths;
            readonly FileStamp?[] _stamps;

            public Snapshot(string[] paths, FileStamp?[] stamps, Node template)
            {
                _paths = paths;
                _stamps = stamps;
                Template = template;
            }

            public Node Template { get; }

            /*
             * True if none of the files have changed, been created or been deleted since the lambda was created.
             * Includes every interceptor file that could apply, whether it existed or not.
             */
            public bool IsCurrent(IFileStamps stamps)
            {
                for (var idx = 0; idx < _paths.Length; idx++)
                {
                    if (stamps.GetStamp(_paths[idx]) != _stamps[idx])
                        return false;
                }
                return true;
            }
        }

        #endregion
    }
}
