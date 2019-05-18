/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Mvc.Formatters;

namespace magic.backend.init.internals
{
    public class ContentFormatters : StringOutputFormatter
    {
        public ContentFormatters()
        {
            SupportedMediaTypes.Add("application/javascript");
            SupportedMediaTypes.Add("text/html");
            SupportedMediaTypes.Add("text/css");
        }
    }
}