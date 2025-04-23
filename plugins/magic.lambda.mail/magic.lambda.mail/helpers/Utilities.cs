/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.lambda.mail.contracts;
using magic.lambda.mail.contracts.settings;

namespace magic.lambda.mail.helpers
{
    /*
     * Utility class containing helpers methods.
     */
    internal static class Utilities
    {
        /*
         * Connects to server somehow, prioritising connection settings from input, defaulting
         * to configuration settings if no connection settings are specified by caller.
         */
        public static async Task Connect(Node input, IMailClient client, ConnectionSettings server)
        {
            // Connecting and to server.
            await client.ConnectAsync(
                input.Children
                    .FirstOrDefault(x => x.Name == "server")?
                    .Children
                    .FirstOrDefault(x => x.Name == "host")?
                    .GetEx<string>() ?? server.Host,
                input.Children
                    .FirstOrDefault(x => x.Name == "server")?
                    .Children.FirstOrDefault(x => x.Name == "port")?
                    .GetEx<int>() ?? server.Port,
                input.Children
                    .FirstOrDefault(x => x.Name == "server")?
                    .Children.FirstOrDefault(x => x.Name == "secure")?
                    .GetEx<bool>() ?? server.Secure);
        }

        /*
         * Authenticates the client, if we're supposed to authenticate.
         */
        public static async Task Authenticate(Node input, IMailClient client, ConnectionSettings server)
        {
                var username = input.Children
                    .FirstOrDefault(x => x.Name == "server")?
                    .Children.FirstOrDefault(x =>x.Name == "username")?
                    .GetEx<string>() ?? server.Username;
                var password = input.Children
                    .FirstOrDefault(x => x.Name == "server")?
                    .Children.FirstOrDefault(x =>x.Name == "password")?
                    .GetEx<string>() ?? server.Password;
                if (username != null || password != null)
                    await client.AuthenticateAsync(username, password);
        }
    }
}
