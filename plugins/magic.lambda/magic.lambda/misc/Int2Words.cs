/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.misc
{
    /// <summary>
    /// [int2words] slot allowing you to convert numbers to their word representationsm,
    /// such as 557 to 'five hundred and fifty seven' etc.
    /// </summary>
    [Slot(
        Name = "int2words",
        Description = "Spells an integer out in English words (e.g. 557 becomes 'five hundred and fifty seven'); handy for invoices and cheques",
        ValueKind = "integer,number",
        ValueDescription = "Integer value to convert to words",
        ValueRequired = true,
        ValueMode = SlotValueMode.ValueOrExpression,
        ValueExpressionResolution = SlotValueExpressionResolution.SingleNode,
        ReturnsMode = SlotReturnsMode.Value,
        ReturnsKind = "text",
        ReturnsDescription = "Resolves to the supplied integer written as words")]
    public class Int2Words : ISlot
    {
        static readonly string[] _unitsMap =
        [
            "zero",
            "one",
            "two",
            "three",
            "four",
            "five",
            "six",
            "seven",
            "eight",
            "nine",
            "ten",
            "eleven",
            "twelve",
            "thirteen",
            "fourteen",
            "fifteen",
            "sixteen",
            "seventeen",
            "eighteen",
            "nineteen"
        ];

        static readonly string[] _tensMap =
        [
            "zero",
            "ten",
            "twenty",
            "thirty",
            "forty",
            "fifty",
            "sixty",
            "seventy",
            "eighty",
            "ninety"
        ];

        // Magnitudes handled recursively, largest first.
        static readonly (long Size, string Name)[] _scales =
        [
            (1000000000000L, "trillion"),
            (1000000000L, "billion"),
            (1000000L, "million"),
            (1000L, "thousand"),
            (100L, "hundred"),
        ];

        /// <summary>
        /// Implementation of signal
        /// </summary>
        /// <param name="signaler">Signaler used to signal</param>
        /// <param name="input">Parameters passed from signaler</param>
        public void Signal(ISignaler signaler, Node input)
        {
            input.Value = ConvertIntegerToWords(input.GetEx<long>());
        }

        #region [ -- Private helper methods -- ]

        /*
         * Converts the specified integer number to its word representation.
         */
        static string ConvertIntegerToWords(long number)
        {
            if (number == 0L)
                return "zero";
            if (number < 0L)
                return "minus " + ConvertIntegerToWords(Math.Abs(number));
            var words = "";

            foreach (var (size, name) in _scales)
            {
                if ((number / size) > 0L)
                {
                    words += ConvertIntegerToWords(number / size) + " " + name + " ";
                    number %= size;
                }
            }

            if (number > 0L)
                words += (words == "" ? "" : "and ") + ConvertBelowHundred(number);

            return words.Trim();
        }

        /*
         * Converts a number between 1 and 99 to its word representation.
         */
        static string ConvertBelowHundred(long number)
        {
            if (number < 20L)
                return _unitsMap[number];
            var words = _tensMap[number / 10L];
            if ((number % 10L) > 0L)
                words += "-" + _unitsMap[number % 10L];
            return words;
        }

        #endregion
    }
}
