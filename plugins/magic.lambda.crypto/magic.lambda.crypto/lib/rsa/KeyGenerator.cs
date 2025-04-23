/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Org.BouncyCastle.Pkcs;
using Org.BouncyCastle.X509;
using Org.BouncyCastle.Crypto;
using Org.BouncyCastle.Security;
using Org.BouncyCastle.Crypto.Generators;
using Util = magic.lambda.crypto.lib.utilities;

namespace magic.lambda.crypto.lib.rsa
{
    /// <summary>
    /// Helper class that allows you to generate an RSA key pair.
    /// </summary>
    public class KeyGenerator
    {
        readonly SecureRandom _csrng;

        /// <summary>
        /// Creates a new instance of your class
        /// </summary>
        /// <param name="seed">Seed to use for the CSRNG</param>
        public KeyGenerator(byte[] seed = null)
        {
            _csrng = new SecureRandom();
            if (seed != null)
                _csrng.SetSeed(seed);
        }

        /// <summary>
        /// Creates a new RSA key pair for you, using the specified arguments.
        /// </summary>
        /// <param name="strength">Key strength for your kew, typically 1024, 2048 4096, etc</param>
        /// <returns>The newly created key pair</returns>
        public KeyPair Generate(int strength)
        {
            var generator = new RsaKeyPairGenerator();
            generator.Init(new KeyGenerationParameters(_csrng, strength));

            // Creating keypair.
            var keyPair = generator.GenerateKeyPair();
            var privateInfo = PrivateKeyInfoFactory.CreatePrivateKeyInfo(keyPair.Private);
            var publicInfo = SubjectPublicKeyInfoFactory.CreateSubjectPublicKeyInfo(keyPair.Public);

            // Returning key pair according to caller's specifications.
            var publicKey = publicInfo.GetDerEncoded();
            var fingerprint = Util.Utilities.CreateSha256Fingerprint(publicKey);
            var fingerprintRaw = Util.Utilities.CreateSha256(publicKey);

            // Returning as DER encoded raw byte[].
            return new KeyPair(publicKey, privateInfo.GetDerEncoded(), fingerprint, fingerprintRaw);
        }
    }
}
