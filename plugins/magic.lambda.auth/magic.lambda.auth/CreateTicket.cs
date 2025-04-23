/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.auth.helpers;
using magic.lambda.auth.contracts;

namespace magic.lambda.auth
{
    /// <summary>
    /// [auth.ticket.create] slot for creating a new JWT token.
    /// </summary>
    [Slot(Name = "auth.ticket.create")]
    public class CreateTicket : ISlot
    {
        readonly IAuthSettings _settings;

        /// <summary>
        /// Creates a new instance of the class.
        /// </summary>
        /// <param name="settings">Settings for auth.</param>
        public CreateTicket(IAuthSettings settings)
        {
            _settings = settings;
        }

        /// <summary>
        /// Implementation for the slots.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var username = input.Children.FirstOrDefault(x => x.Name == "username")?.GetEx<string>()
                ?? throw new HyperlambdaException("No [username] supplied to [auth.ticket.create]");
            var roles = input.Children
                .FirstOrDefault(x => x.Name == "roles")?
                .Children
                .Select(x => x.GetEx<string>())
                .ToArray();
            var claims = input.Children
                .FirstOrDefault(x => x.Name == "claims")?
                .Children
                .Select(x => (x.Name, x.GetEx<string>()))
                .ToArray();
            var expires = input.Children.FirstOrDefault(x => x.Name == "expires")?.GetEx<DateTime?>();
            if (!expires.HasValue)
            {
                var duration = input.Children.FirstOrDefault(x => x.Name == "duration")?.GetEx<long>();
                if (duration != null)
                    expires = DateTime.UtcNow.AddMinutes(duration.Value);
            }

            input.Clear();
            input.Value = TicketFactory.CreateTicket(
                _settings,
                new Ticket(username, roles, claims, expires));
        }
    }
}
