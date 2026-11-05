/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Net;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.endpoint.services.slots.misc
{
    /// <summary>
    /// [server.ip] slot for returning the IP address of the server.
    /// </summary>
    [Slot(
        Name = "server.ip",
        Description = "Returns the server's local IP address (IPv4 by default); useful for logging or building absolute URLs",
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "ip-address,text",
        ReturnsDescription = "Resolves to the server IP address for the requested IP version",
        SignatureType = typeof(global::magic.endpoint.services.signatures.IpVersionSignature))]
    public class GetServerIP : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var host = Dns.GetHostEntry(Dns.GetHostName());
            var version = input.Children.FirstOrDefault(x => x.Name == "version")?.GetEx<string>() ??  "ipv4";
            switch (version)
            {
                case "ipv4":
                    input.Value = host.AddressList[0].MapToIPv4().ToString();
                    break;

                case "ipv6":
                    input.Value = host.AddressList[0].MapToIPv6().ToString();
                    break;

                default:
                    throw new HyperlambdaException($"[request.ip] cannot handle [version] values of '{version}'");
            }
        }
    }
}
