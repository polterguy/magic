# Installing Magic Cloud for AI agents

This file is written for an AI coding agent setting Magic Cloud up on a user's behalf.
Follow it top to bottom. Every command is copy-pasteable.

Magic Cloud is a self-hosted backend platform. Its MCP server turns **every HTTP endpoint
in the user's own instance** into a tool, behind that user's own role-based access control.
There is no vendor-hosted endpoint and no npm or PyPI package — the server runs inside the
user's Magic instance, which you install below.

## Prerequisites

Docker. Nothing else. Do not install .NET or Node.js — the images are self-contained.

Verify:

```bash
docker --version
```

## Step 1 — Start Magic

Two containers, dashboard and backend:

```bash
curl -fsSL https://hyperlambda.dev/docker-compose.yaml | docker compose -f - up -d
```

* Dashboard: `http://localhost:5555`
* Backend and API: `http://localhost:4444`

Alternatively a single container, with the dashboard served at the root of the API port:

```bash
docker run -d -p 4444:4444 \
  -v magic_data:/magic/files/data \
  -v magic_config:/magic/files/config \
  -v magic_modules:/magic/files/modules \
  -v magic_etc:/magic/files/etc \
  servergardens/magic-aio:latest
```

The `mcp` and `oauth` modules ship inside the images, so there is nothing further to install
to get an MCP server. Use **named volumes** as shown — Docker populates an empty named volume
from the image, whereas an empty bind-mount would hide the shipped modules.

## Step 2 — Wait for readiness

`/magic/system/healthz` is public and checks that the database is reachable, not merely that
HTTP is up. Poll it rather than guessing at a sleep duration:

```bash
until curl -fsS http://localhost:4444/magic/system/healthz >/dev/null 2>&1; do sleep 2; done
echo "Magic is ready"
```

It returns `{"status":"ok"}` when healthy and HTTP 503 while the database is still unreachable.

## Step 3 — Complete first-run setup (do not skip)

**This step is security-critical.** Until setup completes, the backend runs with a placeholder
JWT secret, and `root`/`root` is hard-coded — anyone who can reach the port can sign in as root.

Ask the user to open `http://localhost:5555`, log in with `root` / `root`, and complete the
setup screen (their name, email, and a real password). This rotates the JWT secret and creates
their actual root account.

Do **not** invent a password on the user's behalf, and do **not** expose the port publicly
before this is done.

## Step 4 — Get a token

How you authenticate depends on whether the instance is reachable over HTTPS.

### Local install over HTTP — use a JWT

The MCP server advertises its OAuth metadata over `https://`, so the OAuth flow does not work
against a plain-HTTP `localhost` install. Authenticate directly instead, using the password the
user set in step 3:

```bash
curl -fsS "http://localhost:4444/magic/system/auth/authenticate?username=root&password=THEIR_PASSWORD"
```

That returns a JWT in a `ticket` field. Send it as `Authorization: Bearer <ticket>`.

Login attempts are rate-limited, so do not retry a failed password in a loop — ask the user.

### Public install over HTTPS — use OAuth

Once the instance is behind a real domain with TLS, the MCP server is a standard OAuth-protected
resource and MCP clients complete the flow on their own. An unauthenticated request returns:

```
401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://<host>/.well-known/oauth-protected-resource"
```

That 401 is correct behaviour, not a failure. Discovery metadata is served at
`/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server`, which
advertise dynamic client registration, PKCE (`S256`), `authorization_code` + `refresh_token`,
and the `mcp` scope. A compliant client needs no manual configuration beyond the server URL.

## Step 5 — Connect the MCP server

**Endpoint:** `POST <base-url>/magic/modules/mcp/mcp`
**Transport:** streamable HTTP (JSON-RPC 2.0, plain-JSON responses, no SSE)

For a local install, configure the client with:

```json
{
  "mcpServers": {
    "magic": {
      "url": "http://localhost:4444/magic/modules/mcp/mcp",
      "headers": { "Authorization": "Bearer YOUR_JWT_HERE" }
    }
  }
}
```

For a public HTTPS install, supply the URL alone and let the client run OAuth.

Verify the connection:

```bash
curl -fsS -X POST http://localhost:4444/magic/modules/mcp/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_HERE" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## What tools you get

Every dynamic endpoint under the instance's `modules/` folder, filtered by the roles of the
authenticated user. Two users on the same server legitimately see different tools, so there is
no fixed catalogue to cache — always call `tools/list` after connecting.

A fresh install exposes database, file, SQL, scheduled-task, headless-browser and Hyperlambda
code-generation tools. You can also create new endpoints on demand, and they become tools
immediately — Hyperlambda is executed, not compiled, so there is no build or restart step.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `401` with `WWW-Authenticate` | Expected when unauthenticated. Supply a JWT, or run OAuth over HTTPS. |
| `401` on a correct-looking password | Setup (step 3) may not be complete, or the throttle has tripped. Ask the user rather than retrying. |
| `tools/list` returns few or no tools | The JWT's role has access to few endpoints. Check the user's roles in the dashboard. |
| Connection refused on 4444 | Container still starting. Poll `/magic/system/healthz` as in step 2. |
| `modules/` looks empty | An empty bind-mount was used instead of a named volume, hiding the modules shipped in the image. |
| OAuth discovery fails on localhost | Expected — metadata is advertised over `https://`. Use a JWT locally. |

## Links

* Website — https://hyperlambda.dev
* Documentation — https://docs.ainiro.io
* MCP setup guide — https://docs.ainiro.io/tutorials/how-to-connect-the-mcp-server/
* Source (MIT) — https://github.com/polterguy/magic
