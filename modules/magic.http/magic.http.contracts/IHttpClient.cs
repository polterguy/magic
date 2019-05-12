/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Threading.Tasks;

namespace magic.http.contracts
{
    public interface IHttpClient
    {
        Task<Response> PostAsync<Request, Response>(string url, Request request, string token = null);

        Task<Response> PutAsync<Request, Response>(string url, Request request, string token = null);

        Task<Response> GetAsync<Response>(string url, string token = null);

        Task GetAsync(string url, Action<Stream> functor, string accept = null, string token = null);

        Task<Response> DeleteAsync<Response>(string url, string token = null);
    }
}