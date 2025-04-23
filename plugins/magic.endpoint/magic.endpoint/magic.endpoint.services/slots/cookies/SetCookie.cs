/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.endpoint.contracts.poco;

namespace magic.endpoint.services.slots.cookies
{
    /// <summary>
    /// [response.cookies.set] slot for creating and returning a cookie to the client.
    /// </summary>
    [Slot(Name = "response.cookies.set")]
    public class SetCookie : ISlot
    {
        /// <summary>
        /// Implementation of your slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise signal.</param>
        /// <param name="input">Arguments to your slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            signaler
                .Peek<MagicResponse>("http.response")
                .Cookies
                .Add(new MagicCookie
                {
                    Name = input.GetEx<string>(),
                    Value = input.Children.FirstOrDefault(x => x.Name == "value")?.GetEx<string>() ??
                        throw new HyperlambdaException("No [value] provided to [response.cookies.set]"),
                    Expires = input.Children.FirstOrDefault(x => x.Name == "expires")?.GetEx<DateTime>(),
                    HttpOnly = input.Children.FirstOrDefault(x => x.Name == "http-only")?.GetEx<bool>() ?? false,
                    Secure = input.Children.FirstOrDefault(x => x.Name == "secure")?.GetEx<bool>() ?? false,
                    Domain = input.Children.FirstOrDefault(x => x.Name == "domain")?.GetEx<string>(),
                    Path = input.Children.FirstOrDefault(x => x.Name == "path")?.GetEx<string>(),
                    SameSite = input.Children.FirstOrDefault(x => x.Name == "same-site")?.GetEx<string>(),
                });
        }
    }
}
