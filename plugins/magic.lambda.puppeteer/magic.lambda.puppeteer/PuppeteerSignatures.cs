/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System.Collections.Generic;
using magic.signals.contracts;

namespace magic.lambda.puppeteer.signatures
{
    public abstract class PuppeteerSignature : ISlotSignature
    {
        public virtual IEnumerable<SlotChild> Children => System.Array.Empty<SlotChild>();

        public virtual IEnumerable<SlotConstraint> Constraints => System.Array.Empty<SlotConstraint>();

        protected static SlotChild Option(string name, string type, string description, bool required = false, string defaultValue = null, string kind = null)
        {
            return new SlotChild
            {
                Name = name,
                Type = type,
                Kind = kind,
                Description = description,
                Required = required,
                DefaultValue = defaultValue,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = required ? SlotChildCardinality.ExactlyOne : SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Option,
                Projection = SlotChildProjection.Value,
            };
        }

        // `childKind` parameterises the catalog the synth draws each
        // argument value from. Different callers want different argument
        // domains: `puppeteer.connect [args]` takes Chrome process flags
        // (`--no-sandbox`, `--window-size=...`) — drawn from `browser-arg`.
        // `puppeteer.evaluate-async [args]` and similar JavaScript-execution
        // callers want JS-typed arg values — drawn from `javascript-argument`.
        // Sharing this helper kept the schema shape DRY but baked in the
        // wrong default catalog; explicit kind per call site fixes that.
        protected static SlotChild Args(string name, string description, string childKind = "javascript-argument")
        {
            return new SlotChild
            {
                Name = name,
                Type = "string|lambda",
                Description = description,
                Required = false,
                Mode = SlotChildMode.ValueOrExpression,
                Cardinality = SlotChildCardinality.ZeroOrOne,
                Role = SlotChildRole.Arguments,
                Projection = SlotChildProjection.ArgumentBag,
                Children =
                {
                    new SlotChild
                    {
                        Name = ".",
                        Type = "string",
                        Kind = childKind,
                        Description = "Argument value",
                        Required = false,
                        Mode = SlotChildMode.ValueOrExpression,
                        Cardinality = SlotChildCardinality.ZeroOrMore,
                        Role = SlotChildRole.Option,
                        Projection = SlotChildProjection.Value,
                    },
                },
            };
        }
    }

    public class PuppeteerConnectSignature : PuppeteerSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("timeout-minutes", "int", "Idle timeout in minutes"),
            Option("max-lifetime-minutes", "int", "Maximum session lifetime in minutes"),
            Option("headless", "bool", "Whether the browser should run headless", defaultValue: "true"),
            Option("timeout", "int", "Browser launch timeout in milliseconds"),
            Args("args", "Browser launch arguments", childKind: "browser-arg"),
            Option("user-data-dir", "string", "Browser user data directory", kind: "folder-path"),
            Option("executable", "string", "Browser executable path", kind: PuppeteerSignaturesLiterals.ExecutablePath),
            Option(PuppeteerSignaturesLiterals.ExecutablePath, "string", "Browser executable path", kind: PuppeteerSignaturesLiterals.ExecutablePath),
        };

        public override IEnumerable<SlotConstraint> Constraints
        {
            get
            {
                var result = new SlotConstraint
                {
                    Kind = SlotConstraintKind.AtMostOneOf,
                    Description = "[executable] and [executable-path] are aliases; supply at most one",
                };
                result.Values.Add("executable");
                result.Values.Add(PuppeteerSignaturesLiterals.ExecutablePath);
                return new[] { result };
            }
        }
    }

    public class PuppeteerSelectorSignature : PuppeteerSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("selector", "string", "CSS selector", true, kind: "css-selector"),
        };
    }

    public class PuppeteerClickSignature : PuppeteerSelectorSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("selector", "string", "CSS selector", true, kind: "css-selector"),
            Option("button", "string", "Mouse button to click", defaultValue: "left", kind: "mouse-button"),
            Option("click-count", "int", "Number of clicks", kind: "click-count"),
            Option("delay", "int", "Delay in milliseconds between mouse down and up"),
        };
    }

    public class PuppeteerTextSignature : PuppeteerSelectorSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("selector", "string", "CSS selector", true, kind: "css-selector"),
            // 'text' added: the typed-into-form text is arbitrary user content — any `text` producer (lambda2hyper output, format result, strings.* result, file-load) should be wirable. `form-text` stays first to keep the form-context catalog selection.
            Option("text", "string", "Text to send", kind: "form-text,text"),
            Option("config-key", "string", "Configuration key resolving the text to send", kind: "config-key"),
            Option("delay", "int", "Delay in milliseconds between key presses"),
        };

        public override IEnumerable<SlotConstraint> Constraints => new[]
        {
            new SlotConstraint
            {
                Kind = SlotConstraintKind.ExactlyOneOf,
                Description = "Provide either [text] or [config-key]",
                Values = { "text", "config-key" },
            },
        };
    }

    public class PuppeteerGotoSignature : PuppeteerSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("url", "string", "URL to navigate to", true, kind: "url"),
            Option("timeout", "int", "Navigation timeout in milliseconds"),
            Option("wait-until", "string", "Navigation completion condition: load, domcontentloaded, networkidle0, or networkidle2", kind: "puppeteer-wait-until"),
        };
    }

    public class PuppeteerWaitForSelectorSignature : PuppeteerSelectorSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("selector", "string", "CSS selector", true, kind: "css-selector"),
            Option("timeout", "int", "Wait timeout in milliseconds"),
            Option("visible", "bool", "Wait until selector is visible"),
            Option("hidden", "bool", "Wait until selector is hidden"),
        };
    }

    public class PuppeteerWaitForUrlSignature : PuppeteerSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("url", "string", "URL pattern to wait for", true, kind: "url-pattern"),
            Option("timeout", "int", "Wait timeout in milliseconds"),
        };
    }

    public class PuppeteerEvaluateSignature : PuppeteerSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("expression", "string", "JavaScript expression or function", true, kind: "javascript"),
            Args("args", "Arguments passed to the JavaScript function"),
        };
    }

    public class PuppeteerSelectSignature : PuppeteerSelectorSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("selector", "string", "CSS selector", true, kind: "css-selector"),
            Args("values", "Option values to select"),
        };
    }

    public class PuppeteerScreenshotSignature : PuppeteerSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("filename", "string", "Destination filename", true, kind: "image-file"),
            Option("full-page", "bool", "Whether to capture the full page", defaultValue: "false"),
            Option("type", "string", "Image type", kind: "image-format"),
            Option("quality", "int", "JPEG/WebP image quality"),
        };
    }

    public class PuppeteerPressSignature : PuppeteerSelectorSignature
    {
        public override IEnumerable<SlotChild> Children => new[]
        {
            Option("selector", "string", "CSS selector", true, kind: "css-selector"),
            Option("key", "string", "Key to press", kind: "keyboard-key"),
            Option("delay", "int", "Delay in milliseconds between key down and up"),
        };
    }

    static class PuppeteerSignaturesLiterals
    {
        public const string ExecutablePath = "executable-path";
    }
}
