/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading.Tasks;
using MimeKit;
using magic.lambda.mail.contracts;

namespace magic.lambda.mail.tests.helpers
{
    public class MockPop3Client : IPop3Client
    {
        readonly Func<int, MimeMessage> _fetched;
        readonly Func<int> _count;
        readonly Action<string, int, bool> _connect;
        readonly Action<string, string> _authenticate;

        public MockPop3Client(
            Func<int, MimeMessage> fetched,
            Func<int> count,
            Action<string, int, bool> connect = null,
            Action<string, string> authenticate = null)
        {
            _fetched = fetched ?? throw new ArgumentNullException(nameof(fetched));
            _count = count ?? throw new ArgumentNullException(nameof(count));
            _connect = connect;
            _authenticate = authenticate;
        }

        public void Authenticate(string username, string password)
        {
            _authenticate?.Invoke(username, password);
        }

        public async Task AuthenticateAsync(string username, string password)
        {
            _authenticate?.Invoke(username, password);
            await Task.Yield();
        }

        public void Connect(string host, int port, bool useSsl)
        {
            _connect?.Invoke(host, port, useSsl);
        }

        public async Task ConnectAsync(string host, int port, bool useSsl)
        {
            _connect?.Invoke(host, port, useSsl);
            await Task.Yield();
        }

        public MimeMessage GetMessage(int index)
        {
            return _fetched(index);
        }

        public async Task<MimeMessage> GetMessageAsync(int index)
        {
            await Task.Yield();
            return _fetched(index);
        }

        public int GetMessageCount()
        {
            return _count();
        }

        public async Task<int> GetMessageCountAsync()
        {
            await Task.Yield();
            return _count();
        }

        public void Disconnect(bool quit)
        {
        }

        public async Task DisconnectAsync(bool quit)
        {
            await Task.Yield();
        }
    }
}
