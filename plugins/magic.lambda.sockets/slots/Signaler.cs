/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.sockets.slots
{
    /// <summary>
    /// [sockets.signal] slot that allows you to publish a message to subscribers
    /// having subscribed to the specified message over a (web) socket connection.
    /// </summary>
    [Slot(Name = "sockets.signal")]
    public class Signaler : ISlotAsync
    {
        readonly IConfiguration _configuration;
        readonly IHubContext<MagicHub> _context;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="configuration">Needed to verify sockets are turned on in server.</param>
        /// <param name="context">Dependency injected SignalR HUB references.</param>
        public Signaler(
            IConfiguration configuration,
            IHubContext<MagicHub> context)
        {
            _configuration = configuration;
            _context = context;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        /// <returns>Awaitable task</returns>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Ensuring sockets are turned on in server.
            Utilities.ThrowIfNotEnabled(_configuration);

            // Retrieving method name.
            var args = GetArguments(signaler, input);

            // Ignoring invocation if we've got a "null channel".
            if (args.Method != null)
            {
                // Invoking method according to arguments provided.
                if (args.Roles != null)
                    await _context
                        .Clients
                        .Groups(args.Roles.Select(x => "role:" + x).ToArray())
                        .SendAsync(args.Method, args.Json);
                else if (args.Users != null)
                    await _context
                        .Clients
                        .Users(args.Users)
                        .SendAsync(args.Method, args.Json);
                else if (args.Groups != null)
                    await _context
                        .Clients
                        .Groups(args.Groups.Select(x => "group:" + x).ToArray())
                        .SendAsync(args.Method, args.Json);
                else if (args.Clients != null)
                    await _context
                        .Clients
                        .Clients(args.Clients)
                        .SendAsync(args.Method, args.Json);
                else
                    await _context
                        .Clients
                        .All
                        .SendAsync(args.Method, args.Json);
            }

            // House cleaning.
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        /*
         * Helper method to retrieve arguments to invocation.
         */
        (string Method, string? Json, string[]? Roles, string[]? Users, string[]? Clients, string[]? Groups) GetArguments(ISignaler signaler, Node input)
        {
            // Retrieving method name.
            var method = input.GetEx<string>();

            // Retrieving arguments, if any.
            var args = input.Children.FirstOrDefault(x => x.Name == "args")?.Clone();
            string? json = null;
            if (args != null)
            {
                var jsonNode = new Node();
                jsonNode.AddRange(args.Children);
                signaler.Signal("lambda2json", jsonNode);
                json = jsonNode.Get<string>();
            }

            /*
             * Checking if caller wants to restrict message to only users belonging to a specific role,
             * or only a list of named users.
             */
            var roles = input
                .Children
                .FirstOrDefault(x => x.Name == "roles")?
                .GetEx<string>()?
                .Split(',')
                .Select(x => x.Trim())?
                .ToArray();
            var users = input
                .Children
                .FirstOrDefault(x => x.Name == "users")?
                .GetEx<string>()?
                .Split(',')
                .Select(x => x.Trim())?
                .ToArray();
            var clients = input
                .Children
                .FirstOrDefault(x => x.Name == "clients")?
                .GetEx<string>()?
                .Split(',')
                .Select(x => x.Trim())?
                .ToArray();
            var groups = input
                .Children
                .FirstOrDefault(x => x.Name == "groups")?
                .GetEx<string>()?
                .Split(',')
                .Select(x => x.Trim())?
                .ToArray();

            // Sanity checking invocation, ensuring only ONE filtering argument is specified.
            if (new string[]?[] { roles, users, clients, groups }.Count(x => x != null) > 1)
                throw new HyperlambdaException("[sockets.signal] cannot be given both a list of [roles], [users], [clients] or [groups], choose only one or none");

            // Returning results to caller.
            return (method, json, roles, users, clients, groups);
        }

        #endregion
    }
}
