#!/bin/sh
# Magic Cloud - DigitalOcean droplet entrypoint.
#
# Overwrites image-shipped content in the persistent /magic/files/etc volume
# on every container start (overwrite ONLY - nothing is ever deleted, so
# user-created files in www survive), then hands over to the normal backend.
#
# Overwritten from the image on every start:
#   - /magic/files/etc/www     (compiled dashboard)
#
# Not volumes, so automatically fresh from the image on every upgrade:
#   - /magic/files/system      (system endpoints)
#   - /magic/files/misc
#
# Never touched (persists across upgrades):
#   - /magic/files/data        (SQLite databases, uploads)
#   - /magic/files/config      (appsettings.json with rotated JWT secret)
#   - /magic/files/modules     (installed modules)
#   - everything else in /magic/files/etc (user snippets, user files in www)
set -e

# Refresh the compiled dashboard (pristine payload -> persistent volume).
mkdir -p /magic/files/etc/www
cp -rf /magic/do-payload/www/. /magic/files/etc/www/

# Declares that www holds the dashboard. Installing a frontend plugin unzips
# over this folder, so the backend refuses that while the marker is there -
# deployments serving the dashboard from somewhere else never write it, and
# frontends install freely.
touch /magic/files/etc/www/.dashboard

exec dotnet backend.dll
