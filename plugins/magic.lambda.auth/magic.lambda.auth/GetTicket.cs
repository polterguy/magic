/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.signals.contracts;
using magic.lambda.auth.helpers;
using magic.lambda.auth.contracts;

namespace magic.lambda.auth
{
    /// <summary>
    /// [auth.ticket.get] slot for getting the username and roles claim(s) for currently logged in user.
    /// </summary>
    [Slot(Name = "auth.ticket.get")]
    public class GetTicket : ISlot
    {
        readonly ITicketProvider _ticketProvider;

        /// <summary>
        /// Creates a new instance of the class.
        /// </summary>
        /// <param name="ticketProvider">Your ticket provider.</param>
        public GetTicket(ITicketProvider ticketProvider)
        {
            _ticketProvider = ticketProvider;
        }

        /// <summary>
        /// Implementation for the slots.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var ticket = TicketFactory.GetTicket(_ticketProvider, signaler);
            if (ticket == null)
                return;
            input.Value = ticket.Username;
            if (ticket.Roles.Any())
                input.Add(new Node("roles", null, ticket.Roles.Select(x => new Node("", x))));
            if (ticket.Claims.Any())
                input.Add(new Node("claims", null, ticket.Claims.Select(x => new Node(x.Name, x.Value))));
            
        }
    }
}
