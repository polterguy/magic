/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;

namespace magic.common.web.model
{
    public class OperationResult
    {
        public string Message { get; set; }

        public Guid? Id { get; set; }
    }
}
