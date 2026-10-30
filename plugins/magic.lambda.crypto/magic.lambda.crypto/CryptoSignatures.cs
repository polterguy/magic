/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.crypto.signatures
{
    public abstract class CryptoSignature : ISlotSignature
    {
        public virtual IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();

        public virtual IEnumerable<SlotConstraint> Constraints => System.Array.Empty<SlotConstraint>();

        protected static SlotChild Option(string name, string type, string description, bool required = false, string defaultValue = null, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = required,
                DefaultValue = defaultValue,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = required ? SlotChildCardinality.ExactlyOne : SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }

        protected static SlotChild Raw() => Option("raw", "bool", "Whether to return raw bytes instead of encoded text", defaultValue: "false");
    }

    public class RawSignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[] { Raw() };
    }

    public class AesSignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("password", CryptoSignaturesLiterals.TypeStringOrBytes, "Password or raw AES key", true, kind: "password,aes-key"),
            Raw(),
        };
    }

    public class RsaPublicKeySignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("public-key", CryptoSignaturesLiterals.TypeStringOrBytes, "Public key for the RSA operation", true, kind: "rsa-public-key"),
            Raw(),
        };
    }

    public class RsaPrivateKeySignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("private-key", CryptoSignaturesLiterals.TypeStringOrBytes, "Private key for the RSA operation", true, kind: "rsa-private-key"),
            Raw(),
        };
    }

    public class RsaCreateKeySignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("strength", "int", "RSA key strength in bits", defaultValue: "2048", kind: "rsa-key-strength"),
            Option("seed", CryptoSignaturesLiterals.TypeStringOrBytes, "Optional deterministic seed", kind: "crypto-seed"),
            Raw(),
        };
    }

    public class RsaVerifySignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("signature", CryptoSignaturesLiterals.TypeStringOrBytes, "RSA signature to verify", true, kind: "rsa-signature"),
            Option("public-key", CryptoSignaturesLiterals.TypeStringOrBytes, "Public key used to verify the signature", true, kind: "rsa-public-key"),
            Raw(),
        };
    }

    public class HashSignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("filename", "string", "File to hash when no input content is supplied", kind: "file-path"),
            Option("format", "string", "Hash output format: text, raw, or fingerprint", defaultValue: "text", kind: "hash-format"),
        };

        public override IEnumerable<SlotConstraint> Constraints
        {
            get
            {
                var result = new SlotConstraint
                {
                    Kind = SlotConstraintKind.ExactlyOneOf,
                    Description = "Provide either input content or [filename]",
                };
                result.Values.AddRange(["input", "filename"]);
                return new[] { result };
            }
        }
    }

    public class ConfigurableHashSignature : HashSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("algorithm", "string", "Hash algorithm: md5, sha1, sha256, sha384, or sha512", defaultValue: "sha256", kind: "hash-algorithm"),
            Option("filename", "string", "File to hash when no input content is supplied", kind: "file-path"),
            Option("format", "string", "Hash output format: text, raw, or fingerprint", defaultValue: "text", kind: "hash-format"),
        };
    }

    public class VerifyPasswordSignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("hash", "string", "BCrypt password hash produced by [crypto.password.hash]", true, kind: "password-hash"),
        };
    }

    public class CryptoRandomSignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("min", "int", "Minimum random length", defaultValue: "10"),
            Option("max", "int", "Maximum random length"),
            Raw(),
            Option("seed", "string", "Optional deterministic seed", kind: "crypto-seed"),
        };
    }

    public class CryptoRandomIntegerSignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("max", "int", "Exclusive maximum integer", defaultValue: "int.MaxValue"),
            Option("seed", "string", "Optional deterministic seed", kind: "crypto-seed"),
        };
    }

    public class GetKeySignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[] { Raw() };
    }

    public class CombinationSignSignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("signing-key", CryptoSignaturesLiterals.TypeStringOrBytes, "Private signing key", true, kind: "crypto-private-key"),
            Option("signing-key-fingerprint", CryptoSignaturesLiterals.TypeStringOrBytes, "Fingerprint for the signing key", true, kind: "crypto-key-fingerprint"),
            Raw(),
        };
    }

    public class CombinationEncryptSignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("signing-key", CryptoSignaturesLiterals.TypeStringOrBytes, "Private signing key", true, kind: "crypto-private-key"),
            Option("encryption-key", CryptoSignaturesLiterals.TypeStringOrBytes, "Public encryption key", true, kind: "crypto-public-key"),
            Option("signing-key-fingerprint", CryptoSignaturesLiterals.TypeStringOrBytes, "Fingerprint for the signing key", true, kind: "crypto-key-fingerprint"),
            Raw(),
            Option("seed", CryptoSignaturesLiterals.TypeStringOrBytes, "Optional encryption seed", kind: "crypto-seed"),
        };
    }

    public class CombinationVerifySignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("verification-key", CryptoSignaturesLiterals.TypeStringOrBytes, "Public key used to verify the signature", true, kind: "crypto-public-key"),
            Raw(),
        };
    }

    public class CombinationDecryptSignature : CryptoSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("decryption-key", CryptoSignaturesLiterals.TypeStringOrBytes, "Private decryption key", true, kind: "crypto-private-key"),
            Option("verification-key", CryptoSignaturesLiterals.TypeStringOrBytes, "Public key used to verify the signature", true, kind: "crypto-public-key"),
            Raw(),
        };
    }

    static class CryptoSignaturesLiterals
    {
        public const string TypeStringOrBytes = "string|byte[]";
    }
}
