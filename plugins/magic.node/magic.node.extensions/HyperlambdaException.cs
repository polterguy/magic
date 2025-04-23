/*
 * Magic Cloud, copyright (c) 2023 Thomas Hansen. See the attached LICENSE file for details. For license inquiries you can send an email to thomas@ainiro.io
 */

using System;

namespace magic.node.extensions
{
    /// <summary>
    /// Exception thrown when there is a Hyperlambda error occurring.
    /// </summary>
    [Serializable]
    public class HyperlambdaException : Exception
    {
        private readonly string _stackTrace;

        /// <summary>
        /// Creates a new instance of exception.
        /// </summary>
        public HyperlambdaException()
        {
            IsPublic = false;
            Status = 500;
            FieldName = "";
            _stackTrace = null;
        }

        /// <summary>
        /// Creates a new exception.
        /// </summary>
        /// <param name="message">Friendly message, that might or might not be returned back to client.</param>
        public HyperlambdaException(string message)
            : base(message)
        {
            IsPublic = false;
            Status = 500;
            FieldName = "";
            _stackTrace = null;
        }

        /// <summary>
        /// Creates a new exception.
        /// </summary>
        /// <param name="message">Friendly message, that might or might not be returned back to client.</param>
        /// <param name="innerException">Inner exception</param>
        public HyperlambdaException(string message, Exception innerException)
            : base(message, innerException)
        {
            IsPublic = false;
            Status = 500;
            FieldName = "";
            _stackTrace = null;
        }

        /// <summary>
        /// Creates a new exception.
        /// </summary>
        /// <param name="message">Exception error text.</param>
        /// <param name="isPublic">Whether or not exception message should propagate to client in release builds.</param>
        /// <param name="status">Status code returned to client.</param>
        public HyperlambdaException(
            string message,
            bool isPublic,
            int status) : base(message)
        {
            IsPublic = isPublic;
            Status = status;
            FieldName = "";
            _stackTrace = null;
        }

        /// <summary>
        /// Creates a new exception.
        /// </summary>
        /// <param name="message">Exception error text.</param>
        /// <param name="isPublic">Whether or not exception message should propagate to client in release builds.</param>
        /// <param name="status">Status code returned to client.</param>
        /// <param name="fieldName">Field that triggered exception, if any.</param>
        public HyperlambdaException(
            string message,
            bool isPublic,
            int status,
            string fieldName) : base(message)
        {
            IsPublic = isPublic;
            Status = status;
            FieldName = fieldName;
            _stackTrace = null;
        }

        /// <summary>
        /// Creates a new exception.
        /// </summary>
        /// <param name="message">Exception error text.</param>
        /// <param name="isPublic">Whether or not exception message should propagate to client in release builds.</param>
        /// <param name="status">Status code returned to client.</param>
        /// <param name="fieldName">Field that triggered exception, if any.</param>
        /// <param name="stackTrace">Hyperlambda stack trace.</param>
        public HyperlambdaException(
            string message,
            bool isPublic,
            int status,
            string fieldName,
            string stackTrace) : base(message)
        {
            IsPublic = isPublic;
            Status = status;
            FieldName = fieldName;
            _stackTrace = stackTrace;
        }

        /// <summary>
        /// Creates a new exception.
        /// </summary>
        /// <param name="message">Exception error text.</param>
        /// <param name="isPublic">Whether or not exception message should propagate to client in release builds.</param>
        /// <param name="status">Status code returned to client.</param>
        /// <param name="fieldName">Field that triggered exception, if any.</param>
        /// <param name="innerException">Inner exception</param>
        public HyperlambdaException(
            string message,
            bool isPublic,
            int status,
            string fieldName,
            Exception innerException) : base(message, innerException)
        {
            IsPublic = isPublic;
            Status = status;
            FieldName = fieldName;
            _stackTrace = null;
        }

        /// <summary>
        /// Whether ot not exception will propagate to client in release builds.
        /// </summary>
        /// <value>True if exception is returned to the client.</value>
        public bool IsPublic { get; set; }

        /// <summary>
        /// Status code to return to client.
        /// </summary>
        /// <value>HTTP status code to return to client.</value>
        public int Status { get; set; }

        /// <summary>
        /// Name of field that triggered exception, if any.
        /// </summary>
        /// <value>Field that triggered exception.</value>
        public string FieldName { get; set; }

        /// <inheritdoc />
        public override string StackTrace { get { return _stackTrace ?? base.StackTrace; } }
    }
}
