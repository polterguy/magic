/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using PuppeteerSharp;

namespace magic.lambda.puppeteer
{
    /// <summary>
    /// [puppeteer.wait-for-url] slot for waiting until the page URL matches.
    /// </summary>
    [Slot(
        Name = "puppeteer.wait-for-url",
        Description = "Waits for the page URL to match a condition",
        ValueKind = "puppeteer-session",
        RequiresScope = "puppeteer-session",
        Preconditions = "puppeteer-page-loaded",
        ValueDescription = "Puppeteer session ID",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.puppeteer.signatures.PuppeteerWaitForUrlSignature))]
    public class WaitForUrl : ISlotAsync
    {
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var page = PuppeteerHelpers.RequirePage(input);
            var url = PuppeteerHelpers.GetRequiredString(input, "url");

            var timeout = PuppeteerHelpers.GetOptionalInt(input, "timeout");
            var options = new WaitForFunctionOptions();
            if (timeout.HasValue && timeout.Value > 0)
                options.Timeout = timeout.Value;

            await page.WaitForFunctionAsync(
                "url => window.location.href === url",
                options,
                url);

            input.Clear();
            input.Value = null;
        }
    }
}
