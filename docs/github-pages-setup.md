# GitHub Pages Setup Guide

This document explains how Somnium is configured for automatic deployment to GitHub Pages.

## Overview

Somnium uses GitHub Actions to automatically deploy the game to GitHub Pages whenever changes are pushed to the `main` branch. The live demo is available at:

**https://doublegate.github.io/Somnium/**

## How It Works

### Workflow File

The deployment is handled by `.github/workflows/deploy.yml`, which:

1. **Triggers** on:
   - Pushes to the `main` branch
   - Manual workflow dispatch (via GitHub Actions UI)

2. **Build Step**:
   - Checks out the repository
   - Sets up Node.js environment
   - Installs dependencies
   - Runs all tests (ensures deployment only happens if tests pass)
   - Prepares deployment files in `_site/` directory:
     - Copies all necessary files (HTML, JS, CSS, demos, docs)
     - Uses `config.template.js` as default `config.js` for offline mode
     - Creates `.nojekyll` file to prevent Jekyll processing

3. **Deploy Step**:
   - Uploads the `_site/` directory as an artifact
   - Deploys to GitHub Pages
   - Outputs the deployment URL

### Configuration

The deployed site runs in **offline mode by default** using the configuration from `config.template.js`. This ensures:
- No API key is required to play
- The game works immediately without setup
- Users play with static test worlds (small, medium, large)

To use AI-generated worlds, users need to:
1. Clone the repository
2. Create their own `config.js` with an API key
3. Run locally

## Enabling GitHub Pages (Repository Setup)

If you're setting up a fork or new instance, follow these steps:

### 1. Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Source: **GitHub Actions** (not "Deploy from a branch")
4. Click **Save**

### 2. Verify Workflow Permissions

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, ensure:
   - **Read and write permissions** is selected
   - **Allow GitHub Actions to create and approve pull requests** is checked
3. Click **Save**

### 3. Trigger First Deployment

You can trigger the first deployment in two ways:

**Option A: Push to main**
```bash
git push origin main
```

**Option B: Manual dispatch**
1. Go to **Actions** tab
2. Click **Deploy to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

### 4. Monitor Deployment

1. Go to **Actions** tab
2. Click on the running workflow
3. Watch the **build** and **deploy** jobs complete
4. Once complete, your site will be live at `https://[username].github.io/Somnium/`

## Deployment Status

You can check deployment status in several places:

- **Actions Tab**: Shows workflow runs and their status
- **Environments**: Go to **Settings** → **Environments** → **github-pages** to see deployment history
- **Pages Settings**: Shows the current deployment URL and status

## Troubleshooting

### Deployment Failing

**Issue**: Workflow fails at build step
- **Solution**: Check the test results. All tests must pass before deployment.
- Run `npm test` locally to identify failing tests

**Issue**: Workflow fails at deploy step
- **Solution**: Verify GitHub Pages is enabled in repository settings
- Check workflow permissions (Settings → Actions → General)

### Site Not Loading

**Issue**: 404 error when accessing the site
- **Solution**: Ensure GitHub Pages source is set to "GitHub Actions"
- Check that the workflow completed successfully
- Wait 5-10 minutes for DNS propagation

**Issue**: JavaScript errors in console
- **Solution**: Check browser console for specific errors
- Ensure `config.js` exists in the deployed `js/` directory
- Verify all file paths are relative (not absolute)

### Config File Issues

**Issue**: Game asking for API key
- **Solution**: The workflow should copy `config.template.js` to `config.js`
- Check the "Prepare deployment files" step in the workflow logs
- Ensure `config.template.js` has `apiKey: 'your-api-key-here'` (triggers offline mode)

## Updating the Deployed Site

The site automatically updates when you push to `main`:

```bash
git add .
git commit -m "Update game"
git push origin main
```

Wait 2-3 minutes for the workflow to complete, then refresh the live demo.

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the root of the repository:
   ```
   your-domain.com
   ```

2. Configure DNS records with your domain provider:
   - Add a CNAME record pointing to `[username].github.io`
   - Or add A records pointing to GitHub Pages IPs

3. In repository Settings → Pages:
   - Enter your custom domain
   - Enable "Enforce HTTPS"

See [GitHub Pages custom domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for detailed instructions.

## Workflow File Reference

### Key Configuration

```yaml
# Triggers
on:
  push:
    branches: [main]
  workflow_dispatch:

# Permissions
permissions:
  contents: read
  pages: write
  id-token: write

# Concurrency (prevents conflicts)
concurrency:
  group: "pages"
  cancel-in-progress: false
```

### Deployment Steps

1. **Checkout**: Gets the repository code
2. **Setup Node.js**: Installs Node.js 20.x
3. **Install dependencies**: Runs `npm ci`
4. **Run tests**: Runs `npm test` (deployment fails if tests fail)
5. **Setup Pages**: Configures GitHub Pages environment
6. **Prepare files**: Copies files to `_site/` and creates config
7. **Upload artifact**: Packages `_site/` for deployment
8. **Deploy**: Publishes to GitHub Pages

## Security Considerations

### API Keys

**IMPORTANT**: Never commit API keys to the repository!

The workflow uses `config.template.js` (which has a placeholder API key) as the deployed `config.js`. This ensures:
- No real API keys are exposed in the public deployment
- The site works in offline mode for all users
- Users who want AI features must set up their own local instance

### Environment Secrets

If you need to deploy with a real API key (not recommended), use GitHub Secrets:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `OPENAI_API_KEY`
4. Value: Your API key
5. Update the workflow to use the secret:
   ```yaml
   - name: Create config with secret
     run: |
       echo "export const API_CONFIG = { apiKey: '${{ secrets.OPENAI_API_KEY }}', ... };" > _site/js/config.js
   ```

**Warning**: Even with secrets, the API key will be exposed in the deployed JavaScript. This is not recommended for production. Instead, use a backend API proxy.

## Monitoring

### Workflow Badges

Add workflow status badges to README.md:

```markdown
[![Deploy Status](https://github.com/[username]/Somnium/workflows/Deploy%20to%20GitHub%20Pages/badge.svg)](https://github.com/[username]/Somnium/actions)
```

### Deployment Notifications

GitHub can notify you of deployment status:

1. Go to repository **Settings** → **Notifications**
2. Configure email/webhook notifications for Actions

## Local Testing of Deployment

To test the deployment setup locally:

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Create deployment directory
mkdir -p _site

# Copy files (same as workflow)
cp index.html _site/
cp -r js _site/
cp -r css _site/
cp -r demos _site/
cp -r docs _site/
cp js/config.template.js _site/js/config.js

# Serve locally
cd _site
npx http-server -p 8080
```

Open `http://localhost:8080` to test the deployed version.

## Maintenance

### Regular Tasks

- **Monitor workflow runs**: Check Actions tab for failures
- **Update dependencies**: Keep GitHub Actions versions current
- **Test deployments**: Verify the live site works after major updates
- **Review analytics**: (if enabled) Monitor site usage

### Workflow Updates

When updating the workflow:

1. Edit `.github/workflows/deploy.yml`
2. Test changes in a feature branch
3. Merge to `main` only after verification
4. Monitor the first deployment closely

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Deploy Pages Action](https://github.com/actions/deploy-pages)
- [Configure Pages Action](https://github.com/actions/configure-pages)

---

**Note**: This setup provides a zero-configuration, always-available demo of Somnium that anyone can play without setup or API keys. For AI-generated adventures, users should clone the repository and run locally with their own API configuration.
