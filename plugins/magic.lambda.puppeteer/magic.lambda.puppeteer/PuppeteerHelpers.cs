/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen.
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.extensions;
using PuppeteerSharp;
using PuppeteerSharp.Input;

namespace magic.lambda.puppeteer
{
    internal static class PuppeteerHelpers
    {
        public static PuppeteerSession RequireSession(Node input, bool allowValue = true)
        {
            var sessionId = GetRequiredSessionId(input, allowValue);
            return PuppeteerSessions.Get(sessionId);
        }

        public static IPage RequirePage(Node input)
        {
            return RequireSession(input, allowValue: true).Page;
        }

        public static string GetRequiredValue(Node input, string label)
        {
            var value = GetSlotValue(input);
            if (string.IsNullOrWhiteSpace(value))
                throw new HyperlambdaException($"[{label}] requires a non-empty value");
            return value;
        }

        public static string GetRequiredString(Node input, string name)
        {
            var value = GetOptionalString(input, name);
            if (string.IsNullOrWhiteSpace(value))
                throw new HyperlambdaException($"[{name}] is required");
            return value;
        }

        public static string GetSlotValue(Node input)
        {
            if (input.Value != null)
                return input.GetEx<string>();

            return input.Children.FirstOrDefault(x => x.Name == ".")?.GetEx<string>();
        }

        public static string GetRequiredSessionId(Node input, bool allowValue = false)
        {
            string sessionId = null;
            if (allowValue && input.Value != null)
                sessionId = input.GetEx<string>();

            if (string.IsNullOrWhiteSpace(sessionId))
                sessionId = input.Children.FirstOrDefault(x => x.Name == "session_id")?.GetEx<string>();

            if (string.IsNullOrWhiteSpace(sessionId))
                throw new HyperlambdaException("[session_id] is required");

            return sessionId;
        }

        public static int GetRequiredInt(Node input, string label)
        {
            if (input.Value != null)
                return input.GetEx<int>();

            var node = input.Children.FirstOrDefault(x => x.Name == ".");
            if (node == null)
                throw new HyperlambdaException($"[{label}] requires a value");

            return node.GetEx<int>();
        }

        public static string GetOptionalString(Node input, string name)
        {
            return input.Children.FirstOrDefault(x => x.Name == name)?.GetEx<string>();
        }

        public static string GetRequiredTextOrConfigValue(Node input, IConfiguration configuration, string slotName)
        {
            var text = GetOptionalString(input, "text");
            var configKey = GetOptionalString(input, "config-key");

            if (!string.IsNullOrWhiteSpace(text) && !string.IsNullOrWhiteSpace(configKey))
                throw new HyperlambdaException($"[{slotName}] accepts either [text] or [config-key], not both");

            if (!string.IsNullOrWhiteSpace(text))
                return text;

            if (!string.IsNullOrWhiteSpace(configKey))
            {
                var value = configuration[configKey];
                if (string.IsNullOrWhiteSpace(value))
                    throw new HyperlambdaException($"[{slotName}] could not resolve [config-key] '{configKey}'");
                return value;
            }

            throw new HyperlambdaException($"[{slotName}] requires either a [text] or [config-key] child node");
        }

        public static bool? GetOptionalBool(Node input, string name)
        {
            var node = input.Children.FirstOrDefault(x => x.Name == name);
            return node == null ? null : node.GetEx<bool>();
        }

        public static int? GetOptionalInt(Node input, string name)
        {
            var node = input.Children.FirstOrDefault(x => x.Name == name);
            return node == null || node.Value == null ? null : node.GetEx<int>();
        }

        public static IEnumerable<string> GetArgs(Node argsNode)
        {
            if (argsNode == null)
                yield break;

            if (argsNode.Children.Any())
            {
                foreach (var child in argsNode.Children)
                {
                    var value = child.GetEx<string>();
                    if (!string.IsNullOrWhiteSpace(value))
                        yield return value;
                }
                yield break;
            }

            var argsText = argsNode.GetEx<string>();
            if (string.IsNullOrWhiteSpace(argsText))
                yield break;

            foreach (var arg in SplitArgs(argsText))
                yield return arg;
        }

        public static string[] GetValues(Node valuesNode)
        {
            if (valuesNode == null)
                return Array.Empty<string>();

            if (valuesNode.Children.Any())
                return valuesNode.Children.Select(x => x.GetEx<string>()).Where(x => !string.IsNullOrWhiteSpace(x)).ToArray();

            var text = valuesNode.GetEx<string>();
            if (string.IsNullOrWhiteSpace(text))
                return Array.Empty<string>();

            return text.Split(',').Select(x => x.Trim()).Where(x => x.Length > 0).ToArray();
        }

        public static WaitUntilNavigation? ParseWaitUntil(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return null;

            switch (value.Trim().ToLowerInvariant())
            {
                case "load":
                    return WaitUntilNavigation.Load;
                case "domcontentloaded":
                    return WaitUntilNavigation.DOMContentLoaded;
                case "networkidle0":
                    return WaitUntilNavigation.Networkidle0;
                case "networkidle2":
                    return WaitUntilNavigation.Networkidle2;
                default:
                    throw new HyperlambdaException($"Unsupported wait-until value '{value}'");
            }
        }

        public static MouseButton ParseMouseButton(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
                return MouseButton.Left;

            switch (value.Trim().ToLowerInvariant())
            {
                case "left":
                    return MouseButton.Left;
                case "middle":
                    return MouseButton.Middle;
                case "right":
                    return MouseButton.Right;
                default:
                    throw new HyperlambdaException($"Unsupported mouse button '{value}'");
            }
        }

        static List<string> SplitArgs(string input)
        {
            var args = new List<string>();
            var current = new StringBuilder();
            var inQuotes = false;
            var quoteChar = '\0';

            var i = 0;
            while (i < input.Length)
            {
                var c = input[i++];

                if (inQuotes)
                {
                    if (c == quoteChar)
                    {
                        inQuotes = false;
                    }
                    else if (IsEscapedQuote(input, i - 1, quoteChar))
                    {
                        current.Append(quoteChar);
                        i++;
                    }
                    else
                    {
                        current.Append(c);
                    }
                    continue;
                }

                if (char.IsWhiteSpace(c))
                {
                    AddArg(args, current);
                    continue;
                }

                if (c == '"' || c == '\'')
                {
                    inQuotes = true;
                    quoteChar = c;
                    continue;
                }

                current.Append(c);
            }

            AddArg(args, current);
            return args;
        }

        // Whether the character is a backslash escaping the quote character that follows it.
        static bool IsEscapedQuote(string input, int index, char quoteChar)
        {
            return input[index] == '\\' && index + 1 < input.Length && input[index + 1] == quoteChar;
        }

        // Adds what has been read so far as an argument, unless there is nothing.
        static void AddArg(List<string> args, StringBuilder current)
        {
            if (current.Length == 0)
                return;
            args.Add(current.ToString());
            current.Clear();
        }
    }
}
