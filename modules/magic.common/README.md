
# Magic common

This is the CRUD API helper module, that allows you to rapidly create CRUD APIs, arguably without having to create more than
a single line of C# code. It features some intelligent generic constructs, and relies upon you inheriting your API controllers
and services from these generic classes.

Notice, not all database tables, and/or operations, lends themselves to this approach. However, for those that do, inheriting
from the base classes found in this module, seriously reduces your efforts when creating API endpoints wrapping your database
for CRUD operations, and results in what I refer to as _"Super DRY code"_ - DRY again implying _"Don't Repeat Yourself"_.
