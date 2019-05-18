/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Swashbuckle.AspNetCore.Swagger;
using magic.backend.init;
using magic.backend.init.internals;

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
            services.AddMvc((x) => x.OutputFormatters.Add(new ContentFormatters()))
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_2);

            // Adding some basic configurations.
            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddSingleton(Configuration);
            services.Configure<RouteOptions>(options => options.LowercaseUrls = true);

            #region [ -- Magic parts -- ]

            // Giving every module a chance to configure its services.
            Configurator.ConfigureServices(services, Configuration);

            // Initializing database.
            InitializeDatabase.Initialize(services, Configuration);

            // Configuring swagger.
            services.AddSwaggerGen(swag =>
            {
                swag.SwaggerDoc("v1", new Info
                {
                    Title = "Super DRY Magic",
                    Version = "v1",
                    Description = "An ASP.NET Core web API Starter Kit",
                    License = new License
                    {
                        Name = "Affero GPL + Proprietary commercial (Closed Source)",
                        Url = "https://github.com/polterguy/magic",
                    },
                    Contact = new Contact
                    {
                        Name = "Thomas Hansen",
                        Email = "thomas@gaiasoul.com",
                        Url = "https://github.com/polterguy/magic",
                    },
                });
                foreach (var idxFile in Directory.GetFiles(AppContext.BaseDirectory, "*.xml"))
                {
                    swag.IncludeXmlComments(idxFile);
                }
                swag.OperationFilter<FileUploadOperation>();
            });

            #endregion
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            app.UseHttpsRedirection();
            app.UseCors(x => x.AllowAnyHeader().AllowAnyOrigin().AllowAnyMethod());

            app.UseMvc();

            #region [ -- Magic parts -- ]

            app.UseSwagger();
            app.UseSwaggerUI(c =>c.SwaggerEndpoint("/swagger/v1/swagger.json", "TITLE"));

            // Giving each module a chance to configure the application.
            Configurator.ConfigureApplication(app, Configuration);

            // Giving each module a chance to run startup logic.
            Configurator.InitializeStartups(app.ApplicationServices, Configuration);

            #endregion
        }
    }
}
