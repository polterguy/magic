/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using magic.node;
using magic.node.extensions;
using magic.signals.contracts;

namespace magic.signals.services
{
    /// <summary>
    /// Default implementation service class for the ISignaler contract/interface.
    /// </summary>
    public class Signaler : ISignaler
    {
        readonly IServiceProvider _provider;
        readonly ISignalsProvider _signals;
        readonly List<Tuple<string, object>> _stack = [];

        /// <summary>
        /// Creates a new instance of the default ISignaler service class.
        /// </summary>
        /// <param name="provider">Service provider to use for retrieving services.</param>
        /// <param name="signals">Implementation class to use for retrieving
        /// types from their string representations.</param>
        public Signaler(IServiceProvider provider, ISignalsProvider signals)
        {
            _provider = provider;
            _signals = signals;
        }

        #region [ -- Interface implementation -- ]

        /// <summary>
        /// Invokes the slot with the specified name,
        /// passing in the node itself as arguments to the slot.
        /// </summary>
        /// <param name="name">Name of slot to invoke.</param>
        /// <param name="input">Arguments being passed in to slot.</param>
        /// <param name="functor">Optional function that will be executed after slot has been invoked.</param>
        public void Signal(string name, Node input, Action functor = null)
        {
            // Retrieves service for slot.
            object svc = GetService(name);

            // Invoking slot while prioritizing synchronized implementation.
            if (svc is ISlot slot)
                slot.Signal(this, input);
            else if (svc is ISlotAsync slotAsync)
                Task.Run(() => slotAsync.SignalAsync(this, input)).GetAwaiter().GetResult();
            else
                throw new HyperlambdaException($"[{name}] type does not implement ISlot or ISlotAsync interface");

            // Invoking callback if caller provided a callback to be executed after invocation of slot is done.
            functor?.Invoke();
        }

        /// <summary>
        /// Invokes the slot with the specified name,
        /// passing in the node itself as arguments to the slot.
        /// Notice, the ISlotAsync interface must have been implemented on your type
        /// to signal it using the async Signal method.
        /// </summary>
        /// <param name="name">Name of slot to invoke.</param>
        /// <param name="input">Arguments being passed in to slot.</param>
        /// <returns>An awaitable task.</returns>
        /// <param name="functor">Optional function that will be executed after slot has been invoked.</param>
        public async Task SignalAsync(string name, Node input, Action functor = null)
        {
            // Retrieves service for slot.
            object svc = GetService(name);

            // Invoking slot while prioritizing async implementation.
            if (svc is ISlotAsync slotAsync)
                await slotAsync.SignalAsync(this, input);
            else if (svc is ISlot slot)
                slot.Signal(this, input);
            else
                throw new HyperlambdaException($"[{name}] type does not implement ISlot or ISlotAsync interface");

            // Invoking callback if caller provided a callback to be executed after invocation of slot is done.
            functor?.Invoke();
        }

        /// <summary>
        /// Pushes the specified object unto the stack with the given key name,
        /// for then to evaluate the given functor. Useful for evaluating some piece of code
        /// making sure the evaluation has access to some stack object during its evaluation process.
        /// </summary>
        /// <param name="name">Name to push value unto the stack as.</param>
        /// <param name="value">Actual object to push unto the stack. Notice, object will be automatically disposed at
        /// the end of the scope if the object implements IDisposable.</param>
        /// <param name="functor">Callback evaluated while stack object is on the stack.</param>
        public void Scope(string name, object value, Action functor)
        {
            _stack.Add(new Tuple<string, object>(name, value));
            try
            {
                functor();
            }
            finally
            {
                var obj = _stack.Last();
                _stack.RemoveAt(_stack.Count - 1);
                if (obj.Item2 is IDisposable disp)
                    disp.Dispose();
            }
        }

        /// <summary>
        /// Pushes the specified object unto the stack with the given key name,
        /// for then to evaluate the given functor. Useful for evaluating some
        /// piece of code making sure the evaluation has access to some stack
        /// object during its evaluation process.
        /// </summary>
        /// <param name="name">Name to push value unto the stack as.</param>
        /// <param name="value">Actual object to push unto the stack. Notice,
        /// object will be automatically disposed at the end of the scope if
        /// the object implements IDisposable.</param>
        /// <param name="functor">Callback evaluated while stack object is on
        /// the stack.</param>
        /// <returns>An awaitable task.</returns>
        public async Task ScopeAsync(string name, object value, Func<Task> functor)
        {
            _stack.Add(new Tuple<string, object>(name, value));
            try
            {
                await functor();
            }
            finally
            {
                var obj = _stack.Last();
                _stack.RemoveAt(_stack.Count - 1);
                if (obj.Item2 is IDisposable disp)
                    disp.Dispose();
            }
        }

        /// <summary>
        /// Retrieves the last stack object pushed unto the stack with the
        /// specified name.
        /// </summary>
        /// <typeparam name="T">Type to return stack object as. Notice, no
        /// conversion will be attempted. Make sure you use the correct type
        /// when retrieving your stack object.</typeparam>
        /// <param name="name">Name stack object was pushed as.</param>
        /// <returns>The first stack object with the specified name, or null if
        /// none are found.</returns>
        public T Peek<T>(string name) where T : class
        {
            return _stack.LastOrDefault(x => x.Item1 == name)?.Item2 as T;
        }

        #endregion

        #region [ -- private helper methods -- ]

        /*
         * Returns service for specified slot.
         */
        private object GetService(string name)
        {
            var type = _signals.GetSlot(name) ?? throw new HyperlambdaException($"[{name}] slot does not exist");
            var svc = _provider.GetService(type);

            // Basic sanity checking.
            if (svc == null)
            {
                // Dynamically compiled and loaded assemblies cannot be registered in DI container.
                var ctor = type.GetConstructor([]);
                if (ctor != null)
                    svc = Activator.CreateInstance(type);
                else
                    svc = Activator.CreateInstance(type, [_provider]);
            }

            return svc;
        }

        #endregion
    }
}
