/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Moq;
using Xunit;
using PuppeteerSharp;
using magic.node;
using magic.node.extensions;

namespace magic.lambda.puppeteer.tests
{
    [Collection(SessionsCollection.Name)]
    public class SessionTests
    {
        [Fact]
        public void CreateGivesUniqueIdsAndDefaults()
        {
            using var a = new FakeSession();
            using var b = new FakeSession();
            Assert.NotEqual(a.Id, b.Id);
            Assert.Equal(15, a.Session.TimeoutMinutes);
            Assert.Equal(120, a.Session.MaxLifetimeMinutes);
            Assert.Same(a.Page.Object, a.Session.Page);
            Assert.Same(a.Browser.Object, a.Session.Browser);
        }

        [Fact]
        public void CreateRespectsExplicitLimits()
        {
            using var session = new FakeSession(3, 9);
            Assert.Equal(3, session.Session.TimeoutMinutes);
            Assert.Equal(9, session.Session.MaxLifetimeMinutes);
        }

        [Theory]
        [InlineData(0, null)]
        [InlineData(-1, null)]
        [InlineData(null, 0)]
        [InlineData(null, -5)]
        public void CreateRejectsNonPositiveLimits(int? timeout, int? lifetime)
        {
            var fake = new FakeSession();
            fake.Dispose();
            Assert.Throws<HyperlambdaException>(() => PuppeteerSessions.Create(fake.Browser.Object, fake.Page.Object, timeout, lifetime));
        }

        [Fact]
        public void CreateRefusesMoreThanFiveSessions()
        {
            var sessions = new List<FakeSession>();
            try
            {
                for (var idx = 0; idx < 5; idx++)
                {
                    sessions.Add(new FakeSession());
                }
                var ex = Assert.Throws<HyperlambdaException>(() => new FakeSession());
                Assert.Contains("Maximum number", ex.Message);
            }
            finally
            {
                sessions.ForEach(x => x.Dispose());
            }
            using var again = new FakeSession();
        }

        [Fact]
        public void GetReturnsTheSessionAndTouchesIt()
        {
            using var session = new FakeSession();
            var before = session.Session.LastAccessUtc;
            System.Threading.Thread.Sleep(15);
            var found = PuppeteerSessions.Get(session.Id);
            Assert.Same(session.Session, found);
            Assert.True(found.LastAccessUtc > before);
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("  ")]
        public void GetRequiresAnId(string id)
        {
            Assert.Contains("[session_id]", Assert.Throws<HyperlambdaException>(() => PuppeteerSessions.Get(id)).Message);
        }

        [Fact]
        public void GetOfUnknownSessionThrows()
        {
            Assert.Contains("not found or expired", Assert.Throws<HyperlambdaException>(() => PuppeteerSessions.Get("nope")).Message);
        }

        [Fact]
        public async Task GetOfSessionBeyondMaxLifetimeClosesIt()
        {
            using var session = new FakeSession();
            typeof(PuppeteerSession).GetProperty(nameof(PuppeteerSession.CreatedUtc))!
                .SetValue(session.Session, DateTime.UtcNow.AddMinutes(-session.Session.MaxLifetimeMinutes - 1));
            Assert.Contains("expired", Assert.Throws<HyperlambdaException>(() => PuppeteerSessions.Get(session.Id)).Message);
            await Task.Delay(100);
            session.Page.Verify(x => x.CloseAsync(It.IsAny<PageCloseOptions>()), Times.AtLeastOnce);
            Assert.Throws<HyperlambdaException>(() => PuppeteerSessions.Get(session.Id));
        }

        [Fact]
        public async Task CloseClosesPageAndBrowserAndIsIdempotent()
        {
            var session = new FakeSession();
            await PuppeteerSessions.CloseAsync(session.Id);
            await PuppeteerSessions.CloseAsync(session.Id);
            await PuppeteerSessions.CloseAsync("never-existed");
            session.Page.Verify(x => x.CloseAsync(It.IsAny<PageCloseOptions>()), Times.Once);
            session.Browser.Verify(x => x.CloseAsync(), Times.Once);
            Assert.Throws<HyperlambdaException>(() => PuppeteerSessions.Get(session.Id));
        }

        [Fact]
        public async Task CloseSkipsAlreadyClosedPageAndBrowser()
        {
            var session = new FakeSession();
            session.Page.SetupGet(x => x.IsClosed).Returns(true);
            session.Browser.SetupGet(x => x.IsClosed).Returns(true);
            await PuppeteerSessions.CloseAsync(session.Id);
            session.Page.Verify(x => x.CloseAsync(It.IsAny<PageCloseOptions>()), Times.Never);
            session.Browser.Verify(x => x.CloseAsync(), Times.Never);
        }

        [Fact]
        public async Task CloseSurvivesFailingPageAndBrowser()
        {
            var session = new FakeSession();
            session.Page.Setup(x => x.CloseAsync(It.IsAny<PageCloseOptions>())).ThrowsAsync(new InvalidOperationException("page"));
            session.Browser.Setup(x => x.CloseAsync()).ThrowsAsync(new InvalidOperationException("browser"));
            await PuppeteerSessions.CloseAsync(session.Id);
            session.Browser.Verify(x => x.CloseAsync(), Times.Once);
        }

        [Fact]
        public async Task IdleSessionsExpireWhenTheirTimerFires()
        {
            var fake = new FakeSession();
            // The timeout is counted in minutes, so the timer is fired by hand instead of waiting for it.
            fake.Session.Timer.Change(TimeSpan.Zero, System.Threading.Timeout.InfiniteTimeSpan);
            for (var idx = 0; idx < 50 && fake.Page.Invocations.Count(x => x.Method.Name == "CloseAsync") == 0; idx++)
            {
                await Task.Delay(50);
            }
            fake.Page.Verify(x => x.CloseAsync(It.IsAny<PageCloseOptions>()), Times.Once);
            Assert.Throws<HyperlambdaException>(() => PuppeteerSessions.Get(fake.Id));
        }

        [Fact]
        public void RequireSessionAndPageResolveThroughTheNode()
        {
            using var session = new FakeSession();
            Assert.Same(session.Session, PuppeteerHelpers.RequireSession(new Node("x", session.Id)));
            Assert.Same(session.Page.Object, PuppeteerHelpers.RequirePage(new Node("x", session.Id)));
            Assert.Same(session.Session, PuppeteerHelpers.RequireSession(new Node("x", null, [new Node("session_id", session.Id)])));
        }
    }
}
