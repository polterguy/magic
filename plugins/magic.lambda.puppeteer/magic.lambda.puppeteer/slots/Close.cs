/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System.Threading.Tasks;
using magic.node;
using magic.signals.contracts;

namespace magic.lambda.puppeteer
{
    /// <summary>
    /// [puppeteer.close] slot for closing a Puppeteer session.
    /// </summary>
    [Slot(
        Name = "puppeteer.close",
        Description = "Closes a Puppeteer session",
        ValueKind = "puppeteer-session",
        RequiresScope = "puppeteer-session",
        ValueDescription = "Puppeteer session ID",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.None)]
    public class Close : ISlotAsync
    {
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var sessionId = PuppeteerHelpers.GetRequiredSessionId(input, allowValue: true);
            await PuppeteerSessions.CloseAsync(sessionId);

            input.Clear();
            input.Value = null;
        }
    }
}
