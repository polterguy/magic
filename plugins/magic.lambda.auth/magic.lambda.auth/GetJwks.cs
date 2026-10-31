/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.auth.helpers;

namespace magic.lambda.auth
{
    /// <summary>
    /// [auth.jwks] slot returning a JSON Web Key Set for the RSA key(s) supplied by the caller.
    /// </summary>
    [Slot(
        Name = "auth.jwks",
        Description = "Returns a public JSON Web Key Set for the supplied [public-key] arguments, removing duplicates, allowing other systems to verify RS256 tokens created by [auth.ticket.create]",
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "jwks,lambda-tree",
        ReturnsDescription = "Returns a [keys] node with one child per supplied key, having [kty], [use], [alg], [kid], [n] and [e]",
        SignatureType = typeof(global::magic.lambda.auth.signatures.JwksSignature))]
    public class GetJwks : ISlot
    {
        /// <summary>
        /// Implementation for the slots.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to your signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            // Notice, a private key is accepted too, but only its public half is ever returned.
            var jwks = input.Children
                .Where(x => x.Name == "public-key")
                .Select(x => AuthSigningKeys.GetPublicJsonWebKey(AuthSigningKeys.GetKeyValue(x)))
                .GroupBy(x => x.Kid)
                .Select(x => x.First())
                .ToList();
            if (jwks.Count == 0)
                throw new HyperlambdaException("No [public-key] supplied to [auth.jwks]");

            input.Clear();
            input.Value = null;
            var keys = new Node("keys");
            input.Add(keys);

            foreach (var jwk in jwks)
            {
                keys.Add(new Node(".", null, new[]
                {
                    new Node("kty", jwk.Kty),
                    new Node("use", jwk.Use),
                    new Node("alg", jwk.Alg),
                    new Node("kid", jwk.Kid),
                    new Node("n", jwk.N),
                    new Node("e", jwk.E),
                }));
            }
        }
    }
}
