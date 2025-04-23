/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;
using System.Threading.Tasks;
using MimeKit;
using magic.lambda.mail.contracts;

namespace magic.lambda.mail.tests.helpers
{
    public class MockSmtpClient : ISmtpClient
    {
        readonly Action<MimeMessage> _send;
        readonly Action<string, int, bool> _connect;
        readonly Action<string, string> _authenticate;

        public MockSmtpClient(
            Action<MimeMessage> send,
            Action<string, int, bool> connect = null,
            Action<string, string> authenticate = null)
        {
            _send = send ?? throw new ArgumentNullException(nameof(send));
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

        public void Disconnect(bool quit)
        {
        }

        public async Task DisconnectAsync(bool quit)
        {
            await Task.Yield();
        }

        public void Send(MimeMessage message)
        {
            _send(message);
        }

        public async Task SendAsync(MimeMessage message)
        {
            _send(message);
            await Task.Yield();
        }
    }
}
