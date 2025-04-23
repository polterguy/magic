/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using Xunit;
using magic.node.extensions;

namespace magic.node.tests
{
    /*
     * Unit tests for converting from Hyperlambda string declarations to objects, and vice versa.
     */
    public class ExceptionsTests
    {
        [Fact]
        public void ThrowEmpty()
        {
            var exception = Assert.Throws<HyperlambdaException>(() =>
            {
                Throws_01();
            });
            Assert.Equal(500, exception.Status);
            Assert.Equal("", exception.FieldName);
            Assert.False(exception.IsPublic);
            Assert.Null(exception.InnerException);
        }

        [Fact]
        public void ThrowInnerException()
        {
            var exception = Assert.Throws<HyperlambdaException>(() =>
            {
                Throws_02();
            });
            Assert.Equal(500, exception.Status);
            Assert.Equal("", exception.FieldName);
            Assert.False(exception.IsPublic);
            Assert.NotNull(exception.InnerException);
            Assert.True(exception.InnerException.GetType() == typeof(ArgumentNullException));
            Assert.Equal("Some message", exception.Message);
        }

        [Fact]
        public void ThrowParams()
        {
            var exception = Assert.Throws<HyperlambdaException>(() =>
            {
                Throws_03();
            });
            Assert.Equal(499, exception.Status);
            Assert.Equal("", exception.FieldName);
            Assert.True(exception.IsPublic);
            Assert.Null(exception.InnerException);
            Assert.Equal("Some message", exception.Message);
        }

        [Fact]
        public void ThrowMoreParams()
        {
            var exception = Assert.Throws<HyperlambdaException>(() =>
            {
                Throws_04();
            });
            Assert.Equal(477, exception.Status);
            Assert.Equal("Howdy", exception.FieldName);
            Assert.False(exception.IsPublic);
            Assert.Null(exception.InnerException);
            Assert.Equal("Some message II", exception.Message);
        }

        [Fact]
        public void ThrowYetMoreParams()
        {
            var exception = Assert.Throws<HyperlambdaException>(() =>
            {
                Throws_05();
            });
            Assert.Equal(477, exception.Status);
            Assert.Equal("Howdy", exception.FieldName);
            Assert.False(exception.IsPublic);
            Assert.NotNull(exception.InnerException);
            Assert.True(exception.InnerException.GetType() == typeof(ArgumentNullException));
            Assert.Equal("Some message II", exception.Message);
        }

        static void Throws_01()
        {
            throw new HyperlambdaException();
        }

        static void Throws_02()
        {
            throw new HyperlambdaException("Some message", new ArgumentNullException());
        }

        static void Throws_03()
        {
            throw new HyperlambdaException("Some message", true, 499);
        }

        static void Throws_04()
        {
            throw new HyperlambdaException("Some message II", false, 477, "Howdy");
        }

        static void Throws_05()
        {
            throw new HyperlambdaException("Some message II", false, 477, "Howdy", new ArgumentNullException());
        }
    }
}
