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
using Newtonsoft.Json.Linq;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.backend.slots
{
    /// <summary>
    /// [auth.token.verify] slot validating an external JWT token.
    /// </summary>
    [Slot(Name = "auth.token.verify")]
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
                throw new HyperlambdaException("No [token] provided to [auth.external-token.validate]");

            // Finding issuer.
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadToken(token);
            var secToken = jsonToken as JwtSecurityToken;
            var issuer = secToken.Issuer;

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
