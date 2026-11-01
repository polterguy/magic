/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using PuppeteerSharp;

namespace magic.lambda.puppeteer
{
    /// <summary>
    /// [puppeteer.goto] slot for navigating to a URL.
    /// </summary>
    [Slot(
        Name = "puppeteer.goto",
        Description = "Navigates the current page to a URL",
        ValueKind = "puppeteer-session",
        RequiresScope = "puppeteer-session",
        ValueDescription = "Puppeteer session ID",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "url,puppeteer-page-loaded,text",
        ReturnsDescription = "Resolves to the resolved page URL after navigation",
        SignatureType = typeof(global::magic.lambda.puppeteer.signatures.PuppeteerGotoSignature))]
    public class Goto : ISlotAsync
    {
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var page = PuppeteerHelpers.RequirePage(input);
            var url = PuppeteerHelpers.GetRequiredString(input, "url");

            /*
             * Only http:// and https:// navigation is permitted. Any other scheme
             * (file:// in particular) would let the caller read local files through
             * the server's browser and exfiltrate them via [puppeteer.content] - the
             * sandbox never needs to navigate anywhere but the web.
             */
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
                throw new HyperlambdaException("Only http:// and https:// URLs are allowed in [puppeteer.goto]");

            var timeout = PuppeteerHelpers.GetOptionalInt(input, "timeout");
            var waitUntilValue = PuppeteerHelpers.GetOptionalString(input, "wait-until");
            var waitUntil = PuppeteerHelpers.ParseWaitUntil(waitUntilValue);

            IResponse response;
            var options = new NavigationOptions
            {
                ReferrerPolicy = "strict-origin-when-cross-origin",
                Referer = GetOrigin(url),
            };

            if (timeout.HasValue && timeout.Value > 0)
                options.Timeout = timeout.Value;
            if (waitUntil.HasValue)
                options.WaitUntil = new[] { waitUntil.Value };

            response = await page.GoToAsync(url, options);

            input.Clear();
            input.Value = response?.Url ?? page.Url;
        }

        static string GetOrigin(string url)
        {
            if (!Uri.TryCreate(url, UriKind.Absolute, out var uri))
                return null;

            return uri.GetLeftPart(UriPartial.Authority);
        }
    }
}
