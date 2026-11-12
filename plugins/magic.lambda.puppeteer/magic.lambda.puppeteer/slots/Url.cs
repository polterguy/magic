/*
 * Magic Cloud, copyright (c) 2026 AINIRO.IO, Ltd.
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
        Whitelistable = false,
        Description = "Returns the current page URL",
        ValueKind = "puppeteer-session",
        RequiresScope = "puppeteer-session",
        Preconditions = "puppeteer-page-loaded",
        ValueDescription = "Puppeteer session ID",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "url,text",
        ReturnsDescription = "Resolves to the current page URL",
        SignatureType = typeof(global::magic.signals.contracts.NoChildrenSignature))]
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
