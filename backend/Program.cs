/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using System;
using System.Runtime.InteropServices;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using magic.data.common.helpers;

namespace magic.backend
{
    public class Program
    {
        public static void Main(string[] args)
        {
            using (PosixSignalRegistration.Create(PosixSignal.SIGTERM, context => {
                if (!ShutdownLock.StartShutdown())
                {
                    Console.WriteLine("Waiting for application to clean up");
                    context.Cancel = true;
                }
                else
                {
                    Console.WriteLine("Shutting down application immediately");
                }
            }))
            {
                Host.CreateDefaultBuilder(args)
                    .ConfigureWebHostDefaults(webBuilder =>
                    {
                        webBuilder
                            .ConfigureAppConfiguration((ctx, config) =>
                            {
                                config.AddJsonFile("files/config/appsettings.json", optional: false, reloadOnChange: true);
                            })
                            .ConfigureKestrel(options =>
                            {
                                options.Limits.KeepAliveTimeout = TimeSpan.FromSeconds(180);
                                options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(180);
                                /*
                                 * The ceiling on anything uploaded to a cloudlet.
                                 *
                                 * Kestrel measures the whole request body, so a file has to fit
                                 * inside this together with its multipart envelope — the largest
                                 * file that actually gets through is a little under the number
                                 * below, not exactly it.
                                 */
                                const long MB = 1024 * 1024;
                                options.Limits.MaxRequestBodySize = 350 * MB;
                            })
                            .UseStartup<Startup>();
                    })
                    .Build()
                    .Run();
            }
        }
    }
}
