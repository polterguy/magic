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
    /// [sockets.connection.leave-group] slot that allows you to de-associate the current
    /// SignalR connectionId with a group.
    /// </summary>
    [Slot(Name = "sockets.connection.leave-group")]
    public class LeaveGroup : ISlotAsync
    {
        readonly IConfiguration _configuration;
        readonly IHubContext<MagicHub> _context;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="configuration">Needed to verify sockets are turned on in server.</param>
        /// <param name="context">Dependency injected SignalR HUB references.</param>
        public LeaveGroup(
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
            var args = EnterGroup.GetArgs(signaler, input, "sockets.connection.leave-group");

            // Associating user with group.
            await _context.Groups.RemoveFromGroupAsync(args.ConnectionId, "group:" + args.Group);
        }
    }
}
