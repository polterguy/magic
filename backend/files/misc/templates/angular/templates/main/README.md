
# A ServerGardens.Com generated app

This application was automatically generated with [Magic](https://polterguy.github.io/), and was based upon the
[generator-ngx-rocket Angular starter-kit](https://github.com/ngx-rocket/generator-ngx-rocket).
It features easy translation into your language(s) of choice, and provides a default starter-kit for your CRUD
apps. Please see the ngx-rocket project's project page for how to modify it according to your needs. Feel free
to modify this page as you see fit. Notice, to create _"an app"_ out of this website, just click the
bookmark button on your phone, and choose _"Add to home screen"_, and it will behave more or less exactly like
a native app, as long as the user has an internet connection. In the _"helpers"_</em>_ folder you can find
several helper components, allowing you to change any aspect of your entity fields, to for instance provide
file upload, image capturing, etc. These are as follows.

* __magic-autocomplete__ - Helps you when creating new entities when a field in your entity is referencing another field in another table. Useful for larger datasets.
* __magic-file__ - Helps you when creating new entities when a field in your entity should be wrapping a file physically on disc in your backend, as in uploading files and associate these with data entities.
* __magic-file-view__ - Helps you when viewing an entity and downloading an associated file when a field is wrapping a physical file.
* __magic-filter__ - Helps you create filtering controls when a field in an item is referencing another field in another table.
* __magic-image__ - Same as the magic-file, except it allows you to upload images specifically, and will automatically resize your images if you want it to.
* __magic-image-view__ - The equivalent of the magic-file component, except it will display images inline on your form.
* __magic-selector__ - The same as magic-autocomplete but will create a select dropdown list instead of an autocompleter and hence is more useful for smaller datasets.

All of the above custom components are fairly well documented in the TypeScript files, and you can easily include them 
as you see fit in your own applications. Besides from the above special components, everything in this template is
plain and standard Angular components, besides the occassional 3rd party component, used to for instance allow
the user to pick a date and time, etc. The latter are open source libraries you can find documentation for if
you search for your component's name.

This project also contains a _"docker-compose.yml"_ file, that allows you to automatically deploy
your Angular project onto a server where you have previously installed Magic. It shares the same Docker proxy
network, and will therefor automatically install an SSL certificate, and create an nGinx proxy. Assuming you
filled out the _"API URL"_ and the _"Deployment domain"_ correctly as you scaffolded your result,
the project should be easily deployed on to a Magic server of your choice, without having to do any changes
to it at all.
The project supports automatic authentication and authorisation, and will only display components and verbs for
such to user actually having access to these. All CRUD components can be found in the _"components"_ folder,
and these are simply Angular Material tables, and you can modify these as you see fit. All create/edit modal
dialogs can be found inside of the component folders in a _"modal"_ folder.

## Start your app locally

1. Open a terminal window in this folder
2. Execute `npm link`
3. Execute `ng serve --port 4202`
4. Open a browser window at [localhost:4202](http://localhost:4202)

## Installing app to a VPS

1. Copy zip file containing your entire app to your VPS using e.g. `scp`
2. Unzip content on server
3. Open folder where unzipped content is
4. Execute `docker-compose up -d` - Assuming you've got Docker installed on your VPS and Magic running on the same server

* [Read more about Magic here](https://servergardens.com)

