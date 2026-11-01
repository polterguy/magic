# Security Policy

## Reporting a vulnerability

Please report a vulnerability privately, and not in a public issue or pull request.

- Email **thomas@ainiro.io**, or
- use the **Report a vulnerability** button on the [Security tab](https://github.com/polterguy/magic/security/advisories/new) of this repository.

Include what you found, how to reproduce it, and the version or commit you tested against. A proof of concept helps, but a clear description is enough to start.

## What to expect

- I typically respond within 24 hours.
- You are told whether the report is accepted as a vulnerability, and what I intend to do about it.
- Fixes land in `master` and in the next release. Once a fix is released, the advisory is published, and you are credited if you want to be.
- I pay **$100** for each confirmed vulnerability, in addition to credit if you want it.

## Supported versions

Security fixes are made in `master` and released in the latest version. Older releases are not patched, so update to the latest release.

## Scope

In scope: the Magic Cloud runtime and its plugins, the Hyperlambda sandbox and its whitelist, authentication, authorization and the OAuth flows, the MCP server, and the Docker images built from this repository.

Out of scope: what a user with the `root` role can do by design, such as reading files and running code on their own server, and findings in third-party dependencies that do not affect this project. The state of dependency advisories, including the ones that are suppressed with a reason, is public at [hyperlambda.dev/health](https://hyperlambda.dev/health).

## Good-faith research

If you act in good faith, stay within your own installation or a test account, and give me reasonable time to fix a problem before you disclose it, I will not pursue any action against you.

The same contact is published for tools at [hyperlambda.dev/.well-known/security.txt](https://hyperlambda.dev/.well-known/security.txt).
