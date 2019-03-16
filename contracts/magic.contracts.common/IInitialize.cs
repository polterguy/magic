/*
 * Poetry, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using Ninject;

namespace magic.contracts.common
{
    public interface IInitialize
    {
        void Initialize(IKernel kernel);
    }
}
