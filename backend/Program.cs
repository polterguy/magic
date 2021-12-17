/*
 * Magic Cloud, copyright Aista, Ltd. See the attached LICENSE file for details.
 */

using Microsoft.AspNetCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace magic.backend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            WebHost.CreateDefaultBuilder(args)
                .ConfigureAppConfiguration((hostingContext, config) => config.AddJsonFile("config/appsettings.json", optional: false, reloadOnChange: true))
                .UseStartup<Startup>()
                .Build()
                .Run();
        }
    }
}
