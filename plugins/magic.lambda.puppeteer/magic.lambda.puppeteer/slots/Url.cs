/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using magic.node;
using magic.signals.contracts;

namespace magic.lambda.puppeteer
{
    /// <summary>
    /// [puppeteer.url] slot for returning current URL.
    /// </summary>
    [Slot(
        Name = "puppeteer.url",
        Description = "Returns the current page URL",
        ValueKind = "puppeteer-session",
        RequiresScope = "puppeteer-session",
        Preconditions = "puppeteer-page-loaded",
        ValueDescription = "Puppeteer session ID",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "url,text",
        ReturnsDescription = "Resolves to the current page URL")]
    public class Url : ISlot
    {
        public void Signal(ISignaler signaler, Node input)
        {
            var page = PuppeteerHelpers.RequirePage(input);

            input.Clear();
            input.Value = page.Url;
        }
    }
}
