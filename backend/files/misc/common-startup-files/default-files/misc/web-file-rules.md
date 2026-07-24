# INFO; Web file rules

## Rules

1. Magic serves frontend files from `/etc/www/`.
2. When generating new frontend HTML, CSS, or JavaScript files, use `create-file`. For small changes to an existing file, use `patch-file` instead — the cache-busting `v` bump below is a typical patch-sized edit.
3. Do not save files directly in `/etc/www/` unless the user explicitly confirms that is OK. Prefer subfolders.
4. Files saved under `/etc/www/` are served from web root `/`, not from `/etc/www/` in the URL.
5. When updating CSS or JavaScript referenced by HTML, add a cache-busting query parameter named `v`, such as `app.js?v=SOME_VALUE` or `app.css?v=SOME_VALUE`.
6. Change the `v` value every time the CSS or JavaScript file changes.
