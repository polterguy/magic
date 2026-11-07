/*
 * Magic Cloud, copyright (c) 2023 AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.eval
{
    /// <summary>
    /// [whitelist] slot, allowing you to create sub-vocabulary of legal slots.
    /// </summary>
    [Slot(
        Name = "whitelist",
        Description = "Evaluates a lambda with a restricted whitelist of allowed slots",
        ReturnsMode = SlotReturnsMode.Both,
        ReturnsKind = "lambda-result",
        ReturnsDescription = "Resolves to the evaluated lambda's value result and any returned child nodes",
        ProvidesScope = "whitelist",
        ClonesLambda = true,
        SignatureType = typeof(global::magic.lambda.signatures.WhitelistSignature))]
    public class Whitelist : ISlotAsync
    {
        readonly ISignalsProvider _signals;

        /// <summary>
        /// Constructs a new instance of your type.
        /// </summary>
        /// <param name="signals">Provider telling which slots declare that they can never be whitelisted.</param>
        public Whitelist(ISignalsProvider signals)
        {
            _signals = signals;
        }

        /// <summary>
        /// Async implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            /*
             * A nested declaration would REPLACE the vocabulary in scope rather than narrow it,
             * since Peek returns the innermost stack object - which would allow sandboxed code to
             * simply declare itself a wider vocabulary. Hence there can only ever be one.
             *
             * Notice, a dynamic slot's body runs with the whitelist masked by [signal], so a slot
             * authored OUTSIDE the sandbox can still declare its own.
             */
            if (signaler.Peek<List<Node>>("whitelist") != null)
                throw new HyperlambdaException("You cannot declare a [whitelist] inside another [whitelist]");

            /*
             * A slot declaring it can never be whitelisted is refused here, when the vocabulary is
             * created, which is the only place a vocabulary is ever created.
             */
            var whitelist = GetWhitelist(input);
            var forbidden = whitelist.Vocabulary.FirstOrDefault(x => !_signals.IsWhitelistable(x.Name));
            if (forbidden != null)
                throw new HyperlambdaException($"[{forbidden.Name}] can never be used inside a [whitelist]");

            var result = new Node();
            await signaler.ScopeAsync("slots.result", result, async () =>
            {
                await signaler.ScopeAsync("whitelist", whitelist.Vocabulary, async () =>
                {
                    await signaler.SignalAsync("eval", whitelist.Lambda.Clone(), skipWhitelist: true);
                });
                input.Clear();
                input.Value = result.Value;
                input.MoveChildrenFrom(result);
            });
        }

        #region [ -- Private helper methods -- ]

        /*
         * Helper method to retrieve [whitelist] arguments.
         */
        static (List<Node> Vocabulary, Node Lambda) GetWhitelist(Node input)
        {
            var vocabulary = input
                .Children
                .FirstOrDefault(x => x.Name == "vocabulary")?
                .Children
                .ToList() ??
                    throw new HyperlambdaException("No [vocabulary] provided to [whitelist]");

            var lambda = input.Children.FirstOrDefault(x => x.Name == ".lambda") ??
                throw new HyperlambdaException("No [.lambda] provided to [whitelist]");

            return (vocabulary, lambda);
        }

        #endregion
    }
}
