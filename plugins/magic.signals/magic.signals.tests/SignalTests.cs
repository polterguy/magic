/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using magic.node;
using magic.node.extensions;
using magic.signals.services;
using magic.signals.contracts;

namespace magic.signals.tests
{
    /*
     * Unit tests for signals and slots implementation.
     */
    public class SignalTests
    {
        [Fact]
        public void SignalInputReturn()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            // Creating some arguments for our signal.
            var input = new Node("", "hello ");

            // Signaling the 'foo.bar' slot with the given arguments.
            signaler.Signal("foo.bar", input);

            // Asserts.
            Assert.Equal("hello world", input.Get<string>());
        }

        [Fact]
        public void VerifyRegistered()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var provider = kernel.GetService(typeof(ISignalsProvider)) as ISignalsProvider;
            var keys = provider.Keys;
            Assert.NotNull(keys.SingleOrDefault(x => x == "foo.bar"));
        }

        [Fact]
        public void SignalWithFunctor()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            // Creating some arguments for our signal.
            var functorExecuted = false;
            var input = new Node("", "hello ");

            // Signaling the 'foo.bar' slot with the given arguments.
            signaler.Signal("foo.bar", input, () =>
            {
                functorExecuted = true;
            });

            // Asserts.
            Assert.Equal("hello world", input.Get<string>());
            Assert.True(functorExecuted);
        }

        [Fact]
        public async Task SignalWithFunctorAsync()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            // Creating some arguments for our signal.
            var functorExecuted = false;
            var input = new Node("", "hello ");

            // Signaling the 'foo.bar' slot with the given arguments.
            await signaler.SignalAsync("foo.bar", input, () =>
            {
                functorExecuted = true;
            });

            // Asserts.
            Assert.Equal("hello world", input.Get<string>());
            Assert.True(functorExecuted);
        }

        [Fact]
        public void SignalNoExisting_Throws()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            // Assuming this one will choke, since there are no 'foo.bar-XXX' slots registered.
            Assert.Throws<HyperlambdaException>(() => signaler.Signal("foo.bar-XXX", new Node()));
        }

        [Fact]
        public async Task SignalNoExistingAsync_Throws()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            // Assuming this one will choke, since there are no 'foo.bar-XXX' slots registered.
            await Assert.ThrowsAsync<HyperlambdaException>(async () => await signaler.SignalAsync("foo.bar-XXX", new Node()));
        }

        [Fact]
        public void StackTest()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            // Pushing some string unto our stack.
            var result = new Node();
            signaler.Scope("value", "hello world", () => signaler.Signal("stack.test", result));

            // Asserts.
            Assert.Equal("hello world", result.Value);
        }

        private class Disposable : IDisposable
        {
            public bool disposed = false;

            public void Dispose()
            {
                this.disposed = true;
            }

            public override string ToString()
            {
                return "disposed invoked";
            }
        }

        [Fact]
        public void StackTestDisposable()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            // Pushing some string unto our stack.
            var result = new Node();
            var disposable = new Disposable();
            signaler.Scope("value.dispose", disposable, () => signaler.Signal("stack.test.dispose", result));

            // Asserts.
            Assert.Equal("disposed invoked", result.Value);
            Assert.True(disposable.disposed);
        }

        [Fact]
        public async Task StackTestAsyn()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            // Pushing some string unto our stack.
            var result = new Node();
            await signaler.ScopeAsync("value", "hello world", async () => await signaler.SignalAsync("stack.test", result));

            // Asserts.
            Assert.Equal("hello world", result.Value);
        }

        [Fact]
        public async Task StackTestDisposableAsync()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            // Pushing some string unto our stack.
            var result = new Node();
            var disposable = new Disposable();
            await signaler.ScopeAsync("value.dispose", disposable, async () => await signaler.SignalAsync("stack.test.dispose", result));

            // Asserts.
            Assert.Equal("disposed invoked", result.Value);
            Assert.True(disposable.disposed);
        }

        [Fact]
        public async Task AsyncSignal()
        {
            // Creating our IServiceProvider, and retrieving our ISignaler.
            var kernel = Initialize();
            var signaler = kernel.GetService(typeof(ISignaler)) as ISignaler;

            // Pushing some string unto our stack.
            var result = new Node("", "hello ");
            await signaler.SignalAsync("foo.bar.async", result);

            // Asserts.
            Assert.Equal("hello world", result.Value);
        }

        #region [ -- Private helper methods -- ]

        /*
         * Helper method to wire up and create our IServiceProvider correctly.
         */
        static IServiceProvider Initialize()
        {
            var services = new ServiceCollection();

            // Initializing slots, first by making sure we retrieve all classes implementin ISlot, and having 
            // the SlotAttribute declared as an attribute.
            var slots = AppDomain.CurrentDomain.GetAssemblies()
                .Where(x => !x.IsDynamic && !x.FullName.StartsWith("Microsoft", StringComparison.InvariantCulture))
                .SelectMany(s => s.GetTypes())
                .Where(p => (typeof(ISlot).IsAssignableFrom(p) || typeof(ISlotAsync).IsAssignableFrom(p)) &&
                    !p.IsInterface &&
                    !p.IsAbstract &&
                    p.CustomAttributes.Any(x => x.AttributeType == typeof(SlotAttribute)));

            // Adding each slot type as a transient service.
            foreach (var idx in slots)
            {
                services.AddTransient(idx);
            }

            // Making sure we use the default ISignalsProvider and ISignaler services.
            var provider = new SignalsProvider(slots);
            services.AddSingleton<ISignalsProvider>((svc) => provider);
            services.AddTransient<ISignaler, Signaler>();

            // Building and returning service provider to caller.
            return services.BuildServiceProvider();
        }

        #endregion
    }
}
