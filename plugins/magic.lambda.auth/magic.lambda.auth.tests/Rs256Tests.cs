/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Security.Cryptography;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.IdentityModel.JsonWebTokens;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.lambda.auth.helpers;
using magic.backend.slots;

namespace magic.lambda.auth.tests
{
    public class Rs256Tests
    {
        static readonly string _secret = new AuthSettings().Secret;
        static readonly string _privateKey = CreateRsaKey(2048);
        static readonly string _publicKey = ToPublicPem(_privateKey);
        static readonly string[] _rs256Only = ["RS256"];
        static readonly string[] _jwkFields = ["kty", "use", "alg", "kid", "n", "e"];

        [Fact]
        public void NoPrivateKey_SignsWithHs256AsBefore()
        {
            Assert.Equal("HS256", new JsonWebToken(CreateToken(null)).Alg);
        }

        [Fact]
        public void PrivateKey_SignsWithRs256AndKid()
        {
            var token = new JsonWebToken(CreateToken(_privateKey));
            Assert.Equal("RS256", token.Alg);
            Assert.Equal(GetJwks(_publicKey).Single().Kid, token.Kid);
        }

        [Fact]
        public async Task PrivateKey_ExternalSystemValidatesUsingOnlyJwks()
        {
            // This is what another system does, it only knows the published JWKS.
            var result = await new JsonWebTokenHandler().ValidateTokenAsync(CreateToken(_privateKey), new TokenValidationParameters
            {
                ValidateIssuer = false,
                ValidateAudience = false,
                IssuerSigningKey = GetJwks(_publicKey).Single(),
                ValidAlgorithms = _rs256Only,
            });
            Assert.True(result.IsValid);
        }

        [Fact]
        public void ReadToken_NoPublicKey_AcceptsHs256AsBefore()
        {
            Assert.Null(Record.Exception(() => Read(CreateToken(null), null)));
        }

        [Fact]
        public void ReadToken_NoPublicKey_RefusesRs256()
        {
            Assert.Throws<HyperlambdaException>(() => Read(CreateToken(_privateKey), null));
        }

        [Fact]
        public void ReadToken_PublicKey_AcceptsRs256()
        {
            Assert.Null(Record.Exception(() => Read(CreateToken(_privateKey), _publicKey)));
        }

        [Fact]
        public void ReadToken_PublicKey_RefusesTokenSignedWithSecret()
        {
            Assert.Throws<HyperlambdaException>(() => Read(CreateToken(null), _publicKey));
        }

