# Deploy Magic Cloud to DigitalOcean

## Quick Start

**[Deploy to DigitalOcean](https://cloud.digitalocean.com/apps/new?repo=thomashansen/magic/tree/master)**

Once deployed, Magic will be live at `https://[your-app-name].ondigitalocean.app` within 2–3 minutes.

## What Gets Deployed

- **Frontend:** Angular UI served by nginx
- **Backend:** ASP.NET Core API running Magic
- **Persistent Storage:** `/magic/files/data/` mounted to DigitalOcean block storage
- **Internal Database:** SQLite database automatically created at `/magic/files/data/magic.db`

## Initial Login

Magic starts with:
- **Username:** `root`
- **Password:** `root`

Navigate to `https://[your-app-name].ondigitalocean.app` and log in. The frontend will load a setup wizard to guide you through configuration.

## What the Setup Wizard Does

The frontend automatically loads configuration UI when you first log in. It will prompt you to:
- Change your root password
- Configure OpenAI API key (optional, for AI features)
- Set up additional database connections (optional)
- Configure other system settings

Follow the UI prompts in the frontend.

## Internal Database

Magic automatically creates `magic.db` (SQLite) for:
- User accounts and permissions
- System configuration
- Logs and audit trails
- Workflows and tasks
- Application metadata

This database persists in `/magic/files/data/magic.db` across redeploys.

## Additional Databases (Optional)

You can connect Magic to external databases:
- SQLite (additional databases in `/magic/files/data/`)
- MySQL
- PostgreSQL
- Microsoft SQL Server

Use the frontend UI to configure external database connections.

## Cost

**DigitalOcean Infrastructure:**
- Backend service: ~$5/month (512MB RAM, auto-scaling)
- Storage: included up to 100GB
- Upgrade to larger tiers as needed from the DigitalOcean dashboard

Optionally add managed databases (MySQL, PostgreSQL) for ~$15/month or more.

## Persistent Storage

Your data lives in `/magic/files/data/`:
- Internal SQLite database (`magic.db`)
- Additional SQLite databases you create
- Uploaded files
- Configuration files

This directory is mounted to DigitalOcean block storage and persists across redeploys. Deleting the app deletes the volume — download backups if needed.

## Updating Magic

Push to your repo's `main` branch:

```bash
git push origin main
```

DigitalOcean automatically rebuilds and redeploys. Downtime is typically < 1 minute.

## Troubleshooting

### App won't start
- Check app logs in DigitalOcean dashboard
- Ensure `magic:auth:secret` is set (DigitalOcean does this automatically)
- Try upgrading to a larger app tier if out of memory

### Files/databases disappearing after restart
- Ensure the volume is mounted at `/magic/files/data`
- Check DigitalOcean dashboard → Volumes tab

### HTTPS certificate error
- Wait 5–10 minutes after first deploy for certificate provisioning
- DigitalOcean renews automatically

## Custom Domain

1. In DigitalOcean dashboard, go to Domains
2. Add your domain (e.g., `myai.com`)
3. Point its nameservers to DigitalOcean
4. In App Settings → Domains, add your domain
5. DigitalOcean provisions a free SSL certificate

## Pricing: Hyperlambda Generator

The AI-powered code generator is **currently free**. Future pricing will be **$49 per 1,000 requests**. No payment wall today — use it freely.

## Support

- Issues: GitHub Issues
- Security: See [SECURITY.md](../SECURITY.md)
- Questions: Check the [main README](../README.md)
