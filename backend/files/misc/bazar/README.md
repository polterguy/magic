
# Main Bazar folder

This folder contains your Bazar applications, and your Bazar manifest, specifically for apps
you have published yourself, that others can easily install into their Magic installation.
If you run the _"release-bazar"_ macro in Hyper IDE, this will package a Bazar app for you
automatically, and expose the application through your local Bazar, allowing others to download
the app and install it in their local Magic server.

**Notice** - This folder contains two files, one which might not exist unless you have explicitly
published your own Bazar apps.

* __apps.hl__ - This file is simply a helper file for Magic's main distribution, and can be deleted. It's the file that is downloaded from Magic's main GitHub repository containing your installable modules.
* __published.hl__ - This is the _"manifest"_ for Bazar apps your server has published, and contains one array entry for each app you choose to publish yourself.
