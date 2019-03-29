/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.AspNetCore.Builder;

namespace magic.common.contracts
{
    public interface IConfigureApplication
    {
        void Configure(IApplicationBuilder app);
    }
}
