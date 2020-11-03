
# Quality Assurance Document

This document describes the process required to execute *before* every single release of Magic,
after all code changes have been applied. If a code change is required to fix a bug, the *entire*
process should be restarted, to ensure the quality of Magic's release.

The way it is to be executed, is by following the steps below. These steps are to be performed *both*
on an OS X system, and on a Windows system. Hence, the entire description of the process should be
done twice. The Windows machine should have SQL Server and Visual Studio installed, and the OS X
machine should use MySQL as its database adapter, and VS Code as its IDE. As you perform these tests,
make sure you have your Google Chrome _"developer"_ tools running, such that you can see errors in
the console, in case an error occurs that is for some reasons silently swallowed by the system.
The tests must be performed in the order they're given in this document, since some of these tests,
relies upon the result from previously executed tests.

## Setup magic

1. Drop your _"magic"_ database using either MySQL Workbench or Microsoft SQL Server Management Studio, depending upon which operating system you are on. This ensures that you start out with the same pre-requisistes as a new user just having downloaded Magic.
2. Download Magic by choosing the _"Code/Download ZIP"_ at the [main GitHub project site](https://github.com/polterguy/magic). This ensures you're using the exact same code as is currently in the repository, and that no GIT ignored files in your repository is interfering with the test in any ways.
3. Unzip the file you are given.
4. Start Magic, both the frontend and the backend, using wither Visual Studio on Windows, or VS Code on OS X. Follow the main description of how to start Magic using [the following tutorial](https://polterguy.github.io/tutorials/getting-started/). This ensures that the getting started guide is accurate, according to the current release.
5. Run through the setup process of Magic, by following the wizard you are given as you [open the URL](http://localhost:4200), which is where the frontend of Magic can be found after starting Magic.
6. Go to the _"Crudify"_ menu item, and choose your _"magic"_ database, then choose _"All tables"_, and click the crudify button.

You have now setup Magic, and you can perform the user tests. These tests should also be performed with both
a Windows machine, and an OS X machine, to ensure Magic is as portable as possible.

## Audit logging

1. Go to the _"Logs"_ menu item, and verify there exists log items created during installation of Magic.
2. Filter, and verify the visible entries changes according to your filter condition.
3. Enable _"Live polling"_.
4. Open the _"Evaluator"_ in another browser tab, and type in `log.info:foo bar`, evaluate, and go back to the logs tab, and verify the item you just logged shows up *without* having to refresh the page.
5. Click the _"Delete all items"_ button, and verify that all log items are deleted.

## Crypto tests

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

## SQL tests

1. Open the _"SQL"_ menu item.
2. Select the _"babelfish.sql"_ saved file, execute it, and verify there are no errors showing up during execution.
3. Verify that the _"babelfish"_ database automatically pops up in the _"Select database dropdown"_, *without* you having to refresh the page.
4. Type in `select * from languages` into the CodeMirror SQL editor and execute the SQL. Verify you get 5 items in the result afterwards.
5. Click the _"Save"_ button, supply a name, and make sure you find the filename in the _"Select saved file"_ afterwards. This ensures that users can create SQL snippets, that they store for later use.
6. Select a database type you *do not have* on your current machine, make sure the Ajax spinner is showing, and that it takes a long time to execute, and that you get an error that makes sense when it finally finishes.


