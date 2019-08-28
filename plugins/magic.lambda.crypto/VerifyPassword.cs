/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using bc = BCrypt.Net;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.crypto
{
    [Slot(Name = "crypto.password.verify")]
    public class VerifyPassword : ISlot, IMeta
    {
        readonly ISignaler _signaler;

        public VerifyPassword(ISignaler signaler)
        {
            _signaler = signaler ?? throw new ArgumentNullException(nameof(signaler));
        }

        public void Signal(Node input)
        {
            var hash = input.Children.FirstOrDefault((x) => x.Name == "hash")?.GetEx<string>(_signaler);
            if (hash == null)
                throw new ApplicationException($"No [hash] value provided to [crypto.password.verify]");

            var value = input.GetEx<string>(_signaler);

            input.Value = bc.BCrypt.Verify(value, hash);
        }

        public IEnumerable<Node> GetArguments()
        {
            yield return new Node(":", "*");
            yield return new Node("hash", 1);
        }
    }
}
