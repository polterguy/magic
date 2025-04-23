
/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using magic.node;
using magic.node.contracts;
using magic.node.extensions;
using magic.node.extensions.hyperlambda;

namespace magic.endpoint.services.utilities
{
    /// <summary>
    /// Utility class, mostly here to retrieve and set the DynamicFiles of where
    /// to resolve Hyperlambda files.
    /// </summary>
    public static class Utilities
    {
        /*
         * Returns true if request URL contains only legal characters.
         */
        internal static bool IsLegalAPIRequest(string requestUrl)
        {
            var entities = requestUrl.Split('/');
            foreach (var idxEntity in entities)
            {
                /*
                 * We need to keep track of character index in name of folder/file
                 * to allow for "hidden" files and folders.
                 */
                var idxNo = 0;
                foreach (var idxChar in idxEntity)
                {
                    switch (idxChar)
                    {
                        case '.':
                            if (idxNo > 0)
                            {
                                // We need to check if this is a file extension, at which point we allow it.
                                if (!idxEntity.Equals(entities.Last()))
                                    return false; // File or folder is not served
                            }
                            break;
                        default:
                            if (!IsLegal(idxChar))
                                return false;
                            break;
                    }
                    ++idxNo;
                }
            }
            return true;
        }

        static readonly char[] separator = ['/'];

        /*
         * Returns true if this is a legal request for a file from the "/etc/www/" folder.
         */
        internal static bool IsLegalFileRequest(string url)
        {
            // Making sure we don't serve Hyperlambda files.
            if (url.EndsWith(".hl"))
                return false;

            // Splitting up URL in separate entities.
            var splits = url.Split(separator, StringSplitOptions.RemoveEmptyEntries);
            foreach (var idx in splits)
            {
                if (idx.StartsWith('.'))
                    return false; // Hidden file or folder.
            }
            return true; // OK URL!
        }

        /*
         * Returns the path to the endpoints file matching the specified
         * URL and verb.
         */
        internal static string GetEndpointFilePath(
            IRootResolver rootResolver,
            string url,
            string verb)
        {
            // Sanity checking invocation.
            if (!IsLegalAPIRequest(url))
                throw new HyperlambdaException($"The URL '{url}' is not a legal URL for Magic");

            // Turning specified URL into a full path of file.
            return rootResolver.AbsolutePath(url + $".{verb}.hl");
        }

        /*
         * Returns true if request URL is requesting a mixin page (server side rendered HTML page)
         */
        internal static bool IsHtmlFileRequest(string url)
        {
            // A dynamically rendered request either does not have a file extension at all, or ends with ".html".
            var splits = url.Split(['/'], StringSplitOptions.RemoveEmptyEntries);
            if (splits.Length == 0)
                return true; // Request for root index.html document

            // Finding filename of request.
            var filename = splits.Last();
            if (filename.EndsWith(".html") || filename.EndsWith(".xml") || filename.EndsWith(".txt") || !filename.Contains('.'))
                return true; // If filename does not contain "." at all, it's a mixin URL.

            return false; // Defaulting to statically served content.
        }

        /*
         * Applies interceptors to specified Node/Lambda object.
         */
        internal static async Task<Node> ApplyInterceptors(
            IRootResolver rootResolver,
            IFileService fileService,
            Node result,
            string filename)
        {
            // Checking to see if interceptors exists recursively upwards in folder hierarchy.
            var splits = filename.Split(new char [] {'/'}, StringSplitOptions.RemoveEmptyEntries);

            // Stripping away last entity (filename) of invocation.
            var folders = splits.Take(splits.Length - 1);

            // Iterating as long as we have more entities in list of folders.
            while (true)
            {
                // Checking if "current-folder/interceptor.hl" file exists.
                var current = rootResolver.AbsolutePath(string.Join("/", folders) + "/interceptor.hl");
                if (await fileService.ExistsAsync(current))
                    result = await ApplyInterceptor(fileService, result, current);

                // Checking if we're done, and at root folder, at which point we break while loop.
                if (!folders.Any())
                    break; // We're done, no more interceptors!

                // Traversing upwards in hierarchy to be able to nest interceptors upwards in hierarchy.
                folders = folders.Take(folders.Count() - 1);
            }

            // Returning result to caller.
            return result;
        }

        #region [ -- Private helper methods -- ]

        /*
         * Returns true if specified character is in general a legal character for an URL endpoint name.
         */
        static bool IsLegal(char idxChar)
        {
            return idxChar == '_' ||
                idxChar == '-' ||
                (idxChar >= 'a' && idxChar <= 'z') ||
                (idxChar >= 'A' && idxChar <= 'Z') ||
                (idxChar >= '0' && idxChar <= '9');
        }

        /*
         * Applies the specified interceptor and returns the transformed Node/Lambda result.
         */
        static async Task<Node> ApplyInterceptor(
            IFileService fileService,
            Node lambda,
            string interceptorFile)
        {
            // Getting interceptor lambda.
            var interceptNode = HyperlambdaParser.Parse(await fileService.LoadAsync(interceptorFile));

            // Moving [.arguments] from endpoint lambda to the top of interceptor lambda if existing.
            var args = lambda
                .Children
                .Where(x =>
                    x.Name == ".arguments" ||
                    x.Name == ".description" ||
                    x.Name == ".type" ||
                    x.Name == "auth.ticket.verify" ||
                    x.Name.StartsWith("validators."));

            // Notice, reversing arguments nodes makes sure we apply arguments in order of appearance.
            foreach (var idx in args.Reverse().ToList())
            {
                interceptNode.Insert(0, idx); // Notice, will detach the argument from its original position!
            }

            // Moving endpoint Lambda to position before any [.interceptor] node found in interceptor lambda.
            foreach (var idxLambda in new Expression("**/.interceptor").Evaluate(interceptNode).ToList())
            {
                // Iterating through each node in current result and injecting before currently iterated [.lambda] node.
                foreach (var idx in lambda.Children)
                {
                    // This logic ensures we keep existing order without any fuzz.
                    // By cloning node we also support having multiple [.interceptor] nodes.
                    idxLambda.InsertBefore(idx.Clone());
                }

                // Removing currently iterated [.interceptor] node in interceptor lambda object.
                idxLambda.Parent.Remove(idxLambda);
            }

            // Returning interceptor Node/Lambda which is now the root of the execution Lambda object.
            return interceptNode;
        }

        #endregion
    }
}
