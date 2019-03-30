/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Microsoft.Extensions.Configuration;
using Ninject;

namespace magic.common.contracts
{
    public interface IConfigureNinject
    {
        void Configure(IKernel kernel, IConfiguration configuration);
    }
}
