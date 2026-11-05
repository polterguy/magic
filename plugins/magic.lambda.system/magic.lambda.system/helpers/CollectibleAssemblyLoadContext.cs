/*
 * Magic Cloud, copyright AINIRO.IO, Ltd. See the attached LICENSE file for details. For license inquiries you can send an email to team@ainiro.io
 */

using System.Reflection;
using System.Runtime.Loader;

namespace magic.lambda.system.plugins
{
    /*
     * Helper class to be able to load assemblies that will be collected by the GC.
     */
    internal class CollectibleAssemblyLoadContext : AssemblyLoadContext  
    {  
        protected override Assembly Load(AssemblyName assemblyName)  
        {  
            return null;  
        }  
    }
}
