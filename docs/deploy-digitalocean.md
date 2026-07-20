# Deploy Magic Cloud to DigitalOcean

This guide walks you through deploying Magic Cloud to DigitalOcean App Platform with one click, including automatic HTTPS, database management, and persistent storage.

## Quick Start

Click the button below to deploy Magic Cloud directly to DigitalOcean:

[![Deploy to DigitalOcean](https://www.deploytom.com/d2018eb/deploy-button-svg/blob/main/img/deploy-to-digitalocean-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=thomashansen/magic/tree/main)

Once deployed, Magic will be live at `https://[your-app-name].ondigitalocean.app` within 2–3 minutes.

## What You Get

- **Managed PostgreSQL Database** — automatically provisioned and connected
- **Auto HTTPS** — all traffic encrypted, renewed automatically
- **Persistent Storage** — databases and uploaded files persist across redeploys
- **Auto-Scaling** — upgrade to higher tier if needed from DigitalOcean dashboard
- **CI/CD Integration** — push to `main` branch = automatic redeploy

## After Deployment

### 1. Initial Login

Magic starts with **default credentials** (for evaluation only):
- **Username:** `root`
- **Password:** `root`

**⚠️ CRITICAL:** Change your password immediately in production.

Navigate to `https://[your-app-name].ondigitalocean.app/openai/chat.post.hl` and log in.

### 2. Change Your Password

Once logged in:
1. Go to **System Settings** → **Users**
2. Select the `root` user
3. Click **Change Password**
4. Choose a strong password

### 3. Configure OpenAI (Optional)

To enable AI chatbot features:
1. Navigate to **System Settings** → **OpenAI Configuration**
2. Enter your OpenAI API key (get one at https://platform.openai.com/api-keys)
3. Select your preferred model (e.g., `gpt-4-turbo`)
4. Save

### 4. Create Your First Chatbot

Navigate to **Chatbots** and click **Create New**. Within minutes you'll have a live AI assistant configured for your data.

## Cost

**Default tier:**
- Backend service: ~$5/month (512MB RAM, auto-scaling)
- PostgreSQL database: ~$15/month (basic tier)
- Storage: included up to 100GB
- **Total: ~$20/month**

To reduce costs, you can:
- Downgrade to a smaller app tier ($0/month for basic, but limited)
- Use SQLite instead of PostgreSQL (no database charge, but single-instance only)

Upgrade from the DigitalOcean dashboard if you need more capacity.

## Persistent Storage

Your data lives in `/magic/files/data/`:
- **Databases** (SQLite and PostgreSQL)
- **Uploaded files** (documents for RAG, configurations, workflows)
- **User data** (chatbot sessions, logs)

This directory is mounted to DigitalOcean's managed block storage and **persists across redeploys**. Deleting the app deletes the volume — download backups if needed.

## Updating Magic

Push to your repo's `main` branch:

```bash
git push origin main
```

DigitalOcean automatically rebuilds and redeploys. Downtime is typically < 1 minute.

## Troubleshooting

### App won't start
- Check **Logs** in DigitalOcean dashboard (click app → Logs)
- Ensure `magic:auth:secret` is set (DigitalOcean does this automatically)
- Common issue: insufficient memory — upgrade to "Medium" tier

### Database won't connect
- Ensure PostgreSQL is "Running" (DigitalOcean dashboard → Databases)
- Check environment variables are injected correctly (dashboard → App Spec)

### HTTPS certificate error
- Wait 5–10 minutes after first deploy for certificate to provisioning
- DigitalOcean renews automatically; you don't need to do anything

### Files/databases disappearing after restart
- Ensure volume is mounted at `/magic/files/data`
- Check DigitalOcean dashboard → Volumes tab

## Advanced: Custom Domain

1. In DigitalOcean dashboard, go to **Domains**
2. Add your domain (e.g., `myai.com`)
3. Point its nameservers to DigitalOcean
4. In App Settings → Domains, add `myai.com`
5. DigitalOcean provisions a free SSL certificate

## Next Steps

- **Invite team members:** System Settings → Users
- **Connect your data:** System Settings → Databases → Link External Database
- **Customize the chatbot:** Chatbots → Settings → System Message
- **Set up workflows:** Tasks → Create Workflow for automated actions

## Support & Issues

- **Security Concerns?** See [SECURITY.md](../SECURITY.md)
- **Feature Requests?** GitHub Issues
- **Questions?** Check the [main README](../README.md)

---

**Happy deploying!** 🚀
