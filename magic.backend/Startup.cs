/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.IO;
using System.Threading;
using System.Reflection;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Ninject;
using Ninject.Activation;
using Ninject.Infrastructure.Disposal;
using Swashbuckle.AspNetCore.Swagger;
using magic.backend.init;

namespace magic.backend
{
    public class Startup
    {
        private class Plugin
        {
            public string Name { get; set; }
        }

        readonly AsyncLocal<Scope> scopeProvider = new AsyncLocal<Scope>();

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        IKernel Kernel { get; set; }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            var mvcBuilder = services
                .AddMvc()
                .SetCompatibilityVersion(CompatibilityVersion.Version_2_1);
            var plugins = new List<Plugin>();
            Configuration.GetSection("plugins").Bind(plugins);
            foreach (var idxPlugin in plugins)
            {
                mvcBuilder.AddApplicationPart(Assembly.Load(new AssemblyName(idxPlugin.Name)));
            }

            services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();
            services.AddRequestScopingMiddleware(() => scopeProvider.Value = new Scope());
            services.AddCustomControllerActivation(Resolve);
            services.AddCustomViewComponentActivation(Resolve);
            services.Configure<RouteOptions>(options => options.LowercaseUrls = true);

            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new Info
                {
                    Title = "TITLE",
                    Version = "v1",
                    Description = "DESC",
                    TermsOfService = "LICENCE",
                    Contact = new Contact()
                    {
                        Name = "MAIN_CONTACT",
                        Email = "MAIN_EMAIL",
                        Url = "MAIN_URL"
                    }
                });
                foreach (var idxFile in Directory.GetFiles(AppContext.BaseDirectory, "*.xml"))
                {
                    c.IncludeXmlComments(idxFile);
                }
            });
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            Kernel = InitializeNinject.Initialize(app, Configuration, RequestScope);
            InitializeDatabase.Initialize(Kernel, Configuration, RequestScope);
            InitializeServices.Initialize(Kernel);

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseCors(x => x.AllowAnyHeader().AllowAnyOrigin().AllowAnyHeader());
            app.UseMvc();

            app.UseSwagger();
            app.UseSwaggerUI(c =>c.SwaggerEndpoint("/swagger/v1/swagger.json", "TITLE"));
        }

        object Resolve(Type type) => Kernel.Get(type);

        object RequestScope(IContext context) => scopeProvider.Value;

        sealed class Scope : DisposableObject { }
    }
}
