/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.SignalR;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts;
using magic.lambda.logging.contracts;
using magic.node.extensions.hyperlambda;

namespace magic.lambda.sockets
{
    /// <summary>
    /// Socket hub allowing users to invoke SignalR methods over web socket connections, to
    /// signal subscribers of specific messages.
    /// </summary>
    public class MagicHub : Hub
    {
        readonly static Dictionary<string, List<string>> _userConnections = new Dictionary<string, List<string>>();
        readonly static object _locker = new object();
        readonly IHttpArgumentsHandler _argumentsHandler;
        readonly ISignaler _signaler;
        readonly ILogger _logger;
        readonly IFileService _fileService;
        readonly IRootResolver _rootResolver;

        /// <summary>
        /// Constructs an instance of your class.
        /// </summary>
        /// <param name="signaler">Needed to execute lambda objects.</param>
        /// <param name="argumentsHandler">Service responsible for attaching arguments to file executions.</param>
        /// <param name="logger">Logger to log to</param>
        /// <param name="fileService">Needed to resolve and load files.</param>
        /// <param name="rootResolver">Needed to resolve root folder in system.</param>
        public MagicHub(
                ISignaler signaler,
                IHttpArgumentsHandler argumentsHandler,
                ILogger logger,
                IFileService fileService,
                IRootResolver rootResolver)
        {
            _signaler = signaler;  
            _argumentsHandler = argumentsHandler;   
            _logger = logger;       
            _fileService = fileService;
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Executes the specified Hyperlambda file with the specified arguments.
        /// </summary>
        /// <param name="file">Hyperlambda file to execute</param>
        /// <param name="json">JSON arguments for invocation in string format</param>
        /// <returns>Awaitable task</returns>
        public async Task execute(string file, string json)
        {
            // Appending the correct file extension(s) to invocation.
            file = file.TrimStart('/');
            file += ".socket.hl";

            // Making sure we never resolve to anything outside of "/modules/" and "/system" folder.
            if (!file.StartsWith("modules/") && !file.StartsWith("system/"))
            {
                // Caller tried to resolve a file outside of '/system/' and '/modules/' folder. 
                await _logger.ErrorAsync($"Socket execute method tried to resolve an illegal file '{file}'");
                return;
            }

            // Making sure file exists.
            if (!await _fileService.ExistsAsync(_rootResolver.AbsolutePath(file)))
            {
                // Caller tried to resolve a non-existent file.
                await _logger.ErrorAsync($"Socket execute method tried to resolve a non-existent file '{file}'");
                return;
            }

            // Making sure we can log exceptions
            try
            {
                // Transforming from JSON to lambda node structure.
                var payload = new Node("", json);
                if (!string.IsNullOrEmpty(json))
                    _signaler.Signal("json2lambda", payload);

                // Loading file, and creating our lambda object and attaching arguments specified as query parameters, and/or payload.
                var lambda = HyperlambdaParser.Parse(await _fileService.LoadAsync(_rootResolver.AbsolutePath(file)));
                _argumentsHandler.Attach(lambda, null, payload);

                // Making sure we push the current connection information into our stack.
                await _signaler.ScopeAsync("dynamic.sockets.connection", Context.ConnectionId, async () =>
                {
                    // Executing file.
                    await _signaler.SignalAsync("eval", lambda);
                });
            }
            catch (Exception error)
            {
                await _logger.ErrorAsync($"Unhandled exception occurred during socket execute method '{file}'", error.StackTrace);
            }
        }

        #region [ -- Internal static helper methods -- ]

        /*
         * Returns currently active connections for specified user.
         */
        internal static string[] GetConnections(string username)
        {
            lock (_locker)
            {
                if (_userConnections.TryGetValue(username, out var result))
                    return result.ToArray();
                return Array.Empty<string>();
            }
        }

        /*
         * Returns currently connected users according to specified filtering condition.
         */
        internal static (string Username, string[] Connections)[] GetUsers(string? filter, int offset, int limit)
        {
            lock (_locker)
            {
                // Creating our enumerable and applying filtering accordingly.
                IEnumerable<string> enumerable = _userConnections.Keys;
                if (filter != null)
                    enumerable = enumerable.Where(x => x.StartsWith(filter));
                if (offset > 0)
                    enumerable = enumerable.Skip(offset);
                enumerable = enumerable.Take(10);

                // Returning results to caller.
                return enumerable.Select(x => (x, _userConnections[x].ToArray())).ToArray();
            }
        }

        /*
         * Returns count of currently connected users according to specified filtering condition.
         */
        internal static int GetUserCount(string? filter)
        {
            lock (_locker)
            {
                // Creating our enumerable and applying filtering accordingly.
                IEnumerable<string> enumerable = _userConnections.Keys;
                if (filter != null)
                    enumerable = enumerable.Where(x => x.StartsWith(filter));

                // Returning results to caller.
                return enumerable.Count();
            }
        }

        #endregion

        #region [ -- Overridden base class methods -- ]

        /// <inheritdoc />
        public override async Task OnConnectedAsync()
        {
            /*
             * Retrieving roles user belongs to and associating
             * user with groups resembling role names, allowing us to only signal users
             * belonging to some specific role(s) later.
             */
            var userNode = new Node();
            await _signaler.SignalAsync("auth.ticket.get", userNode);
            var inRoles = userNode.Children.FirstOrDefault(x => x.Name == "roles");
            if (inRoles != null)
            {
                foreach (var idx in inRoles.Children.Select(x => x.Get<string>()))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "role:" + idx);
                }
            }

            /*
             * Creating an association between a user and all connections in our shared static
             * dictionary.
             *
             * Notice, is user is not authenticated the default SignalR user ID will be used to
             * reference the user in the dictionary.
             */
            var username = userNode.Get<string>() ?? Context.ConnectionId;
            lock (_locker)
            {
                if (!_userConnections.TryGetValue(username, out var connections))
                    _userConnections[username] = new List<string>(new string[] { Context.ConnectionId });
                else
                    connections.Add(Context.ConnectionId);
            }
            await base.OnConnectedAsync();
        }

        /// <inheritdoc />
        public override Task OnDisconnectedAsync(Exception? exception)
        {
            var username = Context.User?.Identity?.Name ?? Context.ConnectionId;
            lock (_locker)
            {
                if (_userConnections.TryGetValue(username, out var connections) &&
                    connections.Remove(Context.ConnectionId) &&
                    connections.Count == 0)
                    _userConnections.Remove(username);
            }
            return base.OnDisconnectedAsync(exception);
        }

        #endregion
    }
}
