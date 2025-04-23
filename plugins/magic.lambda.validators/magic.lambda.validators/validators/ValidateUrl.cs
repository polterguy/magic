/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using magic.lambda.validators.helpers;

namespace magic.lambda.validators.validators
{
    /// <summary>
    /// [validators.url] slot, for verifying that some input is a valid URL.
    /// </summary>
    [Slot(Name = "validators.url")]
    public class ValidateUrl : ISlot
    {
        /// <summary>
        /// Implementation of slot.
        /// </summary>
        /// <param name="signaler">Signaler used to raise the signal.</param>
        /// <param name="input">Arguments to signal.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            Enumerator.Enumerate<string>(input, (value, name) =>
            {
                bool result = Uri.TryCreate(value, UriKind.Absolute, out Uri res);
                if (!result || (res.Scheme != Uri.UriSchemeHttp && res.Scheme != Uri.UriSchemeHttps))
                    throw new HyperlambdaException(
                        $"'{value}' is not a valid URL for [{name}]",
                        true,
                        400,
                        name);
            });
        }
    }
}
