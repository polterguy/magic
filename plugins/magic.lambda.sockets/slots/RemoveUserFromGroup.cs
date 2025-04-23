/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.sockets.slots
{
    /// <summary>
    /// [sockets.user.remove-from-group] slot that allows you to explicitly remove a user from a group.
    /// </summary>
    [Slot(Name = "sockets.user.remove-from-group")]
    public class RemoveUserFromGroup : ISlotAsync
    {
        readonly IConfiguration _configuration;
        readonly IHubContext<MagicHub> _context;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="configuration">Needed to verify sockets are turned on in server.</param>
        /// <param name="context">Dependency injected SignalR HUB references.</param>
        public RemoveUserFromGroup(
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
            var args = AddUserToGroup.GetArgs(input, "sockets.user.remove-from-group");

            // Iterating through each existing connection for user, associating user with specified group.
            foreach (var idx in MagicHub.GetConnections(args.Username))
            {
                await _context.Groups.RemoveFromGroupAsync(idx, "group:" + args.Group);
            }
        }
    }
}
