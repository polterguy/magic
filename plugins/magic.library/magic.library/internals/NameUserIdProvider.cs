/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Microsoft.AspNetCore.SignalR;

namespace magic.library.internals
{
    /*
     * Internal class to ensure we're getting sane user IDs in SignalR hub.
     */
    internal class NameUserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            /*
             * By default, SignalR will use some random gibberish user ID to identify users.
             *
             * This part overrides that logic, making sure internally within SignalR, the SignalR
             * UserId becomes the name from the JWT token and .Net Identity parts.
             *
             * This allows us to publish messages to individual users based upon their usernames,
             * instead of having to keep track of some unique and randomly create gibberish and
             * associate it with the user internally.
             */
            return connection.User?.Identity?.Name;
        }
    }
}