# Deploy Magic Cloud to DigitalOcean

Magic deploys to a **single DigitalOcean droplet** as **one container**: the backend
serves the compiled Angular frontend itself, so no separate frontend service or
nginx is needed. All user data is stored in persistent Docker volumes that survive
upgrades and reboots.

## What Gets Deployed

- **One droplet** running one Docker container (frontend + backend together)
- **Frontend:** Angular UI, compiled during the image build and served by the
  Magic backend from `/magic/files/etc/www/`
- **Backend:** ASP.NET Core API running Magic on port 4444 (exposed on port 80)
- **Internal Database:** SQLite, automatically created at `/magic/files/data/magic.db`
- **Persistent storage:** four named Docker volumes, the same ones used by the
  repository's `docker-compose.yml`:

| Volume | Mount path | Contents |
|---|---|---|
| `magic_files_data` | `/magic/files/data` | Databases (`magic.db`, etc.), uploaded files |
| `magic_files_config` | `/magic/files/config` | `appsettings.json`, including your rotated JWT secret |
| `magic_files_modules` | `/magic/files/modules` | Installed modules |
| `magic_files_etc` | `/magic/files/etc` | Your snippets and files |

The frontend (`etc/www`) and system files (`etc/system`) are refreshed from the
new image on every container start, so upgrades apply cleanly — everything else
in the volumes is never touched.

## Step 1: Create the Droplet

1. In the DigitalOcean dashboard, choose **Create → Droplets**
2. Pick **Ubuntu 24.04**, a plan with **at least 2 GB RAM**, and your region
3. Under **Advanced Options / User Data**, paste the entire contents of
   [`.do/cloud-init.yaml`](../.do/cloud-init.yaml) from this repository
4. Create the droplet

The user-data script installs Docker, clones this repository, builds the
all-in-one image, and starts it with the four volumes above. **First boot takes
roughly 10–15 minutes** (the Docker build runs during it). You can watch
progress via SSH: `tail -f /var/log/cloud-init-output.log`.

## Step 2: Log In and Run the Setup Wizard

Browse to `http://[droplet-ip]/` and log in:

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
docker run -d --name magic --restart unless-stopped -p 80:4444 \
  -v magic_files_etc:/magic/files/etc \
  -v magic_files_data:/magic/files/data \
  -v magic_files_config:/magic/files/config \
  -v magic_files_modules:/magic/files/modules \
  magic
```

The volumes are reused, so all data persists; the frontend and system files are
refreshed from the new image automatically at startup.

## HTTPS

The droplet serves plain HTTP on port 80. For production use, put it behind TLS
— e.g. a DigitalOcean Load Balancer with a managed certificate, or your own
reverse proxy (Caddy/nginx with Let's Encrypt) on the same droplet.

## Additional Databases (Optional)

Besides the internal SQLite database, Magic can connect to external databases
(SQLite, MySQL, PostgreSQL, Microsoft SQL Server). Configure connections in the
frontend UI.

## Cost

- Droplet (1 vCPU / 2 GB): ~$12/month
- Optional droplet backups: +20%
- Optional block storage volume for extra capacity: from $10/month

## A Note on App Platform

This repository also contains an App Platform template
(`.do/deploy.template.yaml`) wired to the "Deploy to DigitalOcean" button. Be
aware that **App Platform does not support persistent volumes** — its
filesystem is ephemeral, so databases, configuration, and modules are lost on
every redeploy. It is usable as a throwaway demo only. The droplet flow above
is the supported persistent deployment.

## Pricing: Hyperlambda Generator

The AI-powered code generator is **currently free**. Future pricing will be
**$49 per 1,000 requests**. No payment wall today — use it freely.

## Support

- Issues: GitHub Issues
- Security: See [SECURITY.md](../SECURITY.md)
- Questions: Check the [main README](../README.md)
