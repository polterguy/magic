/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using PuppeteerSharp;

namespace magic.lambda.puppeteer
{
    /// <summary>
    /// [puppeteer.wait-for-selector] slot for waiting until a selector appears.
    /// </summary>
    [Slot(
        Name = "puppeteer.wait-for-selector",
        Description = "Waits for a selector to appear",
        ValueKind = "puppeteer-session",
        RequiresScope = "puppeteer-session",
        Preconditions = "puppeteer-page-loaded",
        ValueDescription = "Puppeteer session ID",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.puppeteer.signatures.PuppeteerWaitForSelectorSignature))]
    public class WaitForSelector : ISlotAsync
    {
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var page = PuppeteerHelpers.RequirePage(input);
            var selector = PuppeteerHelpers.GetRequiredString(input, "selector");

            var options = new WaitForSelectorOptions
            {
                Timeout = PuppeteerHelpers.GetOptionalInt(input, "timeout")
            };

            var visible = PuppeteerHelpers.GetOptionalBool(input, "visible");
            var hidden = PuppeteerHelpers.GetOptionalBool(input, "hidden");

            if (visible.HasValue)
                options.Visible = visible.Value;
            if (hidden.HasValue)
                options.Hidden = hidden.Value;

            await page.WaitForSelectorAsync(selector, options);

            input.Clear();
            input.Value = null;
        }
    }
}
