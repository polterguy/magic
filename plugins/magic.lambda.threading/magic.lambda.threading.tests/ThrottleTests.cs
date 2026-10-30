/*
 * Magic Cloud, copyright (c) 2026 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.lambda.threading.tests
{
    /*
     * [execution.throttle] and [execution.throttle.create], with the request slots they depend on stubbed
     * out, since those live in the endpoint plugin. Throttles live in a static dictionary, so every test uses
     * its own throttle name, and the tests share one collection since the stubs are static too.
     */
    [Collection("throttle")]
    public class ThrottleTests
    {
        static string _ip = "1.2.3.4";
        static string _cloudflare;

        [Slot(Name = "request.ip")]
        public class RequestIp : ISlot
        {
            public void Signal(ISignaler signaler, Node input)
            {
                input.Value = _ip;
            }
        }

        [Slot(Name = "request.headers.get")]
        public class RequestHeadersGet : ISlot
        {
            public void Signal(ISignaler signaler, Node input)
            {
                Assert.Equal("CF-Connecting-IP", input.Value);
                input.Value = _cloudflare;
            }
        }

        static void Reset()
        {
            _ip = "1.2.3.4";
            _cloudflare = null;
        }

        [Fact]
        public void Global_ThrowsOnceLimitIsExceeded()
        {
            Reset();
            var err = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
execution.throttle.create:t-global
   limit:int:2
   per:global
execution.throttle:t-global
execution.throttle:t-global
execution.throttle:t-global"));
            Assert.StartsWith("Rate limit of 't-global' exceeded, retry in ", err.Message);
            Assert.EndsWith(" seconds", err.Message);
            Assert.Equal(429, err.Status);
            Assert.True(err.IsPublic);
        }

        [Fact]
        public void Global_AllowsRequestsWithinLimit()
        {
            Reset();
            Common.Evaluate(@"
execution.throttle.create:t-within
   limit:int:3
   per:global
execution.throttle:t-within
execution.throttle:t-within
execution.throttle:t-within");
        }

        [Fact]
        public void PerUser_UsesAuthenticatedUsername()
        {
            Reset();
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
execution.throttle.create:t-user
   limit:int:1
   per:user
execution.throttle:t-user
execution.throttle:t-user"));
        }

        [Fact]
        public void PerIp_PartitionsOnConnectionIp_WhenNoCloudflareHeader()
        {
            Reset();
            Common.Evaluate(@"
execution.throttle.create:t-ip
   limit:int:1
   per:ip
execution.throttle:t-ip");
            _ip = "5.6.7.8";
            Common.Evaluate(@"execution.throttle:t-ip");
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"execution.throttle:t-ip"));
        }

        [Fact]
        public void PerIp_PrefersCloudflareHeader()
        {
            Reset();
            _cloudflare = "9.9.9.9";
            Common.Evaluate(@"
execution.throttle.create:t-cf
   limit:int:1
   per:ip
execution.throttle:t-cf");

            // Another connection IP, but the same Cloudflare client, hence the same partition.
            _ip = "5.6.7.8";
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"execution.throttle:t-cf"));

            // A different Cloudflare client is a different partition.
            _cloudflare = "8.8.8.8";
            Common.Evaluate(@"execution.throttle:t-cf");
        }

        [Fact]
        public void NoPer_FallsBackToUsername()
        {
            Reset();
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
execution.throttle.create:t-default
   limit:int:1
execution.throttle:t-default
execution.throttle:t-default"));
        }

        [Fact]
        public void InvalidPer_ThrowsWhenEnforced()
        {
            Reset();
            var err = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
execution.throttle.create:t-bad-per
   limit:int:1
   per:weird
execution.throttle:t-bad-per"));
            Assert.Contains("cannot handle [per] values of 'weird'", err.Message);
        }

        [Fact]
        public void UnchangedConfiguration_KeepsCounters()
        {
            Reset();
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
execution.throttle.create:t-keep
   limit:int:1
   per:global
execution.throttle:t-keep
execution.throttle.create:t-keep
   limit:int:1
   per:global
execution.throttle:t-keep"));
        }

        [Fact]
        public void ChangedConfiguration_ReplacesThrottleAndResetsCounters()
        {
            Reset();
            Common.Evaluate(@"
execution.throttle.create:t-change
   limit:int:1
   per:global
execution.throttle:t-change
execution.throttle.create:t-change
   limit:int:5
   per:global
execution.throttle:t-change
execution.throttle:t-change");
        }

        [Fact]
        public void CreateWithoutChildren_DeletesThrottle()
        {
            Reset();
            var err = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
execution.throttle.create:t-delete
   limit:int:1
execution.throttle.create:t-delete
execution.throttle:t-delete"));
            Assert.Contains("has not been declared", err.Message);
        }

        [Fact]
        public void DeletingUnknownThrottle_IsNoOp()
        {
            Reset();
            Common.Evaluate(@"execution.throttle.create:t-never-declared");
        }

        [Fact]
        public void Create_WithoutLimit_Throws()
        {
            Reset();
            var err = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
execution.throttle.create:t-no-limit
   window:int:10"));
            Assert.Contains("must be given a [limit]", err.Message);
        }

        [Fact]
        public void Create_WithoutName_Throws()
        {
            Reset();
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
execution.throttle.create
   limit:int:1"));
        }

        [Fact]
        public void Enforce_WithoutName_Throws()
        {
            Reset();
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"execution.throttle"));
        }

        [Fact]
        public void Enforce_WithChildren_Throws()
        {
            Reset();
            var err = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
execution.throttle:t-children
   limit:int:1"));
            Assert.Contains("only accepts a name", err.Message);
        }

        [Fact]
        public void Enforce_Undeclared_Throws()
        {
            Reset();
            var err = Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"execution.throttle:t-undeclared"));
            Assert.Contains("'t-undeclared' has not been declared", err.Message);
        }

        [Fact]
        public void Window_IsHonoured()
        {
            Reset();
            Assert.Throws<HyperlambdaException>(() => Common.Evaluate(@"
execution.throttle.create:t-window
   limit:int:1
   window:int:3600
   per:global
execution.throttle:t-window
execution.throttle:t-window"));
        }
    }
}
