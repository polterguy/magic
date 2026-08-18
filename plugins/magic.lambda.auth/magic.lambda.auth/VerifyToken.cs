/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [auth.token.verify] slot validating an external JWT token.
    /// </summary>
    [Slot(
        Name = "auth.token.verify",
        Description = "Verifies an externally created JWT token from the required [token] child node, against one or more trusted [issuer]/[issuers] supplied by the caller",
        ReturnsMode = SlotReturnsMode.Lambda,
        ReturnsKind = "jwt-claims,text,lambda-tree",
        ReturnsDescription = "Returns token claims as child nodes such as [issuer], [email], and optional [name] and [nonce]",
        SignatureType = typeof(global::magic.lambda.auth.signatures.VerifyTokenSignature))]
    public class VerifyToken : ISlotAsync
    {
        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Retrieving our token.
            var token = input.Children.FirstOrDefault(x => x.Name == "token")?.GetEx<string>() ??
                throw new HyperlambdaException("No [token] provided to [auth.token.verify]");

            /*
             * Retrieving the issuers our caller trusts. Notice, we never fetch OpenID meta data
             * from the token's own issuer before it has been matched against this list, since
             * the issuer of an unverified token is by definition attacker controlled.
             */
            var trustedIssuers = input.Children
                .Where(x => x.Name == "issuer" || x.Name == "issuers")
                .SelectMany(x => GetIssuers(x))
                .Where(x => !string.IsNullOrEmpty(x))
                .ToList();
            if (!trustedIssuers.Any())
                throw new HyperlambdaException("[auth.token.verify] must be given one or more trusted [issuer] or [issuers] to verify the token against", true, 500);

            // Reading issuer from token, without trusting it.
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadToken(token);
            var secToken = jsonToken as JwtSecurityToken;
            var issuer = secToken.Issuer;

            // Refusing to proceed unless the token's issuer is explicitly trusted by our caller.
            if (!trustedIssuers.Contains(issuer))
                throw new HyperlambdaException($"Token issuer of '{issuer}' is not among the trusted issuers supplied to [auth.token.verify]", true, 401);

            // Creating our configuration.
            var configurationManager = new ConfigurationManager<OpenIdConnectConfiguration>(
                $"{issuer}/.well-known/openid-configuration",
                new OpenIdConnectConfigurationRetriever(),
                new HttpDocumentRetriever());

            // Retrieving configuration.
            var discoveryDocument = await configurationManager.GetConfigurationAsync();

            // Retrieving signing keys.
            var signingKeys = discoveryDocument.SigningKeys;

            // This will throw an exceptionj if token is not valid.
            var result = Validate(token, issuer, signingKeys);

            // House cleaning.
            input.Value = null;
            input.Clear();

            // Returning email, issuer and name to caller.
            input.Add(new Node("issuer", issuer));
            input.Add(new Node("email", result.Claims.FirstOrDefault(x => x.Type == "email")?.Value ?? throw new HyperlambdaException("No email found in token, we need at the very minimum an email address to bridge from OpenID Connect to Magic auth.")));
            var name = result.Claims.FirstOrDefault(x => x.Type == "name");
            if (name != null)
                input.Add(new Node("name", name.Value));
            var nonce = result.Claims.FirstOrDefault(x => x.Type == "nonce");
            if (nonce != null)
                input.Add(new Node("nonce", nonce.Value));
        }

        /*
         * Private helper methods.
         */

        /*
         * Returns all issuers carried by the given [issuer]/[issuers] node, supporting
         * single values, child node lists, and expressions resolving to multiple nodes.
         */
        private static IEnumerable<string> GetIssuers(Node node)
        {
            // Expressions are evaluated allowing multiple results, e.g. [issuers:x:@.providers/*/issuer].
            if (node.Value is Expression expression)
                return expression.Evaluate(node).Select(x => x.GetEx<string>());

            // Lists of issuers given as child nodes.
            if (node.Children.Any())
                return node.Children.Select(x => x.GetEx<string>());

            // Single value.
            return new[] { node.GetEx<string>() };
        }

        private static JwtSecurityToken Validate(
            string token, 
            string issuer, 
            ICollection<SecurityKey> signingKeys)
        {
            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = signingKeys,
                ValidateLifetime = true
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);
            return (JwtSecurityToken)validatedToken;
        }
    }
}
