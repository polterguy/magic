/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security.Cryptography;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.crypto.slots.hash
{
    /// <summary>
    /// [crypto.hash] slot to create a cryptographically secure hash of a piece of string.
    /// </summary>
    [Slot(Name = "crypto.hash")]
    [Slot(Name = "crypto.hash.sha1")]
    [Slot(Name = "crypto.hash.md5")]
    [Slot(Name = "crypto.hash.sha256")]
    [Slot(Name = "crypto.hash.sha384")]
    [Slot(Name = "crypto.hash.sha512")]
    public class Hash : ISlotAsync
    {
        readonly IStreamService _streamService;
        readonly IRootResolver _rootResolver;

        /// <summary>
        /// Creates an instance of your type.
        /// </summary>
        /// <param name="streamService">Needed in case caller wants to create a hash from some sort of file or stream.</param>
        /// <param name="rootResolver">Needed in resolve the root path for dynamic files.</param>
        public Hash(IStreamService streamService, IRootResolver rootResolver)
        {
            _streamService = streamService;
            _rootResolver = rootResolver;
        }

        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler invoking slot.</param>
        /// <param name="input">Arguments to slot.</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            // Retrieving content we should hash.
            var contentRaw = input.GetEx<object>();
            object data = contentRaw is string strContent ?
                Encoding.UTF8.GetBytes(strContent) :
                contentRaw as byte[];

            // If no direct content was given, we check if caller supplied a [filename] argument.
            var isFile = false;
            if (data == null)
            {
                data = input.Children.FirstOrDefault(x => x.Name == "filename")?.GetEx<string>() ??
                    throw new HyperlambdaException($"No data or [filename] supplied to [{input.Name}]");
                isFile = true;
            }

            // Figuring out hashing algorithm to use, defaulting to SHA256.
            var algorithm = input.Name
                .Split('.')
                .Skip(2)?
                .FirstOrDefault();

            // Checking if algorithm was not part of slot invocation name.
            if (algorithm == null)
                algorithm = input
                    .Children
                    .FirstOrDefault(x => x.Name == "algorithm" || x.Name == "algo")?
                    .GetEx<string>()?
                    .ToLowerInvariant() ??
                        "sha256";

            // Figuring our how to return hash to caller.
            var format = input
                .Children
                .FirstOrDefault(x => x.Name == "format")?
                .GetEx<string>()?
                .ToLowerInvariant() ?? 
                    "text";

            // Applying the correct algorithm, returning hash result to caller.
            switch (algorithm)
            {
                /*
                 * MD5 and SHA1 are unfortunately necessary in order to support old legacy data,
                 * such as existing passwords in existing legacy databases
                 */
                case "md5":
                    using (var algo = MD5.Create())
                    {
                        input.Value = await GenerateHashAsync(algo, data, format, isFile);
                    }
                    break;

                case "sha1":
                    using (var algo = SHA1.Create())
                    {
                        input.Value = await GenerateHashAsync(algo, data, format, isFile);
                    }
                    break;

                case "sha256":
                    using (var algo = SHA256.Create())
                    {
                        input.Value = await GenerateHashAsync(algo, data, format, isFile);
                    }
                    break;

                case "sha384":
                    using (var algo = SHA384.Create())
                    {
                        input.Value = await GenerateHashAsync(algo, data, format, isFile);
                    }
                    break;

                case "sha512":
                    using (var algo = SHA512.Create())
                    {
                        input.Value = await GenerateHashAsync(algo, data, format, isFile);
                    }
                    break;

                default:
                    throw new HyperlambdaException($"'{algorithm}' is an unknown hashing algorithm.");
            }

            // House cleaning.
            input.Clear();
        }

        #region [ -- Private helper methods -- ]

        /*
         * Actual implementation, responsible for creating hash, and returning it to caller.
         */
        async Task<object> GenerateHashAsync(
            HashAlgorithm algo,
            object data,
            string format,
            bool isFile)
        {
            // Comuting hash on data.
            byte[] bytes = null;
            if (isFile)
            {
                // Input is a file, hence directly hashing file without loading it into memory.
                var path = _rootResolver.DynamicFiles + (data as string).TrimStart('/');
                using (var stream = await _streamService.OpenFileAsync(path))
                {
                    bytes = algo.ComputeHash(stream);
                }
            }
            else
            {
                // Input is a byte[] array.
                bytes = algo.ComputeHash(data as byte[]);
            }

            // Figuring out how to return hash value to caller.
            switch (format)
            {
                case "text":
                    return BitConverter
                        .ToString(bytes)
                        .Replace("-", "")
                        .ToLowerInvariant();

                case "raw":
                    return bytes;

                case "fingerprint":
                    var result = new StringBuilder();
                    var idxNo = 0;
                    foreach (var idx in bytes)
                    {
                        result.Append(BitConverter.ToString(new byte[] { idx }));
                        if (++idxNo % 2 == 0)
                            result.Append("-");
                    }
                    return result.ToString().TrimEnd('-').ToLowerInvariant();

                default:
                    throw new HyperlambdaException($"I don't understand {format} as format for my hash");
            }
        }

        #endregion
    }
}
