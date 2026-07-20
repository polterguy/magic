# Deploy Magic Cloud to DigitalOcean

Magic deploys to a **single DigitalOcean droplet** as **one container**: the backend
serves the compiled Angular frontend itself, so no separate frontend service or
nginx is needed. All user data is stored in persistent Docker volumes that survive
upgrades and reboots.

## What Gets Deployed

- **One droplet** running one Docker container (frontend + backend together)
- **Frontend:** Angular UI, compiled during the image build and served by the
  Magic backend from `/magic/files/etc/www/`
- **Backend:** ASP.NET Core API running Magic on port 4444 (not publicly exposed)
- **TLS:** Caddy reverse proxy on ports 80/443 with automatic Let's Encrypt
  certificates for your domain (issued and renewed automatically, stored in
  persistent volumes)
- **Internal Database:** SQLite, automatically created at `/magic/files/data/magic.db`
- **Persistent storage:** four named Docker volumes, the same ones used by the
  repository's `docker-compose.yml`:

| Volume | Mount path | Contents |
|---|---|---|
| `magic_files_data` | `/magic/files/data` | Databases (`magic.db`, etc.), uploaded files |
| `magic_files_config` | `/magic/files/config` | `appsettings.json`, including your rotated JWT secret |
| `magic_files_modules` | `/magic/files/modules` | Installed modules |
| `magic_files_etc` | `/magic/files/etc` | Your snippets and files |

Content rules on every container start:

- **`/magic/files/etc/www`** (the frontend) is *overwritten* from the new image —
  overwrite only, user-created web files are never deleted
- **`/magic/files/system`** and **`/magic/files/misc`** belong to the platform:
  they are not volumes, so every upgraded container starts with fresh ones
- **Everything else** (data, config, modules, rest of etc) is copied from the
  image only if missing — if it exists, it is never touched

## Step 1: Create the Droplet

**[Create your droplet](https://cloud.digitalocean.com/droplets/new)**

1. Pick **Ubuntu 24.04**, a plan with **at least 2 GB RAM** — **4 GB is
   typically preferred** (faster builds, comfortable headroom for headless
   Chrome) — and your region
2. Under **Advanced Options / User Data**, paste the entire contents of
   [`.do/cloud-init.yaml`](../.do/cloud-init.yaml) **after editing its one
   `DOMAIN=` line** to the domain you will use
3. Create the droplet
4. Point your domain's **DNS A record** at the droplet's IP. Caddy retries
   certificate issuance automatically, so HTTPS comes up within minutes of
   DNS propagation

The user-data script creates a 4 GB swap file (the Angular production build
is OOM-killed without it on small droplets), installs Docker, clones this
repository, builds the all-in-one image, and starts it behind Caddy with the
four volumes above.

**First boot takes 15–20 minutes, and the site answers only when it is
done.** Most of that time is the Angular production build, which is slow by
nature. Until then the domain refuses connections (behind Cloudflare this
shows as a 521) — that is expected, not a failure. Watch progress via SSH:
`tail -f /var/log/cloud-init-output.log`.

## Step 2: Log In and Run the Setup Wizard

Browse to `https://your-domain/` and log in:

- **Username:** `root`
- **Password:** `root`

The frontend automatically loads the setup wizard, which lets you:

- Change your root password — at this point the system also replaces the
  default JWT secret with a freshly generated one, persisted to
  `/magic/files/config/appsettings.json`
- Configure your OpenAI API key (optional, for AI features)
- Set up additional database connections (optional)

Because `config` and `data` are persistent volumes, your new password, JWT
secret, and database survive reboots and upgrades.

## Upgrading Magic Later

SSH into the droplet and rebuild:

```bash
cd /opt/magic
git pull
docker build -f .do/Dockerfile.backend -t magic .
docker rm -f magic
docker run -d --name magic --restart unless-stopped --network magicnet \
  -v magic_files_etc:/magic/files/etc \
  -v magic_files_data:/magic/files/data \
  -v magic_files_config:/magic/files/config \
  -v magic_files_modules:/magic/files/modules \
  magic
```

The Caddy container keeps running untouched. The volumes are reused, so all
data persists; the new frontend is overwritten into `etc/www` at startup, and
`system`/`misc` come fresh from the new image.

## HTTPS

Handled automatically: the deployment starts a [Caddy](https://caddyserver.com)
reverse proxy that obtains and renews a free Let's Encrypt certificate for your
domain. Certificates live in persistent volumes (`caddy_data`, `caddy_config`),
so rebuilds and reboots don't trigger re-issuance. The only requirement is that
your domain's A record points at the droplet — Caddy handles everything else,
including redirecting HTTP to HTTPS.

## Additional Databases (Optional)

Besides the internal SQLite database, Magic can connect to external databases
(SQLite, MySQL, PostgreSQL, Microsoft SQL Server). Configure connections in the
frontend UI.

## Cost

- Droplet (1 vCPU / 2 GB): ~$12/month
- Droplet (2 vCPU / 4 GB, typically preferred): ~$24/month
- Optional droplet backups: +20%
- Optional block storage volume for extra capacity: from $10/month

## Pricing: Hyperlambda Generator

The AI-powered code generator is **currently free**. Future pricing will be
**$49 per 1,000 requests**. No payment wall today — use it freely.

## Support

- Issues: GitHub Issues
- Security: See [SECURITY.md](../SECURITY.md)
- Questions: Check the [main README](../README.md)
