/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using Xunit;

namespace magic.lambda.tests
{
    public class FloatArrayTests
    {
        [Fact]
        public void FloatsBecomeRawBytes()
        {
            var lambda = Common.Evaluate(".v\n   .:float:1.5\n   .:float:-2\nfloatArray2bytes:x:@.v/*");
            var bytes = (byte[])lambda.Children.Skip(1).First().Value;
            Assert.Equal(8, bytes.Length);
            Assert.Equal(1.5f, BitConverter.ToSingle(bytes, 0));
            Assert.Equal(-2f, BitConverter.ToSingle(bytes, 4));
        }

        [Fact]
        public void NoValuesGiveNoBytes()
        {
            var lambda = Common.Evaluate(".v\nfloatArray2bytes:x:@.v/*");
            Assert.Empty((byte[])lambda.Children.Skip(1).First().Value);
        }
    }
}
