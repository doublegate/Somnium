# Manual Release Steps for v1.0.0

Due to GitHub App permissions restrictions, some release steps must be completed manually. This document outlines the remaining steps to finalize the v1.0.0 release.

## Steps Required

### 1. Add GitHub Pages Deployment Workflow

The workflow file `.github/workflows/deploy.yml` has been created locally but cannot be pushed due to workflow permissions.

**Action Required**:
1. Copy the file `.github/workflows/deploy.yml` to the repository
2. Commit and push it manually (not via the GitHub App)

**Workflow File Location**: `.github/workflows/deploy.yml` (already exists in your local repository)

**Workflow Content Summary**:
- Automatically deploys to GitHub Pages on pushes to `main`
- Runs all tests before deployment
- Copies `config.template.js` as `config.js` for offline mode
- Creates `.nojekyll` file
- Uploads and deploys to GitHub Pages

**Alternative**: You can also manually create this file in the GitHub web interface:
1. Go to your repository on GitHub
2. Navigate to `.github/workflows/`
3. Click "Add file" → "Create new file"
4. Name it `deploy.yml`
5. Paste the content from the local file
6. Commit directly to `main` or your preferred branch

### 2. Push the v1.0.0 Git Tag

A git tag `v1.0.0` has been created locally with comprehensive release notes, but cannot be pushed due to permissions.

**Action Required**:
1. Ensure you're on the correct branch (likely `main` after merging)
2. Push the tag manually:
   ```bash
   git push origin v1.0.0
   ```

**Tag Details**:
- **Tag Name**: v1.0.0
- **Type**: Annotated tag
- **Message**: Comprehensive release notes (see tag message with `git tag -n100 v1.0.0`)

**Note**: The tag exists in your local clone at `/home/user/Somnium/.git/refs/tags/v1.0.0`

### 3. Create GitHub Release

After the tag is pushed, create a GitHub Release:

**Action Required**:
1. Go to your repository on GitHub
2. Click "Releases" → "Draft a new release"
3. Select tag: `v1.0.0` (should be available after step 2)
4. Set release title: **Somnium v1.0.0 - Production Release**
5. Copy release notes from CHANGELOG.md or use the template below
6. Attach any binaries if desired (not required for web apps)
7. Check "Set as the latest release"
8. Click "Publish release"

**Release Description Template**:
```markdown
🎉 **First production release of Somnium!** 🎉

Somnium is a complete, production-ready AI-driven graphical text-adventure game inspired by Sierra On-Line's SCI0-era games (1988-1989).

## Quick Links
- **[Play Online](https://doublegate.github.io/Somnium/)** - No installation required!
- **[Changelog](https://github.com/doublegate/Somnium/blob/main/CHANGELOG.md)** - Complete release notes
- **[Documentation](https://github.com/doublegate/Somnium/tree/main/docs)** - Setup guides and references

## Highlights

✅ **All 5 Development Phases Complete**
- Core Architecture (Phase 1)
- Graphics and Sound Systems (Phase 2)
- Parser and Game Logic (Phase 3)
- AI Integration (Phase 4)
- Polish and Sierra Enhancements (Phase 5)

🎮 **Key Features**
- AI-generated unique adventures (or offline with static worlds)
- Authentic SCI0-era retro graphics (320×200, 16-color EGA)
- Natural language parser (30+ commands, 100+ synonyms)
- Professional save/load system (10 slots + auto-save)
- Sierra-inspired audio (procedural synthesis, 8 musical themes)
- Complete game mechanics (inventory, puzzles, NPCs, achievements)

🔧 **Production Quality**
- 444 tests passing (100% pass rate)
- 61.64% code coverage
- Zero ESLint/Prettier errors
- Full CI/CD pipeline

## Installation

### Play Online (Easiest)
Visit https://doublegate.github.io/Somnium/ - works immediately in any modern browser!

### Local Setup (For AI-Generated Worlds)
1. Clone the repository:
   ```bash
   git clone https://github.com/doublegate/Somnium.git
   cd Somnium
   ```

2. Copy `js/config.template.js` to `js/config.js` and add your OpenAI API key

3. Start a web server:
   ```bash
   npm start  # or npx http-server -c-1 .
   ```

4. Open `http://localhost:8080` in your browser

See [SETUP.md](https://github.com/doublegate/Somnium/blob/main/SETUP.md) for detailed instructions.

## What's New in v1.0.0

See [CHANGELOG.md](https://github.com/doublegate/Somnium/blob/main/CHANGELOG.md) for complete release notes.

## Credits

Inspired by Sierra On-Line's legendary SCI0 engine and games:
- King's Quest IV (1988)
- Space Quest III (1989)
- Quest for Glory I (1989)
- Police Quest II (1988)

---

*Every adventure is unique. Every playthrough is a new dream. Welcome to Somnium.*
```

### 4. Enable GitHub Pages

If not already enabled:

1. Go to **Settings** → **Pages**
2. Under **Source**, select: **GitHub Actions**
3. Save

Once the workflow is pushed (step 1) and enabled, the site will deploy automatically.

See [docs/github-pages-setup.md](github-pages-setup.md) for detailed instructions.

### 5. Update Branch and Merge

After completing the above steps:

1. Merge the current branch (`claude/complete-project-implementation-014kpZvuzw4n57qch6kRbNUH`) into `main`:
   ```bash
   git checkout main
   git merge claude/complete-project-implementation-014kpZvuzw4n57qch6kRbNUH
   git push origin main
   ```

2. Delete the feature branch if desired:
   ```bash
   git branch -d claude/complete-project-implementation-014kpZvuzw4n57qch6kRbNUH
   git push origin --delete claude/complete-project-implementation-014kpZvuzw4n57qch6kRbNUH
   ```

## Summary

### Files Created/Modified (Already Committed)
- ✅ `CHANGELOG.md` - Comprehensive v1.0.0 release notes
- ✅ `README.md` - Updated with version badges and release info
- ✅ `docs/github-pages-setup.md` - Deployment documentation

### Files Created Locally (Need Manual Addition)
- 📝 `.github/workflows/deploy.yml` - GitHub Pages deployment workflow
- 📝 Git tag `v1.0.0` - Annotated release tag with notes

### Manual Actions Required
1. ⚠️ Add `.github/workflows/deploy.yml` to the repository
2. ⚠️ Push the `v1.0.0` git tag
3. ⚠️ Create GitHub Release from the tag
4. ⚠️ Enable GitHub Pages (if not already enabled)
5. ⚠️ Merge feature branch to `main`

## Verification

After completing all steps, verify:
- [ ] v1.0.0 tag exists on GitHub
- [ ] GitHub Release page shows v1.0.0
- [ ] GitHub Pages is deployed and accessible
- [ ] All tests still passing in CI/CD
- [ ] main branch is up to date

## Support

If you encounter issues:
- Check [docs/github-pages-setup.md](github-pages-setup.md) for troubleshooting
- Review GitHub Actions logs in the Actions tab
- Ensure all permissions are correctly configured

---

**Note**: These restrictions exist because the GitHub App (Claude) doesn't have permissions to create workflow files or push tags. These operations must be performed by a user with write access to the repository.
