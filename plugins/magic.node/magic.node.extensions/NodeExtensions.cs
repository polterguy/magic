/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Text;
using System.Linq;
using System.Globalization;
using System.Collections.Generic;
using magic.node.extensions.hyperlambda;

namespace magic.node.extensions
{
    /// <summary>
    /// Extension class extending the Node class with convenience methods.
    /// </summary>
    public static class NodeExtensions
    {
        /// <summary>
        /// Evaluates the expression found in the node's value, and returns
        /// the results of the evaluation.
        ///
        /// Notice, if the value of the node is not an expression, the method
        /// will throw an exception.
        /// </summary>
        /// <returns>Result of evaluation.</returns>
        public static IEnumerable<Node> Evaluate(this Node node)
        {
            if (node.Value is not Expression ex)
                throw new HyperlambdaException($"'{node.Value}' is not a valid Expression, and hence Node cannot be evaluated.");

            return ex.Evaluate(node);
        }

        /// <summary>
        /// Returns the value of the node as typeof(T). This method will not
        /// evaluate any expressions, but rather return expressions as is,
        /// without evaluating expressions in any ways.
        /// </summary>
        /// <typeparam name="T">Type to return value as, which might imply
        /// conversion if value is not already of the specified type.</typeparam>
        /// <returns>The node's value as an object of type T</returns>
        public static T Get<T>(this Node node)
        {
            if (node.Value is T result)
                return result;

            // byte[] to string conversion support, and vice versa.
            if (typeof(T) == typeof(string) && node.Value is byte[] bytes)
                return (T)(object)Encoding.UTF8.GetString(bytes);
            if (typeof(T) == typeof(byte[]) && node.Value is string stringValue)
                return (T)(object)Encoding.UTF8.GetBytes(stringValue);
            if (typeof(T) == typeof(string) && node.Value is Guid guidValue)
                return (T)(object)guidValue.ToString();
            if (typeof(T) == typeof(bool) && node.Value?.GetType() != typeof(bool))
                return (T)(object)IsTruthy(node.Value);

            // Converting, the simple version.
            return (T)Convert.ChangeType(node.Value, typeof(T), CultureInfo.InvariantCulture);
        }

        /*
         * Returns false for null, the string "false" and numeric zero, and true for everything else.
         */
        static bool IsTruthy(object value)
        {
            if (value == null)
                return false;
            if (value is string text && text == "false")
                return false;
            return !(IsNumber(value) && Convert.ToDouble(value) == 0D);
        }

        /*
         * Returns true if the object is a number.
         */
        static bool IsNumber(object value)
        {
            return value is sbyte
                || value is byte
                || value is short
                || value is ushort
                || value is int
                || value is uint
                || value is long
                || value is ulong
                || value is float
                || value is double
                || value is decimal;
        }

        /// <summary>
        /// Will return value of node as typeof(T), converting if necessary,
        /// and also evaluating any expressions found recursively, until a
        /// non-expression value is found.
        ///
        /// Notice, if expressions are evaluated, and the result of evaluating
        /// the expression finds multiple results, an exception will be thrown.
        /// </summary>
        /// <typeparam name="T">Type to return value or evaluated expression's
        /// value as.</typeparam>
        /// <param name="node">Node to retrieve value or evaluated expression
        /// from.</param>
        /// <returns>Value of node, or value of its evaluated expression.</returns>
        public static T GetEx<T>(this Node node)
        {
            // Checking if we're dealing with an expression, and if not, returning converted value.
            if (node.Value is not Expression ex)
                return node.Get<T>();

            /*
             * One expression might lead to another expression, etc, so we follow the chain in a loop.
             * To detect expressions leading back to a node we've already visited, such as "get-value:x:@get-value",
             * we use Brent's cycle detection, comparing each node to a single "checkpoint" node, which is moved
             * forward at every power of 2 hops. This costs no allocations, and no additional evaluations.
             */
            var checkpoint = node;
            var hops = 0;
            var limit = 2;
            while (true)
            {
                /*
                 * Enumerating the lazy result exactly once, since enumerating it again would evaluate the entire
                 * expression again. The result is drained even when we already know it has multiple nodes, such
                 * that an exception thrown while evaluating a later node is thrown, as it always was.
                 */
                Node first;
                using (var enumerator = ex.Evaluate(node).GetEnumerator())
                {
                    // Making sure we return default value for T if we have no result.
                    if (!enumerator.MoveNext())
                        return default;

                    first = enumerator.Current;

                    // Sanity checking result.
                    if (enumerator.MoveNext())
                    {
                        while (enumerator.MoveNext())
                        {
                            // Draining the result, such that an exception thrown while evaluating a later node is thrown.
                        }
                        throw new HyperlambdaException("Multiple resulting nodes from expression.");
                    }
                }

                node = first;
                if (node.Value is not Expression next)
                    return node.Get<T>();

                if (node == checkpoint)
                    throw new HyperlambdaException($"Expression '{next}' is recursive, and leads back to a node it has already visited.");
                if (++hops == limit)
                {
                    checkpoint = node;
                    hops = 0;
                    limit <<= 1;
                }
                ex = next;
            }
        }

        /// <summary>
        /// Transforms the specified node into its Hyperlambda syntax.
        /// </summary>
        /// <param name="node">Nod to transform into Hyperlambda</param>
        /// <returns></returns>
        public static string ToHyperlambda(this Node node)
        {
            return HyperlambdaGenerator.GetHyperlambda([node]);
        }
    }
}
