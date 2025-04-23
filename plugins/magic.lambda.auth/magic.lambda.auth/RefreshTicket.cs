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
    /// [auth.ticket.refresh] slot refreshing an existing ticket, resulting in a new ticket,
    /// with a postponed expiration time, to avoid having users having to login every time their
    /// token expires.
    /// </summary>
    [Slot(Name = "auth.ticket.refresh")]
    public class RefreshTicket : ISlot
    {
        readonly IAuthSettings _settings;
        readonly ITicketProvider _ticketProvider;

        /// <summary>
        /// Creates a new instance of the class.
        /// </summary>
        /// <param name="settings">Settings for auth.</param>
        /// <param name="ticketProvider">Ticket provider, necessary to retrieve the authenticated user.</param>
        public RefreshTicket(IAuthSettings settings, ITicketProvider ticketProvider)
        {
            _settings = settings;
            _ticketProvider = ticketProvider;
        }

        /// <summary>
        /// Implementation for your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // This will throw if ticket is expired, doesn't exist, etc.
            TicketFactory.VerifyTicket(_ticketProvider, null, signaler);

            // Checking if caller provided [expires] or [duration].
            var expires = input.Children.FirstOrDefault(x => x.Name == "expires")?.GetEx<DateTime?>();
            if (!expires.HasValue)
            {
                var duration = input.Children.FirstOrDefault(x => x.Name == "duration")?.GetEx<long>();
                if (duration != null)
                    expires = DateTime.UtcNow.AddMinutes(duration.Value);
            }

            // Retrieving old ticket and decorating according to arguments.
            var ticket = TicketFactory.GetTicket(_ticketProvider, signaler);
            ticket.Expires = expires;

            // Retrieving old ticket and using its data to create a new ticket.
            input.Value = TicketFactory.CreateTicket(_settings, ticket);
        }
    }
}
