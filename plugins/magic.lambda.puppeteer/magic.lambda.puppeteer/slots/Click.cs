/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;
using PuppeteerSharp;
using PuppeteerSharp.Input;

namespace magic.lambda.puppeteer
{
    /// <summary>
    /// [puppeteer.click] slot for clicking a selector.
    /// </summary>
    [Slot(
        Name = "puppeteer.click",
        Description = "Clicks an element on the page",
        ValueKind = "puppeteer-session",
        RequiresScope = "puppeteer-session",
        Preconditions = "puppeteer-page-loaded",
        ValueDescription = "Puppeteer session ID",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.puppeteer.signatures.PuppeteerClickSignature))]
    public class Click : ISlotAsync
    {
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var page = PuppeteerHelpers.RequirePage(input);
            var selector = PuppeteerHelpers.GetRequiredString(input, "selector");

            var options = new ClickOptions
            {
                Button = PuppeteerHelpers.ParseMouseButton(PuppeteerHelpers.GetOptionalString(input, "button")),
            };

            var clickCount = PuppeteerHelpers.GetOptionalInt(input, "click-count");
            if (clickCount.HasValue)
                options.Count = clickCount.Value;

            var delay = PuppeteerHelpers.GetOptionalInt(input, "delay");
            if (delay.HasValue)
                options.Delay = delay.Value;

            await page.ClickAsync(selector, options);

            input.Clear();
            input.Value = null;
        }
    }
}
