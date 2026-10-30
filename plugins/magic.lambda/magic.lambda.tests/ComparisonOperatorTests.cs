/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;
using System.Linq;
using Xunit;
using magic.node.extensions;

namespace magic.lambda.tests
{
    /*
     * Runs [mt], [mte], [lt] and [lte] over operands of every numeric type, in every order,
     * since each of them converts mixed types in its own branch.
     */
    public class ComparisonOperatorTests
    {
        // Operand pairs with how the first relates to the second; 1 greater, 0 equal, -1 less.
        static readonly (string Lhs, string Rhs, int Order)[] _pairs =
        [
            ("int:2", "int:1", 1),
            ("int:1", "int:1", 0),
            ("int:1", "int:2", -1),
            ("long:2", "int:1", 1),
            ("long:1", "int:1", 0),
            ("uint:1", "long:2", -1),
            ("ulong:18446744073709551615", "long:1", 1),
            ("ulong:5", "ulong:5", 0),
            ("byte:1", "short:2", -1),
            ("decimal:2.5", "decimal:1.5", 1),
            ("decimal:1.5", "decimal:1.5", 0),
            ("decimal:1.5", "decimal:2.5", -1),
            ("decimal:2.5", "int:2", 1),
            ("int:2", "decimal:2", 0),
            ("decimal:1.5", "double:2.5", -1),
            ("double:2.5", "decimal:1.5", 1),
            ("double:2.5", "double:1.5", 1),
            ("double:1.5", "double:1.5", 0),
            ("double:1.5", "double:2.5", -1),
            ("double:2.5", "int:2", 1),
            ("int:2", "double:2.5", -1),
            ("float:1.5", "double:1.5", 0),
            ("float:2.5", "float:1.5", 1),
            ("float:1.5", "int:2", -1),
            ("double:Infinity", "double:1.5", 1),
            ("double:1.5", "double:Infinity", -1),
            ("double:Infinity", "double:Infinity", 0),
            ("string:b", "string:a", 1),
            ("string:a", "string:a", 0),
            ("string:a", "string:b", -1),
        ];

        public static IEnumerable<object[]> Numeric()
        {
            foreach (var pair in _pairs)
            {
                yield return [pair.Lhs, pair.Rhs, pair.Order];
            }
        }

        [Theory]
        [MemberData(nameof(Numeric))]
        public void Mt(string lhs, string rhs, int order)
        {
            Assert.Equal(order > 0, Run("mt", lhs, rhs));
        }

        [Theory]
        [MemberData(nameof(Numeric))]
        public void Mte(string lhs, string rhs, int order)
        {
            Assert.Equal(order >= 0, Run("mte", lhs, rhs));
        }

        [Theory]
        [MemberData(nameof(Numeric))]
        public void Lt(string lhs, string rhs, int order)
        {
            Assert.Equal(order < 0, Run("lt", lhs, rhs));
        }

        [Theory]
        [MemberData(nameof(Numeric))]
        public void Lte(string lhs, string rhs, int order)
        {
            Assert.Equal(order <= 0, Run("lte", lhs, rhs));
        }

        [Theory]
        [InlineData("eq", "double:NaN", "double:1.5")]
        [InlineData("eq", "double:NaN", "double:NaN")]
        [InlineData("mt", "double:NaN", "double:1.5")]
        [InlineData("mte", "double:1.5", "double:NaN")]
        [InlineData("lt", "double:NaN", "double:1.5")]
        [InlineData("lte", "double:1.5", "double:NaN")]
        [InlineData("mt", "decimal:1.5", "double:NaN")]
        [InlineData("mte", "double:NaN", "decimal:1.5")]
        [InlineData("lt", "decimal:1.5", "double:NaN")]
        [InlineData("lte", "double:NaN", "decimal:1.5")]
        public void NotANumberIsNeverOrderedOrEqual(string op, string lhs, string rhs)
        {
            Assert.False(Run(op, lhs, rhs));
        }

        [Theory]
        [InlineData("mt", "decimal:1.5", "double:Infinity", false)]
        [InlineData("mt", "double:Infinity", "decimal:1.5", true)]
        [InlineData("mte", "decimal:1.5", "double:Infinity", false)]
        [InlineData("lt", "decimal:1.5", "double:Infinity", true)]
        [InlineData("lte", "double:Infinity", "decimal:1.5", false)]
        [InlineData("eq", "double:Infinity", "double:Infinity", true)]
        [InlineData("eq", "double:Infinity", "double:1.5", false)]
        [InlineData("eq", "decimal:1.5", "double:1.5", true)]
        [InlineData("eq", "int:2", "decimal:2", true)]
        [InlineData("eq", "long:1", "int:2", false)]
        public void InfinityAndMixedDecimal(string op, string lhs, string rhs, bool expected)
        {
            Assert.Equal(expected, Run(op, lhs, rhs));
        }

        [Theory]
        [InlineData("mt", "string:a", "int:1")]
        [InlineData("mte", "string:a", "int:1")]
        [InlineData("lt", "string:a", "int:1")]
        [InlineData("lte", "string:a", "int:1")]
        [InlineData("mt", "int:1", "string:a")]
        [InlineData("lt", "int:1", "string:a")]
        public void OperandsOfDifferentKindsAreNeverOrdered(string op, string lhs, string rhs)
        {
            Assert.False(Run(op, lhs, rhs));
        }

        [Theory]
        [InlineData("mt", false, true, false)]
        [InlineData("mte", true, true, false)]
        [InlineData("lt", false, false, true)]
        [InlineData("lte", true, false, true)]
        public void Nulls(string op, bool bothNull, bool lhsOnly, bool rhsOnly)
        {
            Assert.Equal(bothNull, RunRaw(op, ".", "."));
            Assert.Equal(lhsOnly, RunRaw(op, ".:int:1", "."));
            Assert.Equal(rhsOnly, RunRaw(op, ".", ".:int:1"));
        }

        static bool Run(string op, string lhs, string rhs)
        {
            return RunRaw(op, ".:" + lhs, ".:" + rhs);
        }

        static bool RunRaw(string op, string lhs, string rhs)
        {
            var lambda = Common.Evaluate(op + "\n   " + lhs + "\n   " + rhs);
            return lambda.Children.First().Get<bool>();
        }
    }
}
