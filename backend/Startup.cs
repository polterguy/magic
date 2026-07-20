/*
 * Copyright (c) Thomas Hansen, 2021 - 2023 thomas@ainiro.io.
 */

using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using magic.library;

namespace magic.backend
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            // Initializing Magic.
            services.AddMagic(Configuration);
        }

        public void Configure(IApplicationBuilder app)
        {
            // Health check endpoint for container orchestration
            app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

            // Initializing Magic.
            app.UseMagic(Configuration);
        }
    }
}