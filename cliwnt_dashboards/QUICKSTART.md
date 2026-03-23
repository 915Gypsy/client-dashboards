# Quick Start Guide

Get the TTPS Dashboard running on Vercel in 5 minutes.

## 1. Push to GitHub

```bash
cd client-dashboards
git init
git add .
git commit -m "TTPS Dashboard - Secure Airtable proxy"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 2. Connect to Vercel

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Vercel auto-detects the `package.json` and configures everything
5. Click "Deploy"

## 3. Set Environment Variables

After the first deploy, go to your Vercel project:

1. Settings → Environment Variables
2. Add three variables:
   - `AIRTABLE_PAT` = your actual Airtable PAT
   - `AIRTABLE_BASE_ID` = app538Eaxu63wcZUR
   - `AIRTABLE_TABLE_ID` = tbl7ANcNfyJNu7qmj
3. Click "Save"

## 4. Redeploy

Environment variables take effect on the next deployment:

1. Go to Deployments tab
2. Click "Redeploy" on your production deployment
3. Or push a new commit to trigger a redeploy

## 5. Test It

Your dashboard is now live:

```
https://your-project.vercel.app/ttps
```

1. Open it in your browser
2. You should see the status indicator show "Connected"
3. Try creating a new opportunity
4. Check Airtable — it should appear in your table

## Key Files

- **public/ttps.html** — The dashboard UI (no secrets)
- **api/opportunities.js** — Handles GET/POST/PUT
- **api/archive.js** — Handles archiving
- **vercel.json** — Routes the /ttps path to the HTML file
- **.env.example** — Template (never commit actual values)

## What Just Happened?

You deployed a secure system:

1. Frontend (HTML) has ZERO credentials
2. API functions (Node.js) handle Airtable calls server-side
3. PAT lives only in Vercel's encrypted environment
4. Dashboard talks to your API, not directly to Airtable

## Next Steps

- **Customize**: Edit `CLIENT_CONFIG` in `public/ttps.html` to change the client ID
- **Monitor**: Check Vercel dashboard for errors
- **Test Features**:
  - Create opportunity
  - Edit opportunity
  - Archive opportunity
  - Upload PDF (drag & drop)
  - Go offline (DevTools → Network → offline) → data saves to localStorage

## Troubleshooting

**Dashboard won't load:**
- Check env vars are set in Vercel (not just .env.example)
- Verify the Vercel deployment completed successfully

**"Connected" status but no data:**
- Open browser DevTools → Network tab
- Check the `/api/opportunities?clientId=...` request
- Should see a JSON response with opportunities

**API returns 500 error:**
- Check Vercel Function logs (Deployments → View Deployment → Logs)
- Verify AIRTABLE_PAT is set and valid

## Security Reminder

✓ Never commit `.env` files
✓ Always use Vercel environment variables for secrets
✓ HTML/JS files contain NO credentials
✓ All API calls are server-side proxied

---

You're done! The dashboard is running and secure.
