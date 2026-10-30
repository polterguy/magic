/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using magic.signals.services;

namespace magic.signals.tests
{
    /*
     * Characterization tests for Signaler.Scope, ScopeAsync and Peek, pinning the exact semantics of the
     * scope stack, such that the way it looks values up can be changed without changing what it returns.
     */
    public class ScopeCharacterizationTests
    {
        class Disposable : IDisposable
        {
            readonly string _name;
            readonly List<string> _log;

            public Disposable(string name, List<string> log)
            {
                _name = name;
                _log = log;
            }

            public bool Disposed { get; private set; }

            public void Dispose()
            {
                Disposed = true;
                _log?.Add(_name);
            }
        }

        static Signaler Create() => new Signaler(null, null);

        [Fact]
        public async Task ScopeAsync_Batch_PushesAllInside_PopsAllAfterwards_DisposesInReverseOrder()
        {
            var signaler = Create();
            var log = new List<string>();
            var a = new Disposable("a", log);
            var b = new Disposable("b", log);
            string x = null; Disposable ia = null, ib = null;
            await signaler.ScopeAsync(new (string, object)[] { ("a", a), ("x", "foo"), ("b", b) }, async () =>
            {
                await Task.Yield();
                ia = signaler.Peek<Disposable>("a");
                x = signaler.Peek<string>("x");
                ib = signaler.Peek<Disposable>("b");
            });
            Assert.Same(a, ia);
            Assert.Equal("foo", x);
            Assert.Same(b, ib);
            Assert.Null(signaler.Peek<string>("x"));
            Assert.Null(signaler.Peek<Disposable>("a"));
            Assert.Equal<string>(["b", "a"], log);
        }

        [Fact]
        public async Task ScopeAsync_Batch_FunctorThrows_StillPopsAndDisposes()
        {
            var signaler = Create();
            var a = new Disposable("a", null);
            await Assert.ThrowsAsync<InvalidOperationException>(() => signaler.ScopeAsync(new (string, object)[] { ("a", a), ("x", "foo") }, () => throw new InvalidOperationException()));
            Assert.True(a.Disposed);
            Assert.Null(signaler.Peek<string>("x"));
            Assert.Null(signaler.Peek<Disposable>("a"));
        }

        [Fact]
        public void Peek_NoScope_ReturnsNull()
        {
            Assert.Null(Create().Peek<string>("foo"));
        }

        [Fact]
        public void Peek_InsideScope_ReturnsValue_AndNullAfterwards()
        {
            var signaler = Create();
            string inside = null;
            signaler.Scope("foo", "bar", () => inside = signaler.Peek<string>("foo"));
            Assert.Equal("bar", inside);
            Assert.Null(signaler.Peek<string>("foo"));
        }

        [Fact]
        public void NestedSameName_InnermostWins_ThenOuterIsRestored()
        {
            var signaler = Create();
            var seen = new List<string>();
            signaler.Scope("n", "outer", () =>
            {
                seen.Add(signaler.Peek<string>("n"));
                signaler.Scope("n", "inner", () => seen.Add(signaler.Peek<string>("n")));
                seen.Add(signaler.Peek<string>("n"));
            });
            Assert.Equal<string>(["outer", "inner", "outer"], seen);
            Assert.Null(signaler.Peek<string>("n"));
        }

        [Fact]
        public void DifferentNames_AreIndependent()
        {
            var signaler = Create();
            signaler.Scope("a", "1", () => signaler.Scope("b", "2", () =>
            {
                Assert.Equal("1", signaler.Peek<string>("a"));
                Assert.Equal("2", signaler.Peek<string>("b"));
                Assert.Null(signaler.Peek<string>("c"));
            }));
        }

        [Fact]
        public void Peek_WrongType_ReturnsNull_EvenIfAnOuterScopeWithSameNameHasTheRightType()
        {
            var signaler = Create();
            signaler.Scope("n", "outer-string", () => signaler.Scope("n", 5, () =>
            {
                // Innermost value is an int, and Peek does not fall through to the outer string.
                Assert.Null(signaler.Peek<string>("n"));
            }));
        }

        [Fact]
        public void NullValue_IsAScopeEntry_ShadowingOuter()
        {
            var signaler = Create();
            signaler.Scope("n", "outer", () => signaler.Scope("n", null, () => Assert.Null(signaler.Peek<string>("n"))));
        }

        [Fact]
        public void Exception_InFunctor_PopsScope_AndDisposesValue()
        {
            var signaler = Create();
            var disposable = new Disposable("d", null);
            Assert.Throws<InvalidOperationException>(() =>
                signaler.Scope("d", disposable, () => throw new InvalidOperationException("boom")));
            Assert.True(disposable.Disposed);
            Assert.Null(signaler.Peek<Disposable>("d"));
        }

        [Fact]
        public void Nested_Disposables_AreDisposedInnerFirst()
        {
            var signaler = Create();
            var log = new List<string>();
            signaler.Scope("a", new Disposable("outer", log), () =>
                signaler.Scope("b", new Disposable("inner", log), () => { }));
            Assert.Equal<string>(["inner", "outer"], log);
        }

        [Fact]
        public void InnerScope_ExceptionPropagates_OuterScopeStillPopped()
        {
            var signaler = Create();
            var log = new List<string>();
            Assert.Throws<InvalidOperationException>(() =>
                signaler.Scope("a", new Disposable("outer", log), () =>
                    signaler.Scope("b", new Disposable("inner", log), () => throw new InvalidOperationException())));
            Assert.Equal<string>(["inner", "outer"], log);
            Assert.Null(signaler.Peek<Disposable>("a"));
            Assert.Null(signaler.Peek<Disposable>("b"));
        }

        [Fact]
        public void DeepStack_BottomEntryStillFound()
        {
            var signaler = Create();
            string found = null;
            void Recurse(int depth)
            {
                if (depth == 200)
                {
                    found = signaler.Peek<string>("bottom");
                    Assert.Equal("200", signaler.Peek<string>("level-200"));
                    return;
                }
                signaler.Scope("level-" + (depth + 1), (depth + 1).ToString(), () => Recurse(depth + 1));
            }
            signaler.Scope("bottom", "yes", () => Recurse(0));
            Assert.Equal("yes", found);
        }

        [Fact]
        public async Task Async_NestedSameName_InnermostWins_ThenOuterIsRestored()
        {
            var signaler = Create();
            var seen = new List<string>();
            await signaler.ScopeAsync("n", "outer", async () =>
            {
                seen.Add(signaler.Peek<string>("n"));
                await signaler.ScopeAsync("n", "inner", async () =>
                {
                    await Task.Yield();
                    seen.Add(signaler.Peek<string>("n"));
                });
                seen.Add(signaler.Peek<string>("n"));
            });
            Assert.Equal<string>(["outer", "inner", "outer"], seen);
            Assert.Null(signaler.Peek<string>("n"));
        }

        [Fact]
        public async Task Async_Exception_PopsScope_AndDisposesValue()
        {
            var signaler = Create();
            var disposable = new Disposable("d", null);
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await signaler.ScopeAsync("d", disposable, async () =>
                {
                    await Task.Yield();
                    throw new InvalidOperationException("boom");
                }));
            Assert.True(disposable.Disposed);
            Assert.Null(signaler.Peek<Disposable>("d"));
        }
    }
}
