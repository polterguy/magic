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
    /// [sockets.user.add-to-group] slot that allows you to explicitly add a user to a group.
    /// </summary>
    [Slot(Name = "sockets.user.add-to-group")]
    public class AddUserToGroup : ISlotAsync
    {
        readonly IConfiguration _configuration;
        readonly IHubContext<MagicHub> _context;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="configuration">Needed to veridy sockets are turned on.</param>
        /// <param name="context">Dependency injected SignalR HUB references.</param>
        public AddUserToGroup(
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
            var args = GetArgs(input, "sockets.user.add-to-group");

            // Iterating through each existing connection for user, associating user with specified group.
            foreach (var idx in MagicHub.GetConnections(args.Username))
            {
                await _context.Groups.AddToGroupAsync(idx, "group:" + args.Group);
            }
        }

        #region [ -- Private and internal helper methods -- ]

        /*
         * Helper method to retrieve arguments to invocation.
         */
        internal static (string Username, string Group) GetArgs(Node input, string slot)
        {
            // Retrieving arguments.
            var username = input.GetEx<string>();
            var group = input.Children.FirstOrDefault(x => x.Name == "group")?.GetEx<string>() ??
                throw new HyperlambdaException($"No [group] supplied to [{slot}]");

            // Returning arguments to caller.
            return (username, group);
        }

        #endregion
    }
}
