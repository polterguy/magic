
# Quality Assurance Document

This document describes the process required to execute before *every single release of Magic*
after all code changes have been applied. If a code change is required to fix a bug, the *entire*
process should be restarted, to ensure the quality of Magic's release.

## Prerequisites

1. Check out [issues](https://github.com/polterguy/magic/issues) at GitHub to make sure no open tasks
exists that should have been fixed for the current release.
2. Open [travis](https://travis-ci.com/github/polterguy) and verify there are no bugs. If there are projects failing, make sure these projects will *not* fail as the production build is being released, which might occur if you've checked in code for sub-projects, relying upon other projects that has been changed.
3. Open [SonarCloud](https://sonarcloud.io/organizations/polterguy/projects?sort=-coverage) and verify none of the projects have any code smells, bugs, vulnerabilities, or duplicated lines of code, etc.
4. Create releases of all NuGet packages, make sure you release _"magic.library"_ after all other packages have been released and published by NuGet.Org. Make sure you bump the versions of all NuGet packages before building/publishing.
5. Update the _"magic.library"_ version the _"magic.csproj"_ file is referencing to the latest library version. Make sure the _"Version.cs"_ file is using the same version as the library version, and commit all changes to master branch.

The way this document is to be executed, is by following the steps below. These steps are to be performed *both*
on an OS X system, and on a Windows system. Hence, the entire description of the process should be
done *twice*. The Windows machine should have SQL Server and Visual Studio installed, and the OS X
machine should use MySQL as its database adapter, and VS Code as its IDE. As you perform these tests,
make sure you have your Google Chrome _"developer"_ tools running, such that you can see errors in
the console in case an error occurs. No errors are to be tolerated, unless the test you currently perform
is explicitly saying it will result in an error.

The tests must be performed in the order they're given in this document, since some of these tests,
relies upon the result from previously executed tests.

## Setup magic

1. Drop your _"magic"_ database using either MySQL Workbench or Microsoft SQL Server Management Studio, depending upon which operating system you are on. This ensures that you start out with the same pre-requisistes as a new user just having downloaded Magic.
2. Download Magic by choosing the _"Code/Download ZIP"_ at the [main GitHub project site](https://github.com/polterguy/magic). This ensures you're using the exact same code as is currently in the repository, and that no GIT ignored files in your repository is interfering with the test in any ways.
3. Unzip the file you are given.
4. Start Magic, both the frontend and the backend, using either Visual Studio on Windows, or VS Code on OS X. Follow the main description of how to start Magic using [the following tutorial](https://polterguy.github.io/tutorials/getting-started/). This ensures that the getting started guide is accurate, according to the current release.
5. Run through the setup process of Magic, by following the wizard you are given as you [open the URL](http://localhost:4200), which is where the frontend of Magic can be found after starting Magic.
6. Go to the _"Crudify"_ menu item, and choose your _"magic"_ database, then choose _"All tables"_, and click the crudify button.
7. Click the _"Home"_ menu item, and verify the _"backend version"_ number is correct according to the upcoming new release that is to be created.

You have now setup Magic, and you can perform the individual component tests.

## Audit logging

1. Go to the _"Logs"_ menu item, and verify there exists log items created during installation of Magic.
2. Filter, and verify the visible entries changes according to your filter condition.
3. Enable _"Live polling"_.
4. Open the _"Evaluator"_ in another browser tab, and type in `log.info:foo bar`, evaluate, and go back to the logs tab, and verify the item you just logged shows up *without* having to refresh the page.
5. Click the _"Delete all items"_ button, and verify that all log items are deleted.

## Crypto

1. Open the _"Crypto"_ menu item, create a server key pair, by providing 2048 as strength. Make sure the server public key's fingerprint and public key itself is populated when it's done creating its server key pair.
2. Copy the server public key, and scroll down - Click the _"Import ..."_ button, and paste in the public key into the _"Key"_ textarea. Ensure the fingerprint is automatically populated, and that it's the same value as the server's public key's fingerprint. Provide a name, an email address, and type `localhost:55247` into the _"Domain"_, and click _"Save"_.
3. Open the _"Evaluator"_ and click the _"Load"_ button. Filter on _"magic"_ and choose the _"magic.crypto.http.eval.idempotent"_ snippet. Execute it, and verify that you get an *error* as you do this. This is because the `log.info` slot has not been enabled for the publick key. Open your logs, and verify that you have 4 new errors in your server log.
4. Go back to the _"Crypto"_ menu item, edit the public key entry you imported previously, and add `log.info` as a new line at the bottom, before you save the key entry.
5. Repeat step 3, but verify that you did *not* get an error this time.
6. Open your _"Logs"_ menu item, and verify you can find _"Howdy world"_ at the top, and not additional log entries.
7. Open the _"Crypto"_ menu item again, and verify you can find *exactly one* crypttographically signed invocation, matching the public key you imported in the previous step(s).
8. Click the _"a-unique-id-here"_ and verify you can see the base64 encoded signed payload instead of its Hyperlambda under the _"Payload"_ column.
9. Click the _"Key"_ (subject) parts of your cryptographically signed invocation, and verify you get the key up in _"read only mode"_, not showing the vocabulary, and not allowing you to save or change any of the key's settings.
10. Click the key in the above table, in the same window as the _"Import ..."_ button, and disable the key by unchecking the _"Enabled"_ checkbox.
11. Repeat step 3, but change the **[.request-id]** value to for instance _"foo-bar"_ before you evaluate the Hyperlambda. This should *not* work because the key has now been disabled. Open the _"Crypto"_ menu item in a different browser tab, and enable the key again, by editing it, and checking the _"Enabled"_ checkbox.
12. *Without* changing your Hyperlambda at all, simply re-evaluate it, and verify it's working now, returning 200 as status code in the bottom CodeMirror editor.
13. Go back to the _"Crypto"_ menu item, and create a *new* key - This time with 4096 as your key strength. Verify the public key is roughly twice as large after it's done executing, and that it requires *more* time than creating a 2048 key, which you did in the above step.
14. Open the _"Files"_ menu item, open the path _"/modules/system/crypto/keys/"_ and verify you have *4 files* in this folder. Two of the files should be your default key pair. The other files should have long names, containing the fingerprint of your key, and be your old backed up key pair. All files should end with the extension of _".key"_.
15. Repeat step 3 above, but provide a unique **[.request-id]** this time. Make sure it *fails* as you evaluate the Hyperlambda.
16. Repeat step 2 from above, now with your newly created 4096 server public key, but open the _"Crypto"_ menu item in a different tab, to be able to keep your Hyperlambda in your existing _"Evaluator"_ menu item.
17. Re-evaluate your Hyperlambda in your _"Evaluator"_ browser tab, and make sure it *works* now.
18. Go back to your _"Crypto"_ menu item, and verify you have two different keys in your _"Cryptographically signed invocations"_ now, and that you can filter on different keys, which should only show invocations from the key you have filtered on.
19. Click _"Clear filter"_ and verify the total number of invocations are now 4 - Not more, not fewer.
20. Delete one of your keys, and make sure you're left with only *one* key and *two* invocations afterwards. Also make sure you *cannot* filter according to the key you just deleted.
21. Create a new server key, copy its content, and go to _"Endpoints"_ and show system endpoints. Filter for _"import"_ and paste in the public key and *remove* the _"domain"_ parts of the payload. Import the key, and verify it works.
22. Go to the evaluator and evaluate the _"magic.crypto.http.eval"_ and verify that *it fails*. Go back to crypto and enable the key you just imported, set its domain to `localhost:55247` , execute the evaluator's Hyperlambda again, and verify *it works* now.

## SQL

1. Open the _"SQL"_ menu item.
2. Select the _"babelfish.sql"_ saved file, execute it, and verify there are no errors showing up during execution.
3. Verify that the _"babelfish"_ database automatically pops up in the _"Select database dropdown"_, *without* you having to refresh the page.
4. Type in `select * from languages` into the CodeMirror SQL editor and execute the SQL. Verify you get 5 items in the result afterwards.
5. Click the _"Save"_ button, supply a name, and make sure you find the filename in the _"Select saved file"_ afterwards. This ensures that users can create SQL snippets, that they store for later use.
6. Select a database type you *do not have* on your current machine, make sure the Ajax spinner is showing, and that it takes a long time to execute, and that you get an error that makes sense when it finally finishes.
7. Make sure you selected the _"magic"_ database in the _"Select database"_ dropdown, and paste in the following into the SQL CodeMirror editor `select * from magic_version`. Verify it returns one column, with one row, being the same value as the _"backend version"_ number you get on the main landing page of Magic, as you click the _"Home"_ menu item. This ensures that the database version is the same as the backend version, and will be used in future releases to create database migration scripts, etc.

## License

1. Open the _"Home"_ link, paste in a valid license key into the _"Licence"_ textarea, and click _"Save"_. After some few seconds, the main landing page should turn green, and display the correct license information. You can find a valid test license in the _"magic.signals"_ project's repository.

## Crudifier/Endpoints

1. Open the _"Crudify"_ menu item.
2. Select the _"babelfish"_ database, select _"All tables"_, and click _"Crudify all"_.
3. Click _"Crudify all"_ once more, and verify you get an error about _"module already exists"_.
4. Select the _"languages"_ table, and make sure you check of the _"overwrite"_ checkbox.
5. Scroll down, and create a log entry for the _"get"_ verb, by adding `foo bar` into the textbox beneath the _"Log entry"_ column. *Remove* the _"Authorization"_ parts of the get/read endpoint. Scroll to the top, and click _"Crudify selected table"_.
6. Open your _"Endpoints"_ menu item, and filter for _"languages".
7. Select the _"get/read"_ endpoint, and click the invoke button (flash icon).
8. Open your _"Logs"_ menu item, and make sure you can find _"foo bar"_ at the top.
9. Repeat step 6, but add a _"limit"_ argument, and set its value to _"1"_. Reinvoke, and verify you can find another log item in your log - But this time containing the argument(s) you passed in as you invoked the endpoint.
10. Repeat step 6, but add the following as query parameters `order=locale&direction=asc`. Invoke and exchange the _"asc"_ parts of your argument with _"desc"_ (descending) and re-evaluate the endpoint, and verify the ordering of the result is now changed.
11. Click the _"locale.eq"_ button, and set its value to _"en"_. Evaluate the endpoint, and verify *only* _"English"_ is returned this time.
12. Exchange the entire query parameter with _"order=locale&direction=asc&locale.like=e%"_ and re-evaluate the endpoint. Verify both Spanish and English is returned now.
13. Select the _"post"_ endpoint, and invoke it with locale being `jp` and language being `Japanese`. Re-evaluate the read/get endpoint afterwards *without* query parameters, and verify it correctly inserted Japanese into your database.
14. Create a _"Custom SQL"_ endpoint, and paste in the following SQL `select * from users u inner join users_roles ur on u.username = ur.user`. Remove all arguments, and make sure you configure it as a get verb type of endpoint. Name your endpoint foo, and click _"Create endpoint"_. Go to your endpoints, and evaluate the endpoint, and verify it returns one record with 4 columns. Make sure you _"Show system endpoints"_ as you try to find your endpoint.

## Scaffolder/Endpoints

1. Open the _"Endpoints"_ menu item.
2. Type _"foo"_ into the _"Name of your app"_ textbox.
3. Select the _"angular-dark"_ template, and click _"Generate"_. After some few seconds, you should be given a zip file named _"foo.zip"_.
4. Unzip the zip file, and open the folder where you unzipped it in VS Code.
5. Invoke `npm link` in a terminal window, and then `ng serve --port 4201` afterwards.
6. Browse to [the following URL](http://localhost:4201).
7. Verify you can find the _"Languages"_ menu item, *without* having to log in, and that it works and returns all languages in your database.
8. Login with your root account, and verify you can immediately find several additional menu items.
9. Click the _"Auth"_ menu item and create a user, then create a role and associate the newmly created user with the newly created role. Then delete the newly created user. Verify you do *not* get any errors in your browser console/developer-tools window.
10. Verify you *cannot* delete the _"root"_ user, or in any ways edit it or modify it.
11. Change your root user's password in the _"Profile"_ menu item. Log out and log in again, and make sure you can login with your new password.
12. Repeat this entire section with the _"angular-default"_ template, and name your app _"foo2"_.
13. Toggle the _"Show system endpoints"_ slider, and verify you get roughly 100 endpoints, contrary to roughly 10 previously.
14. Filter on _"ping"_, click ping endpoint, and verify it's got a description in the top right corner.
15. Filter on _"translations"_. Choose the post endpoint, and create a _"foo/en/howdy"_ entry. Make sure the entry can be found afterwards when invoking the get endpoint.

## Tasks

1. Open the _"Tasks"_ menu item.
2. Create a new task, give it a name and a description, and add `log.info:Hello from task` as its Hyperlambda.
3. Select the task, and click the _"Schedule"_ button. Choose a _"Repeat"_ type of pattern, and type in `5.seconds` as its value. Click _"Save"_ and wait some few seconds. Open the _"Logs"_ menu item in another browser, and verify you have at least one _"Hello from task"_ item there. Delete the schedule by clicking the trashcan icon, open your Logs menu item again, delete all log items, and wait some few seconds. Verify you *do not* have any _"Hello from task"_ items there now. Not even after 10-20 seconds.
4. Click the _"Execute"_ button on the task, and verify you have *one* new log item.
5. Update the task's log entry to become _"foo bar"_, save the task, execute the task, and verify you have the correct log item now created.
6. Delete the task, verify you don't have any console errors, and that the editor for the task vanishes.

## Files

1. Open the _"Files"_ menu item.
2. Click the _"misc"_ folder, and download the _"README.md"_ file. Open it in notepad, and verify it looks correct.
3. Turn off _"Safe mode"_ and upload some file, use a file with _"funny filenames"_ containing e.g. `(` or something similar, to verify filenames are correctly handled by the files module. Download the file again, and verify it's not been corrupted in any ways. Make sure you upload a *binary* file, such as a PDF file etc - And make sure the file can be downloaded again, and has not been corrupted - And that you can open it using your default editor for the file type.
4. Click _"New file"_  and give your file the name of _"foo.md"_. Click the newly created file, and verify you can edit it. Type in some text content, and click _"Save"_.
5. Delete the file *without* closing the editor, and verify the file is deleted, and no console errors occurs.
6. Create a new folder, open the folder, go back up again, and delete the folder. Make sure you don't get any console errors in the process.

## Evaluator

1. Open the _"Evaluator"_ menu item.
2. Click the _"I"_ icon and try loading some few documentation snippets, by choosing a module in the _"Select module"_ dropdown.
3. Make sure that *all* the keyboard shortcuts are working, in *both* operating systems.
4. Load the snippet called _"http.get"_, execute it, and verify it's returning some JSON from the endpoint.

## Users

1. Open up the _"Users"_ menu item.
2. Verify that the root user *cannot* be edited.
3. Create a new user with an empty password, and verify that it *fails*.
4. Create a new user with a password, and verify it works.
5. Associate some roles with the newly created user, and verify it works.
6. Delete one of the role associations, and verify it works.
7. Delete the user and verify it works.

## Roles

1. Open up the _"Roles"_ menu item.
2. Verify that the _"root"_ role *cannot* be deleted.
3. Create a new role, without a description, and verify it works.
4. Create a new role *with* a description, and verify it works.
5. Delete one of the newly created roles, and verify it works.

## Create release

You can now create a release of the main Magic project.
