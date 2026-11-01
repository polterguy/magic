/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.sockets.slots
{
    /// <summary>
    /// [sockets.users.count] slot that returns the number of currently connected users.
    /// </summary>
    [Slot(
        Name = "sockets.users.count",
        Description = "Counts connected socket users, optionally filtered by username",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of connected socket users matching the optional filter",
        SignatureType = typeof(global::magic.lambda.sockets.signatures.SocketCountUsersSignature))]
    public class CountUsers : ISlot
    {
        readonly IConfiguration _configuration;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="configuration">Needed to verify sockets are turned on in server.</param>
        public CountUsers(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Ensuring sockets are turned on in server.
            Utilities.ThrowIfNotEnabled(_configuration);

            // Retrieving arguments.
            var filter = input.Children.FirstOrDefault(x => x.Name == "filter")?.GetEx<string>();

            // House cleaning.
            input.Clear();

            // Returning result to caller.
            input.Value = MagicHub.GetUserCount(filter);
        }
    }
}
