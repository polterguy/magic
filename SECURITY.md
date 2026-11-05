# Security Policy

## Reporting a vulnerability

Please report a vulnerability privately, and not in a public issue or pull request.

- Email **team@ainiro.io**, or
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

## Verifying a release

From the first release after this was added, the Docker images `servergardens/magic-backend`, `servergardens/magic-frontend`
and `servergardens/magic-aio` are signed by the release workflow of this repository, and carry a software bill of materials
(CycloneDX) as a signed attestation. Signing is keyless, so there is no key to trust, only the identity of the workflow,
recorded in the public [Sigstore](https://www.sigstore.dev/) transparency log.

To check an image with [cosign](https://docs.sigstore.dev/cosign/installation/), use its tag or digest:

```bash
cosign verify servergardens/magic-aio:v24.4.0 \
  --certificate-identity-regexp "https://github.com/polterguy/magic/.github/workflows/create-release.yml@.*" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

To read its software bill of materials:

```bash
cosign verify-attestation servergardens/magic-aio:v24.4.0 --type cyclonedx \
  --certificate-identity-regexp "https://github.com/polterguy/magic/.github/workflows/create-release.yml@.*" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

Each version also has a GitHub release with the deployment zip, a cosign signature for it, and the SBOMs of the images.
To check the zip:

```bash
cosign verify-blob magic-<version>.zip --bundle magic-<version>.zip.sigstore.json \
  --certificate-identity-regexp "https://github.com/polterguy/magic/.github/workflows/create-release.yml@.*" \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com
```

The images are signed from v24.4.0, and the GitHub release with the signed zip starts with the version after it. Earlier releases are not signed.

## Good-faith research

If you act in good faith, stay within your own installation or a test account, and give me reasonable time to fix a problem before you disclose it, I will not pursue any action against you.

The same contact is published for tools at [hyperlambda.dev/.well-known/security.txt](https://hyperlambda.dev/.well-known/security.txt).
