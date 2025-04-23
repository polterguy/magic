/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.auth.helpers;
using magic.lambda.auth.contracts;

namespace magic.lambda.auth
{
    /// <summary>
    /// [auth.ticket.in-role] slot returning true if user belongs to any of the roles supplied
    /// as a comma separated list of string values.
    /// </summary>
    [Slot(Name = "auth.ticket.in-role")]
    public class InRole : ISlot
    {
        readonly ITicketProvider _ticketProvider;

        /// <summary>
        /// Creates a new instance of class.
        /// </summary>
        /// <param name="ticketProvider">Ticket provider, necessary to retrieve the authenticated user.</param>
        public InRole(ITicketProvider ticketProvider)
        {
            _ticketProvider = ticketProvider;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = TicketFactory.InRole(_ticketProvider, input.GetEx<string>(), signaler);
        }
    }
}
