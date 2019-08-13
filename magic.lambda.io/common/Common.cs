/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using magic.node;

namespace magic.lambda.common
{
    public static class Common
    {
        public static string GetFilename(Node input)
        {
            string filename;
            if (input.Value is string strValue)
            {
                filename = strValue;
            }
            else
            {
                var nodes = input.Get<Expression>().Evaluate(new Node[] { input });
                if (nodes.Count() != 1)
                    throw new ApplicationException("Expression for [load-file] yielded less or more than one result");
                filename = nodes.First().Get<string>();
            }
            return filename;
        }
    }
}
