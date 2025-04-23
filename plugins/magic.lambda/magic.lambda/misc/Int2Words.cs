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
    [Slot(Name = "int2words")]
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

            if ((number / 1000000000000L) > 0L)
            {
                words += ConvertIntegerToWords(number / 1000000000000L) + " trillion ";
                number %= 1000000000000L;
            }

            if ((number / 1000000000L) > 0L)
            {
                words += ConvertIntegerToWords(number / 1000000000L) + " billion ";
                number %= 1000000000L;
            }

            if ((number / 1000000L) > 0L)
            {
                words += ConvertIntegerToWords(number / 1000000L) + " million ";
                number %= 1000000L;
            }

            if ((number / 1000L) > 0L)
            {
                words += ConvertIntegerToWords(number / 1000L) + " thousand ";
                number %= 1000L;
            }

            if ((number / 100L) > 0L)
            {
                words += ConvertIntegerToWords(number / 100L) + " hundred ";
                number %= 100L;
            }

            if (number > 0L)
            {
                if (words != "")
                    words += "and ";

                if (number < 20L)
                {
                    words += _unitsMap[number];
                }
                else
                {
                    words += _tensMap[number / 10L];
                    if ((number % 10L) > 0L)
                        words += "-" + _unitsMap[number % 10L];
                }
            }

            return words.Trim();
        }

        #endregion
    }
}
