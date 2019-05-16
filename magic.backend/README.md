
# Magic backend

This is your actual web API application. It's arguably completely empty, and its sole responsibility
more or less, is to dynamically load up all other modules, controllers, and services, giving
you access to each module's functionality from within your app. Hence, the app itself, can arguably
be reused in all of your applications, without modifications, regardless of how different these
different apps are in nature.

The dynamic nature of the backend, is possible due to some intelligent use of initialization interfaces,
that you can implement on your own classes, combined with dynamic loading of assemblies. This allows
you to intercept the initialization of your app, without actually modifying it, to change the state
of the app, in whatever ways is necessary for you and your domain problem.

All assemblies are dynamically loaded, and then the backend will automatically wire up all controller
endpoints in your assembly, for then to invoke any initialization logic you implement using any of
the following interfaces.

* __IConfigureApplication__ ==> Gives you an opportunity to customize your `IApplicationBuilder`
* __IConfigureServices__ ==> Gives you an opportunity to create your own DI resolvings on your `IServiceCollection`
* __IStartup__ ==> Gives you an opportunity to execute startup logic, and gives you access to your `IServiceProvider`

All of these interfaces are also given your `IConfiguration` instance, such that they can read
configuration settings, etc. These interfaces can be found in the _"magic.common.contracts"_ project.

These three interfaces combined, and the dynamic loading of assemblies in the backend, gives you
the ability to initialize your application, and configure it as you see fit, without even having
to create a reference to your assemblies from the backend itself. Which again gives you _"drag and drop"_
change abilities for your backend, allowing you to simply drop an assembly into the backend's folder,
restart your backend process, and have the new functionlity automatically wired up according to your
needs.
