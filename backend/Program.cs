/*
 * Copyright (c) Aista Ltd, 2021 - 2023 info@aista.com, all rights reserved.
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
                .ConfigureAppConfiguration((ctx, config) =>
                {
                    config.AddJsonFile("files/config/appsettings.json", optional: false, reloadOnChange: true);
                })
                .UseStartup<Startup>()
                .Build()
                .Run();
        }
    }
}