        [Fact]
        public void ReadToken_PublicKey_RefusesHs256SignedWithPublicKey()
        {
            // Classic algorithm confusion, signing an HS256 token using the public key as HMAC secret.
            var forged = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity([new Claim(ClaimTypes.Name, "root"), new Claim(ClaimTypes.Role, "admin")]),
                Expires = DateTime.UtcNow.AddMinutes(5),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_publicKey)), SecurityAlgorithms.HmacSha256),
            });
            Assert.Throws<HyperlambdaException>(() => Read(forged, _publicKey));
        }

        [Theory]
        [InlineData(SecurityAlgorithms.RsaSsaPssSha256)]
        [InlineData(SecurityAlgorithms.RsaSha512)]
        public void ReadToken_PublicKey_RefusesOtherAlgorithmWithSameKey(string algorithm)
        {
            // Signed with the right key, but not RS256, only the algorithm check refuses this.
            var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity([new Claim(ClaimTypes.Name, "foo"), new Claim(ClaimTypes.Role, "admin")]),
                Expires = DateTime.UtcNow.AddMinutes(5),
                SigningCredentials = new SigningCredentials(new RsaSecurityKey(ImportRsa(_privateKey)), algorithm),
            });
            Assert.Throws<HyperlambdaException>(() => Read(token, _publicKey));
        }

        [Fact]
        public void ReadToken_PublicKey_RefusesTokenFromAnotherKey()
        {
            Assert.Throws<HyperlambdaException>(() => Read(CreateToken(CreateRsaKey(2048)), _publicKey));
        }

        [Fact]
        public void MultipleKeys_EachAppOnlyAcceptsItsOwnTokens()
        {
            // One cloudlet, several apps, each with its own key pair.
            var keys = Enumerable.Range(0, 3).Select(x => CreateRsaKey(2048)).ToArray();
            for (var signer = 0; signer < keys.Length; signer++)
            {
                var token = CreateToken(keys[signer]);
                for (var verifier = 0; verifier < keys.Length; verifier++)
                {
                    var publicKey = ToPublicPem(keys[verifier]);
                    if (signer == verifier)
                        Read(token, publicKey);
                    else
                        Assert.Throws<HyperlambdaException>(() => Read(token, publicKey));
                }
            }
        }

        [Fact]
        public void Jwks_MultipleKeys_NeverContainsPrivateKey()
        {
            var otherPublicKey = ToPublicPem(CreateRsaKey(2048));
            var node = new Node();
            node.Add(new Node("public-key", _publicKey));
            node.Add(new Node("public-key", otherPublicKey));
            Common.Initialize().Signal("auth.jwks", node);

            var keys = node.Children.Single(x => x.Name == "keys").Children.ToArray();
            Assert.Equal(2, keys.Length);
            Assert.NotEqual(keys[0].Children.Single(x => x.Name == "kid").Get<string>(), keys[1].Children.Single(x => x.Name == "kid").Get<string>());
            foreach (var idx in keys)
            {
                Assert.Equal(_jwkFields, idx.Children.Select(x => x.Name).ToArray());
                Assert.Equal("RS256", idx.Children.Single(x => x.Name == "alg").Get<string>());
            }

            // Even when given a private key, only the public half is returned.
            var jwk = AuthSigningKeys.GetPublicJsonWebKey(_privateKey);
            Assert.Null(jwk.D);
            Assert.Null(jwk.P);
            Assert.Null(jwk.Q);
            Assert.False(jwk.HasPrivateKey);
        }

        [Fact]
        public void Jwks_SameKidFromPrivateAndPublicKey()
        {
            Assert.Equal(GetJwks(_privateKey).Single().Kid, GetJwks(_publicKey).Single().Kid);
        }

        [Fact]
        public void PrivateKey_GivenWithoutValue_ThrowsInsteadOfFallingBackToHs256()
        {
            // A key that failed to load must never silently turn into an HS256 token signed with the auth secret.
            var args = new Node();
            args.Add(new Node("username", "foo"));
            args.Add(new Node("private-key"));
            Assert.Throws<HyperlambdaException>(() => Common.Initialize().Signal("auth.ticket.create", args));
        }

        [Fact]
        public void ReadToken_PublicKeyGivenWithoutValue_ThrowsInsteadOfAcceptingHs256()
        {
            // Otherwise a valid HS256 token, e.g. root's login ticket, would be accepted by an app expecting its own RS256 key.
            var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string>
            {
                { "magic:auth:secret", _secret },
            }).Build();
            var args = new Node("", CreateToken(null), [new Node("roles", "admin"), new Node("public-key")]);
            Assert.Throws<HyperlambdaException>(() => new ReadToken(configuration).Signal(null, args));
        }

        [Fact]
        public void ReadToken_PublicKeyExpressionResolvingToNothing_Throws()
        {
            var root = new Node();
            root.Add(new Node(".key"));
            var args = new Node("", CreateToken(null), [new Node("roles", "admin"), new Node("public-key", Expression.Create("@.key"))]);
            root.Add(args);
            var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string>
            {
                { "magic:auth:secret", _secret },
            }).Build();
            Assert.Throws<HyperlambdaException>(() => new ReadToken(configuration).Signal(null, args));
        }

        [Fact]
        public void Jwks_KeyFromExpression()
        {
            var root = new Node();
            root.Add(new Node(".key", _publicKey));
            var args = new Node("auth.jwks", null, [new Node("public-key", Expression.Create("@.key"))]);
            root.Add(args);
            Common.Initialize().Signal("auth.jwks", args);
            Assert.Single(args.Children.Single(x => x.Name == "keys").Children);
        }

        [Fact]
        public void Jwks_NoKeys_Throws()
        {
            Assert.Throws<HyperlambdaException>(() => Common.Initialize().Signal("auth.jwks", new Node()));
        }

        [Fact]
        public void Jwks_DuplicateKeys_ReturnedOnce()
        {
            // The same key pair given as public and private key has the same kid.
            Assert.Single(GetJwks(_publicKey, _privateKey));
        }

        [Fact]
        public void DerKeys_LikeCryptoRsaCreateKey_SignAndVerify()
        {
            // [crypto.rsa.create-key] returns DER, as base64 or byte[], PKCS#8 private and SubjectPublicKeyInfo public.
            using var rsa = RSA.Create(2048);
            var privateBase64 = Convert.ToBase64String(rsa.ExportPkcs8PrivateKey());
            var publicBytes = rsa.ExportSubjectPublicKeyInfo();

            var token = CreateToken(privateBase64);
            Read(token, publicBytes);
            Read(token, Convert.ToBase64String(publicBytes));
            Assert.Equal(new JsonWebToken(token).Kid, GetJwks(rsa.ExportSubjectPublicKeyInfoPem()).Single().Kid);
        }

        [Fact]
        public void PrivateKey_TooSmall_Throws()
        {
            var error = Assert.Throws<HyperlambdaException>(() => CreateToken(CreateRsaKey(1024)));
            Assert.Contains("2048", error.Message);
        }

        [Fact]
        public void PrivateKey_PublicKeyCannotSign()
        {
            Assert.Throws<HyperlambdaException>(() => CreateToken(_publicKey));
        }

        [Fact]
        public void PrivateKey_Garbage_ThrowsWithoutEchoingKey()
        {
            var garbage = "-----BEGIN RSA PRIVATE KEY-----\nnot-a-key-SECRETVALUE\n-----END RSA PRIVATE KEY-----";
            var error = Assert.Throws<HyperlambdaException>(() => CreateToken(garbage));
            Assert.DoesNotContain("SECRETVALUE", error.Message);
        }

        [Fact]
        public void PrivateKey_Pkcs8AndPkcs1_SameKid()
        {
            var rsa = ImportRsa(_privateKey);
            Assert.Equal(
                AuthSigningKeys.GetPublicJsonWebKey(rsa.ExportRSAPrivateKeyPem()).Kid,
                AuthSigningKeys.GetPublicJsonWebKey(rsa.ExportPkcs8PrivateKeyPem()).Kid);
        }

        /*
         * Private helper methods.
         */

        static string CreateToken(object privateKey)
        {
            var args = new Node();
            args.Add(new Node("username", "foo"));
            args.Add(new Node("roles", null, [new Node("", "admin")]));
            if (privateKey != null)
                args.Add(new Node("private-key", privateKey));
            Common.Initialize().Signal("auth.ticket.create", args);
            return args.Get<string>();
        }

        static void Read(string token, object publicKey)
        {
            var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string>
            {
                { "magic:auth:secret", _secret },
            }).Build();
            var args = new Node("", token, [new Node("roles", "admin")]);
            if (publicKey != null)
                args.Add(new Node("public-key", publicKey));
            new ReadToken(configuration).Signal(null, args);
        }

        static JsonWebKey[] GetJwks(params string[] publicKeys)
        {
            var node = new Node();
            foreach (var idx in publicKeys)
                node.Add(new Node("public-key", idx));
            Common.Initialize().Signal("auth.jwks", node);
            return node.Children.Single(x => x.Name == "keys").Children.Select(x => new JsonWebKey
            {
                Kty = x.Children.Single(y => y.Name == "kty").Get<string>(),
                Kid = x.Children.Single(y => y.Name == "kid").Get<string>(),
                N = x.Children.Single(y => y.Name == "n").Get<string>(),
                E = x.Children.Single(y => y.Name == "e").Get<string>(),
            }).ToArray();
        }

        static string CreateRsaKey(int bits)
        {
            using var rsa = RSA.Create(bits);
            return rsa.ExportRSAPrivateKeyPem();
        }

        static string ToPublicPem(string privateKey)
        {
            using var rsa = ImportRsa(privateKey);
            return rsa.ExportSubjectPublicKeyInfoPem();
        }

        static RSA ImportRsa(string pem)
        {
            var rsa = RSA.Create();
            rsa.ImportFromPem(pem);
            return rsa;
        }
    }
}
