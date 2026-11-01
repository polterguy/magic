/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.puppeteer
{
    /// <summary>
    /// [puppeteer.select] slot for selecting option values from a selector.
    /// </summary>
    [Slot(
        Name = "puppeteer.select",
        Description = "Selects an option in a select element",
        ValueKind = "puppeteer-session",
        RequiresScope = "puppeteer-session",
        Preconditions = "puppeteer-page-loaded",
        ValueDescription = "Puppeteer session ID",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None,
        SignatureType = typeof(global::magic.lambda.puppeteer.signatures.PuppeteerSelectSignature))]
    public class Select : ISlotAsync
    {
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var page = PuppeteerHelpers.RequirePage(input);
            var selector = PuppeteerHelpers.GetRequiredString(input, "selector");
            var valuesNode = input.Children.FirstOrDefault(x => x.Name == "values");
            var values = PuppeteerHelpers.GetValues(valuesNode);
            if (values.Length == 0)
                throw new HyperlambdaException("[puppeteer.select] requires at least one value in [values]");

            await page.SelectAsync(selector, values);

            input.Clear();
            input.Value = null;
        }
    }
}
