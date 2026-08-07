/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;

namespace magic.lambda.git
{
    internal static class GitSlotHelpers
    {
        const string MissingPrimaryArgument = "Missing required argument value";

        public static List<string> Args(params string[] args)
        {
            return new List<string>(args);
        }

        public static string GetRequiredPrimaryValue(Node input)
        {
            var value = input.GetEx<string>();
            if (string.IsNullOrWhiteSpace(value))
                throw new HyperlambdaException(MissingPrimaryArgument);
            return value;
        }

        public static string GetOptionalChild(Node input, string name)
        {
            var node = input.Children.FirstOrDefault(x => x.Name == name);
            if (node == null)
                return null;
            return node.GetEx<string>();
        }

        public static bool GetOptionalBool(Node input, string name, bool defaultValue)
        {
            var node = input.Children.FirstOrDefault(x => x.Name == name);
            if (node == null)
                return defaultValue;
            return node.GetEx<bool>();
        }

        public static string ResolveRepoPath(IRootResolver rootResolver, string relativePath)
        {
            ValidateFolderPath(relativePath);
            var fullPath = Path.GetFullPath(rootResolver.AbsolutePath(relativePath));
            var root = EnsureTrailingSeparator(Path.GetFullPath(rootResolver.DynamicFiles));

            if (!fullPath.StartsWith(root, StringComparison.OrdinalIgnoreCase))
                throw new HyperlambdaException("Repository path is outside of dynamic files root");

            return fullPath;
        }

        public static void EnsureNotDynamicRoot(IRootResolver rootResolver, string fullPath)
        {
            var root = EnsureTrailingSeparator(Path.GetFullPath(rootResolver.DynamicFiles));
            if (string.Equals(EnsureTrailingSeparator(Path.GetFullPath(fullPath)), root, StringComparison.OrdinalIgnoreCase))
                throw new HyperlambdaException("Refusing to delete dynamic files root");
        }

        public static IEnumerable<string> GetGitHubAuthArgs(IConfiguration configuration)
        {
            if (configuration == null)
                return Array.Empty<string>();

            var username = configuration["magic:git:github:username"];
            var token = configuration["magic:git:github:token"];
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(token))
                return Array.Empty<string>();

            var host = configuration["magic:git:github:host"];
            if (string.IsNullOrWhiteSpace(host))
                host = "github.com";

            var authBytes = Encoding.UTF8.GetBytes($"{username}:{token}");
            var auth = Convert.ToBase64String(authBytes);
            var header = $"http.https://{host}/.extraHeader=Authorization: Basic {auth}";

            return new[] { "-c", header };
        }

        public static async Task<string> RunGitAsync(string workingDirectory, IEnumerable<string> args, IEnumerable<string> extraArgs = null)
        {
            var startInfo = new ProcessStartInfo("git")
            {
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            };

            startInfo.Environment["GIT_TERMINAL_PROMPT"] = "0";
            startInfo.Environment["GIT_ASKPASS"] = "echo";

            /*
             * Stopping git's upward repository discovery at the given folder's parent,
             * such that a folder that isn't itself a repo never resolves to an enclosing
             * ancestor repository - e.g. the Magic repo itself on a developer machine.
             */
            var parent = Path.GetDirectoryName(
                Path.GetFullPath(workingDirectory).TrimEnd(Path.DirectorySeparatorChar));
            if (!string.IsNullOrEmpty(parent))
                startInfo.Environment["GIT_CEILING_DIRECTORIES"] = parent;

            if (extraArgs != null)
            {
                foreach (var arg in extraArgs)
                    startInfo.ArgumentList.Add(arg);
            }

            foreach (var arg in args)
                startInfo.ArgumentList.Add(arg);

            using var process = new Process { StartInfo = startInfo };
            try
            {
                process.Start();
            }
            catch (Exception ex)
            {
                throw new HyperlambdaException("Failed to start git process", ex);
            }

            var stdoutTask = process.StandardOutput.ReadToEndAsync();
            var stderrTask = process.StandardError.ReadToEndAsync();

            await Task.WhenAll(stdoutTask, stderrTask, process.WaitForExitAsync());

            if (process.ExitCode != 0)
            {
                var error = stderrTask.Result;
                if (string.IsNullOrWhiteSpace(error))
                    error = stdoutTask.Result;
                throw new HyperlambdaException(error?.TrimEnd());
            }

            return stdoutTask.Result?.TrimEnd();
        }

        static string EnsureTrailingSeparator(string path)
        {
            if (string.IsNullOrEmpty(path))
                return path;
            return path.EndsWith(Path.DirectorySeparatorChar)
                ? path
                : path + Path.DirectorySeparatorChar;
        }

        static void ValidateFolderPath(string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                throw new HyperlambdaException("Folder path is missing");
            if (!path.StartsWith("/"))
                throw new HyperlambdaException("Folder paths must start with '/'");
            if (!path.EndsWith("/"))
                throw new HyperlambdaException("Folder paths must end with '/'");
        }
    }
}
