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
    /// [sockets.connection.enter-group] slot that allows you to associate the current
    /// SignalR connectionId with a group.
    /// </summary>
    [Slot(Name = "sockets.connection.enter-group")]
    public class EnterGroup : ISlotAsync
    {
        readonly IConfiguration _configuration;
        readonly IHubContext<MagicHub> _context;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="configuration">Needed to verify sockets are turned on in server.</param>
        /// <param name="context">Dependency injected SignalR HUB references.</param>
        public EnterGroup(
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

            // Retrieving arguments.
            var args = GetArgs(signaler, input, "sockets.connection.enter-group");

            // Associating user with group.
            await _context.Groups.AddToGroupAsync(args.ConnectionId, "group:" + args.Group);
        }

        #region [ -- Private and internal helper methods -- ]

        /*
         * Helper method to retrieve arguments to invocation.
         */
        internal static (string Group, string ConnectionId) GetArgs(ISignaler signaler, Node input, string slot)
        {
            // Sanity checking that value of node is null, since we might want to reserve its value for future features.
            if (input.Value != null)
                throw new HyperlambdaException($"I don't know how to utilise a value of your [{slot}] invocation");

            // Retrieving arguments.
            var group = input.Children.FirstOrDefault(x => x.Name == "group")?.GetEx<string>() ??
                throw new HyperlambdaException($"No [group] supplied to [{slot}]");

            // Retrieving current connectionId
            var connectionId = signaler.Peek<string>("dynamic.sockets.connection") ??
                throw new HyperlambdaException($"You can only invoke [{slot}] from within a socket connection");

            // Returning arguments to caller.
            return (group, connectionId);
        }

        #endregion
    }
}
