/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

namespace magic.common.contracts
{
    /*
     * Interface intended for resolving scoped DI objects.
     */
    public interface IScopedResolver
    {
        T GetScopedInstance<T>() where T : class, new();
    }
}
