/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using System.Collections.Concurrent;
using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.auth.helpers
{
    /// <summary>
    /// Helper class for RS256 signing and verification of JWT tokens, using RSA keys the caller
    /// passes in explicitly. Magic never reads these keys from configuration, the caller loads
    /// them using whatever logic it wants to, allowing for any number of keys per cloudlet.
    ///
    /// Keys can be PEM encoded, or DER encoded as raw bytes or base64, the latter being what
    /// [crypto.rsa.create-key] returns.
    ///
    /// Notice, if no key is given, the callers of this class fall back to HS256 using the auth
    /// secret, exactly as before.
    /// </summary>
    public static class AuthSigningKeys
    {
        // Notice, bounded, since keys are supplied by callers and could in theory be unique per invocation.
        const int MaxCachedKeys = 256;

        // Notice, keyed by the SHA256 of the key, such that the key itself is not kept as a dictionary key.
        static readonly ConcurrentDictionary<string, ParsedKey> _cache = new();

        /*
         * Immutable holder of one parsed PEM, where Private is null for a public key.
         */
        sealed class ParsedKey
        {
            public ParsedKey(RsaSecurityKey privateKey, RsaSecurityKey publicKey)
            {
                Private = privateKey;
                Public = publicKey;
            }

            public RsaSecurityKey Private { get; }
            public RsaSecurityKey Public { get; }
        }

        /// <summary>
        /// Returns the key supplied as the specified argument, or null if the argument does not exist.
        ///
        /// Notice, if the argument exists but has no value we throw, instead of silently falling
        /// back to HS256, since a key that failed to load must never turn into the auth secret.
        /// </summary>
        /// <param name="input">Arguments to the slot.</param>
        /// <param name="name">Name of the argument, e.g. 'private-key'.</param>
        /// <returns>The key as a string or byte[], or null if no such argument was given.</returns>
        public static object GetKeyArgument(Node input, string name)
        {
            var node = input.Children.FirstOrDefault(x => x.Name == name);
            return node == null ? null : GetKeyValue(node);
        }

        /// <summary>
        /// Returns the key supplied as the value of the specified argument node, throwing if it has no value.
        /// </summary>
        /// <param name="argument">Argument node, e.g. [public-key], possibly having an expression as its value.</param>
        /// <returns>The key as a string or byte[].</returns>
        public static object GetKeyValue(Node argument)
        {
            var value = argument.GetEx<object>();
            if (value == null || (value is string str && string.IsNullOrWhiteSpace(str)) || (value is byte[] bytes && bytes.Length == 0))
                throw new HyperlambdaException($"The [{argument.Name}] argument was given, but has no value");
            return value;
        }

        /// <summary>
        /// Returns the credentials to use when signing a new token.
        /// </summary>
        /// <param name="secret">Auth secret from configuration, used if no private key is given.</param>
        /// <param name="privateKey">RSA private key as PEM, base64 DER or byte[], or null to use HS256.</param>
        /// <returns>Signing credentials for a new token.</returns>
        public static SigningCredentials GetSigningCredentials(string secret, object privateKey)
        {
            if (privateKey == null)
                return new SigningCredentials(
                    new SymmetricSecurityKey(AuthKeyDerivation.GetKeyBytes(secret)),
                    SecurityAlgorithms.HmacSha256Signature);

            var key = Parse(privateKey, "[private-key]").Private ??
                throw new HyperlambdaException("The [private-key] is a public key, a private key is required to sign tokens");
            return new SigningCredentials(key, SecurityAlgorithms.RsaSha256);
        }

        /// <summary>
        /// Returns the public key to verify RS256 tokens with.
        ///
        /// Notice, a private key is accepted too, but only its public half is ever returned.
        /// </summary>
        /// <param name="publicKey">RSA public (or private) key as PEM, base64 DER or byte[].</param>
        /// <returns>Public key to validate tokens with.</returns>
        public static SecurityKey GetVerificationKey(object publicKey)
        {
            return Parse(publicKey, "[public-key]").Public;
        }

        /// <summary>
        /// Returns true if a token signed with the specified algorithm should be accepted when
        /// verifying using an RSA key. Only RS256 is accepted, such that a token signed with the
        /// same key using another algorithm, or with HMAC, is refused.
        /// </summary>
        /// <param name="algorithm">The 'alg' of the incoming token.</param>
        /// <returns>True if the algorithm is accepted.</returns>
        public static bool IsValidRsaAlgorithm(string algorithm)
        {
            return algorithm == SecurityAlgorithms.RsaSha256;
        }

        /// <summary>
        /// Returns the public half of the specified key as a JSON Web Key.
        ///
        /// Notice, the returned key never contains private key material.
        /// </summary>
        /// <param name="publicKey">RSA public (or private) key as PEM, base64 DER or byte[].</param>
        /// <returns>Public JSON Web Key.</returns>
        public static JsonWebKey GetPublicJsonWebKey(object publicKey)
        {
            var key = Parse(publicKey, "[public-key]").Public;
            var result = JsonWebKeyConverter.ConvertFromRSASecurityKey(key);
            result.Kid = key.KeyId;
            result.Use = "sig";
            result.Alg = SecurityAlgorithms.RsaSha256;
            return result;
        }

        /*
         * Private helper methods.
         */

        /*
         * Parses the key once and caches the result.
         *
         * Notice, the keys are created from RSAParameters and not from an RSA instance, such that
         * IdentityModel creates its own RSA instances, avoiding one RSA instance shared between threads.
         */
        static ParsedKey Parse(object key, string argumentName)
        {
            if (key == null || (key is string str && string.IsNullOrWhiteSpace(str)))
                throw new HyperlambdaException($"No {argumentName} supplied");

            var raw = key as byte[] ?? Encoding.UTF8.GetBytes(key as string ?? throw new HyperlambdaException($"The {argumentName} must be a string or a byte[]"));
            var hash = Convert.ToHexString(SHA256.HashData(raw));
            if (_cache.TryGetValue(hash, out var cached))
                return cached;

            RSAParameters? privateParameters = null;
            RSAParameters publicParameters;
            using (var rsa = RSA.Create())
            {
                try
                {
                    Import(rsa, key);
                }
                catch (Exception error)
                {
                    // Notice, never including the key itself in the exception.
                    throw new HyperlambdaException($"The {argumentName} is not a valid RSA key, expected PEM, or DER as base64 or byte[]", error);
                }
                if (rsa.KeySize < 2048)
                    throw new HyperlambdaException($"The {argumentName} is a {rsa.KeySize} bit key, at least 2048 bits are required");
                try
                {
                    privateParameters = rsa.ExportParameters(true);
                }
                catch (CryptographicException)
                {
                    // Public key only, which is fine for verification.
                }
                publicParameters = rsa.ExportParameters(false);
            }

            // Key ID is the RFC 7638 thumbprint of the public key, identical for a key pair's private and public halves.
            var publicKey = new RsaSecurityKey(publicParameters);
            publicKey.KeyId = Base64UrlEncoder.Encode(publicKey.ComputeJwkThumbprint());
            var privateKey = privateParameters.HasValue ? new RsaSecurityKey(privateParameters.Value) { KeyId = publicKey.KeyId } : null;

            var result = new ParsedKey(privateKey, publicKey);
            if (_cache.Count >= MaxCachedKeys)
                _cache.Clear();
            _cache[hash] = result;
            return result;
        }

        /*
         * Imports a PEM, or a DER encoded key given as base64 or byte[], trying private key formats first.
         */
        static void Import(RSA rsa, object key)
        {
            if (key is string pem && pem.Contains("-----BEGIN", StringComparison.Ordinal))
            {
                rsa.ImportFromPem(pem);
                return;
            }
            var der = key as byte[] ?? Convert.FromBase64String((string)key);
            Action<RSA>[] importers =
            [
                x => x.ImportPkcs8PrivateKey(der, out _),
                x => x.ImportRSAPrivateKey(der, out _),
                x => x.ImportSubjectPublicKeyInfo(der, out _),
                x => x.ImportRSAPublicKey(der, out _),
            ];
            foreach (var idx in importers)
            {
                try
                {
                    idx(rsa);
                    return;
                }
                catch (CryptographicException)
                {
                    // Trying next format.
                }
            }
            throw new CryptographicException("Unknown key format");
        }
    }
}
