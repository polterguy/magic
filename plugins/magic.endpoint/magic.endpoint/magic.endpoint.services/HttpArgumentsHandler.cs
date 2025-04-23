/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Linq;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.endpoint.contracts;

namespace magic.endpoint.services
{
    /// <summary>
    /// Implementation of IArgumentsHandler service contract, responsible for
    /// attaching arguments originating from client to lambda object being executed.
    /// </summary>
    public class HttpArgumentsHandler : IHttpArgumentsHandler
    {
        /// <inheritdoc />
        public void Attach(
            Node lambda, 
            Dictionary<string, string> query,
            Node payload)
        {
            // Finding lambda object's [.arguments] declaration if existing, and making sure we remove it from lambda object.
            var declaration = lambda.Children.FirstOrDefault(x => x.Name == ".arguments");
            declaration?.UnTie();

            // [.arguments] not to insert into lambda if we have any arguments.
            var args = new Node("");

            // Checking if query parameters was supplied, and if so, attach them as arguments.
            if (query != null)
                args.AddRange(GetQueryParameters(declaration, query));

            // Checking if payload was supplied, and if so, attaching it as arguments.
            if (payload != null)
                args.AddRange(GetPayloadParameters(declaration, payload));

            // Making sure we sort arguments such that they're given in the same order they're found in [.arguments] declaration of file.
            var argsSorted = new Node(".arguments");
            if (declaration != null)
            {
                foreach (var idx in declaration.Children)
                {
                    var cur = args.Children.FirstOrDefault(x => x.Name == idx.Name);
                    if (cur != null)
                        argsSorted.Add(cur);
                }
            }

            // Adding remaining arguments to ensure we'll throw exceptions later due to illegal arguments passed into Hyperlambda file.
            if (args.Children.Any())
                argsSorted.AddRange(args.Children);

            // Only inserting [.arguments] node if there are any arguments.
            if (argsSorted.Children.Any())
                lambda.Insert(0, argsSorted);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Converts if necessary, and attaches arguments found in
         * query parameters to args node, sanity checking that the
         * query parameter is allowed in the process.
         */
        static IEnumerable<Node> GetQueryParameters(
            Node declaration,
            Dictionary<string, string> query)
        {
            // Verifying caller wants to perform type checking at all.
            var typeCheck = declaration != null && declaration.Get<string>() != "*";

            // Looping through all arguments.
            foreach (var idxArg in query)
            {
                // Retrieving string representation of argument.
                object value = idxArg.Value;

                // Verifying caller wants to perform type checking.
                if (typeCheck)
                {
                    var declarationType = declaration?
                        .Children
                        .FirstOrDefault(x => x.Name == idxArg.Key)?
                        .Get<string>() ??
                        throw new HyperlambdaException($"I don't know how to handle the '{idxArg.Key}' query parameter");

                    // Converting argument to expected type.
                    value = Converter.ToObject(idxArg.Value, declarationType);
                }
                yield return new Node(idxArg.Key, value);
            }
        }

        /*
         * Converts if necessary, and attaches arguments found in
         * payload to args node, sanity checking that the
         * parameter is allowed in the process.
         */
        static IEnumerable<Node> GetPayloadParameters(Node declaration, Node payload)
        {
            /*
             * Checking if file contains a declaration at all.
             * This is done since by default all endpoints accepts all arguments,
             * unless an explicit [.arguments] declaration node is found.
             */
            if (declaration != null && declaration.Get<string>() != "*")
            {
                foreach (var idxArg in payload.Children)
                {
                    ConvertArgumentRecursively(
                        idxArg,
                        declaration.Children.FirstOrDefault(x => x.Name == idxArg.Name));
                }
            }
            return payload.Children.ToList();
        }

        /*
         * Converts the given input argument to the type specified in the
         * declaration node. Making sure the argument is allowed for the
         * endpoint.
         */
        static void ConvertArgumentRecursively(Node arg, Node declaration)
        {
            // If declaration node is null here, it means endpoint has no means to handle the argument.
            if (declaration == null)
                throw new HyperlambdaException($"I don't know how to handle the '{arg.Name}' argument");

            var type = declaration.Get<string>();
            if (type == "*")
                return; // Turning OFF all argument sanity checking and conversion recursively below this node.

            // Making sure type declaration for argument exists.
            if (type != null && arg.Value != null)
                arg.Value = Converter.ToObject(arg.Value, type); // Converting argument, which might throw an exception if conversion is not possible

            // Recursively running through children.
            foreach (var idxChild in arg.Children)
            {
                ConvertArgumentRecursively(idxChild, declaration.Children.FirstOrDefault(x => x.Name == idxChild.Name));
            }
        }

        #endregion
    }
}
