/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System.Collections.Generic;

namespace magic.endpoint.contracts.poco
{
    /// <summary>
    /// Class to help manipulate the HTTP response, by for instance allowing you to 
    /// add/modify its HTTP headers, etc.
    /// </summary>
    public class MagicResponse
    {
        /// <summary>
        /// Response HTTP headers that will be returned with HTTP response back to the client.
        /// </summary>
        public Dictionary<string, string> Headers { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// List of cookies that will be returned to client.
        /// </summary>
        public List<MagicCookie> Cookies { get; set; } = new List<MagicCookie>();

        /// <summary>
        /// The resulting HTTP response code.
        /// </summary>
        public int Result { get; set; } = 200;

        /// <summary>
        /// The actual content of your response.
        /// 
        /// Notice, if you return a stream, the stream will be copied directly
        /// to the response stream, without being loaded into memory in its entirety.
        /// </summary>
        public object Content { get; set; }
    }
}
