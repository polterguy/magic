
# Magic TODO

This module is the only module that Magic is distributed with out of the box, and serves as an example module,
for you to look at to create your own modules. The idea is that each module contains of 5 projects, optionally
one additional unit test project, and these are as follows.

1. `contracts` - Contains service interface(s) for your module
2. `model` - Contains the database model(s) for your module
3. `services` - Contains the servic(es) your module is dependent upon
4. `web.controller` - Contains your controller(s)
5. `web.model` - Contains the view-model(s)/web-model(s) for your module

The services is the most important part of your solution, and should ideally contain all your business logic.
Everything you do through your services, should be done through a contract/interface, using dependency injection,
by configuring Ninject in some class implementing the `IInitialize` interface. See the `magic.todo.services`
project for an example.

