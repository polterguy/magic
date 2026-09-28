/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System;
using System.IO;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.signals.contracts;
using PuppeteerSharp;

namespace magic.lambda.puppeteer
{
    /// <summary>
    /// [puppeteer.screenshot] slot for saving a screenshot to disk.
    /// </summary>
    [Slot(
        Name = "puppeteer.screenshot",
        Description = "Captures a screenshot of the page",
        ValueKind = "puppeteer-session",
        RequiresScope = "puppeteer-session",
        Preconditions = "puppeteer-page-loaded",
        ValueDescription = "Puppeteer session ID",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "image,binary-content",
        ReturnsDescription = "Resolves to the screenshot image bytes",
        SignatureType = typeof(global::magic.lambda.puppeteer.signatures.PuppeteerScreenshotSignature))]
    public class Screenshot : ISlotAsync
    {
        public async Task SignalAsync(ISignaler signaler, Node input)
        {
            var page = PuppeteerHelpers.RequirePage(input);
            var filename = PuppeteerHelpers.GetRequiredString(input, "filename");

            var options = new ScreenshotOptions
            {
                FullPage = PuppeteerHelpers.GetOptionalBool(input, "full-page") ?? false,
            };

            var type = PuppeteerHelpers.GetOptionalString(input, "type");
            if (!string.IsNullOrWhiteSpace(type))
            {
                switch (type.Trim().ToLowerInvariant())
                {
                    case "png":
                        options.Type = ScreenshotType.Png;
                        break;
                    case "jpeg":
                    case "jpg":
                        options.Type = ScreenshotType.Jpeg;
                        break;
                    default:
                        throw new HyperlambdaException("[type] must be 'png' or 'jpeg'");
                }
            }

            var quality = PuppeteerHelpers.GetOptionalInt(input, "quality");
            if (quality.HasValue)
                options.Quality = quality.Value;

            /*
             * Saving through the slot rather than writing the file directly, and deliberately
             * WITHOUT exempting it from the whitelist, since the path came from the caller.
             */
            using (var stream = new MemoryStream(await page.ScreenshotDataAsync(options)))
            {
                var save = new Node("", filename);
                save.Add(new Node("", stream));
                await signaler.SignalAsync("io.stream.save-file", save);
            }

            input.Clear();
            input.Value = filename;
        }
    }
}
