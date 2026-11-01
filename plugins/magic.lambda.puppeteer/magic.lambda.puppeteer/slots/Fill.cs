/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;
using PuppeteerSharp;
using PuppeteerSharp.Input;

namespace magic.lambda.puppeteer
{
    /// <summary>
    /// [puppeteer.fill] slot for clearing and typing into a selector.
    /// </summary>
    [Slot(
        Name = "puppeteer.fill",
        Description = "Fills an input element with text",
        ValueKind = "puppeteer-session",
        RequiresScope = "puppeteer-session",
        Preconditions = "puppeteer-page-loaded",
        ValueDescription = "Puppeteer session ID",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.puppeteer.signatures.PuppeteerTextSignature))]
    public class Fill : ISlotAsync
    {
        readonly IConfiguration _configuration;

        public Fill(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var page = PuppeteerHelpers.RequirePage(input);
            var selector = PuppeteerHelpers.GetRequiredString(input, "selector");
            var text = PuppeteerHelpers.GetRequiredTextOrConfigValue(input, _configuration, "puppeteer.fill");

            var selectorLiteral = JsonSerializer.Serialize(selector);
            var clearScript = $"if(document.querySelector({selectorLiteral})){{document.querySelector({selectorLiteral}).value = '';}}";
            await page.EvaluateExpressionAsync(clearScript);

            var options = new TypeOptions
            {
                Delay = PuppeteerHelpers.GetOptionalInt(input, "delay"),
            };

            await page.TypeAsync(selector, text, options);

            input.Clear();
            input.Value = null;
        }
    }
}
