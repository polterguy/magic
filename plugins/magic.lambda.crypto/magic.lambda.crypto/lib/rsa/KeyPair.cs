/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

namespace magic.lambda.crypto.lib.rsa
{
    /// <summary>
    /// POCO class encapsulating an RSA key pair.
    /// </summary>
    public class KeyPair
    {
        /// <summary>
        /// The public RSA key
        /// </summary>
        /// <value>The byte[] representation of your public RSA key</value>
        public byte[] PublicKey { get; private set; }

        /// <summary>
        /// The private RSA key
        /// </summary>
        /// <value>The byte[] representation of your private RSA key</value>
        public byte[] PrivateKey { get; private set; }

        /// <summary>
        /// The fingerprint for your public RSA key.
        /// </summary>
        /// <value>The fingerprint representation of your public RSA key</value>
        public string Fingerprint { get; private set; }

        /// <summary>
        /// The SHA256 of your public key.
        /// </summary>
        /// <value>The SHA256 value of your public RSA key</value>
        public byte[] FingerprintRaw { get; private set; }

        internal KeyPair(
            byte[] publicKey,
            byte[] privateKey,
            string fingerprint,
            byte[] fingerprintRaw)
        {
            PublicKey = publicKey;
            PrivateKey = privateKey;
            Fingerprint = fingerprint;
            FingerprintRaw = fingerprintRaw;
        }
    }
}
