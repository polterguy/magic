/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Collections.Concurrent;
using Microsoft.ML.Tokenizers;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.openai
{
    /// <summary>
    /// [openai.tokenize] slot for counting how many tokens the specified input consumes.
    /// </summary>
    [Slot(
        Name = "openai.tokenize",
        Description = "Counts how many OpenAI tokens the given text consumes; useful for estimating cost or staying under context limits. Pass [model] to count with that model's exact encoding - defaults to o200k_base, the GPT-4o/GPT-5 family encoding",
        ValueKind = "text",
        ValueDescription = "Text to tokenize",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "integer,number",
        ReturnsDescription = "Resolves to the number of tokens in the supplied text",
        SignatureType = typeof(signatures.TokenizeSignature))]
    public class Tokenizer : ISlot
    {
        /*
         * One tokenizer per model/encoding, cached - creating one loads its
         * entire vocabulary, while counting with it is cheap.
         */
        static readonly ConcurrentDictionary<string, TiktokenTokenizer> _tokenizers =
            new ConcurrentDictionary<string, TiktokenTokenizer>();

        /// <summary>
        /// Slot implementation.
        /// </summary>
        /// <param name="signaler">Signaler that raised the signal.</param>
        /// <param name="input">Arguments to slot.</param>
        public void Signal(ISignaler signaler, Node input)
        {
            var txt = input.GetEx<string>();
            var model = input.Children.FirstOrDefault(x => x.Name == "model")?.GetEx<string>();
            input.Clear();
            input.Value = GetTokenizer(model).CountTokens(txt ?? "");
        }

        #region [ -- Private helper methods -- ]

        static TiktokenTokenizer GetTokenizer(string? model)
        {
            return _tokenizers.GetOrAdd(model ?? "o200k_base", _ =>
            {
                if (model == null)
                    return TiktokenTokenizer.CreateForEncoding("o200k_base");
                try
                {
                    return TiktokenTokenizer.CreateForModel(model);
                }
                catch (NotSupportedException)
                {
                    /*
                     * A model tiktoken has never heard of - fine-tune names and
                     * the newest models land here - and everything current is
                     * o200k family, so that is the sane default.
                     */
                    return TiktokenTokenizer.CreateForEncoding("o200k_base");
                }
            });
        }

        #endregion
    }
}
