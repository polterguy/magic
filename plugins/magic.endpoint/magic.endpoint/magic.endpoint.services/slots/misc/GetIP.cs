/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.misc
{
    /// <summary>
    /// [request.ip] slot for returning the IP address the request originated from.
    /// </summary>
    [Slot(Name = "request.ip")]
    public class GetIP : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var request = signaler.Peek<MagicRequest>("http.request");
            var version = input.Children.FirstOrDefault(x => x.Name == "version")?.GetEx<string>() ??  "ipv4";
            switch (version)
            {
                case "ipv4":
                    input.Value = request.Ip.MapToIPv4().ToString();
                    break;

                case "ipv6":
                    input.Value = request.Ip.MapToIPv6().ToString();
                    break;

                default:
                    throw new HyperlambdaException($"[request.ip] cannot handle [version] values of '{version}'");
            }
        }
    }
}
