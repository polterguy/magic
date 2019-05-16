
# Magic common

Here you can find the common parts of Magic, which are shared between most projects, allowing you to inject your own logic into thye core of Magic.
In this module you'll among other things find the following interface.

* `IConfigureApplication` ==> Gives you an opportunity to customize your `IApplicationBuilder`
* `IConfigureServices` ==> Gives you an opportunity to create your own DI resolvings on your `IServiceCollection`
* `IStartup` ==> Gives you an opportunity to execute startup logic, and gives you access to your `IServiceProvider`

