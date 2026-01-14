# Deployment Guide

## GitHub Pages Deployment

Your Fractal Explorer is now live at:

**https://wadelab.github.io/fractal-explorer/**

### Automatic Deployment Setup

The project is configured with two branches:

1. **`main`** - Source code and build configuration
2. **`gh-pages`** - Built WebAssembly application (deployed automatically)

### Deployment Workflow

To deploy updates to GitHub Pages:

```bash
# 1. Make changes to source code
# 2. Build the project
source ~/emsdk/emsdk_env.sh
source .venv/bin/activate
make build

# 3. Switch to gh-pages branch
git checkout gh-pages

# 4. Copy new build
cp -r build/dist/* .

# 5. Commit and push
git add .
git commit -m "Update deployment

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push

# 6. Switch back to main
git checkout main
```

### Deployment Status

GitHub Pages automatically builds and deploys the `gh-pages` branch.

Check deployment status:
- Visit: https://github.com/wadelab/fractal-explorer/deployments
- Or via API: `gh api repos/wadelab/fractal-explorer/pages`

### Performance Considerations

**GitHub Pages serves:**
- Static files with CDN distribution
- HTTPS enabled by default
- Excellent global performance

**Expected load times:**
- WASM module: ~25KB (instant on most connections)
- JavaScript loader: ~34KB
- Total page weight: ~65KB + CSS/HTML
- First render: <500ms on broadband

### Browser Requirements

The deployed application requires:
- Modern browser with WebAssembly support
- JavaScript enabled
- Web Workers support
- ES6 modules support

**Supported browsers:**
- Chrome/Edge 88+
- Firefox 79+
- Safari 15+
- Opera 74+

### Custom Domain (Optional)

To use a custom domain:

1. Create a `CNAME` file in the `gh-pages` branch:
   ```bash
   echo "fractals.yourdomain.com" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push
   ```

2. Configure DNS at your domain registrar:
   ```
   Type: CNAME
   Name: fractals
   Value: wadelab.github.io
   ```

3. Enable HTTPS in GitHub repository settings

### Monitoring

**Check if site is live:**
```bash
curl -I https://wadelab.github.io/fractal-explorer/
```

**Expected response:**
```
HTTP/2 200
content-type: text/html; charset=utf-8
```

### Troubleshooting

**Site not loading?**
- Wait 2-3 minutes for initial deployment
- Check https://github.com/wadelab/fractal-explorer/deployments
- Clear browser cache
- Verify gh-pages branch has index.html

**WASM not loading?**
- Check browser console for errors
- Verify fractal.wasm is in gh-pages root
- Check MIME type is `application/wasm`

**Workers failing?**
- Verify workers/fractal-worker.js exists
- Check for CORS errors in console
- Ensure all paths are relative (no absolute paths)

### Alternative Hosting Options

The built files in `build/dist/` can be deployed to:

1. **Netlify**
   ```bash
   npm install -g netlify-cli
   cd build/dist
   netlify deploy --prod
   ```

2. **Vercel**
   ```bash
   npm install -g vercel
   cd build/dist
   vercel --prod
   ```

3. **Static hosting (S3, Azure, etc.)**
   - Upload contents of `build/dist/` to hosting provider
   - Configure MIME types:
     - `.wasm` → `application/wasm`
     - `.js` → `application/javascript`
     - `.html` → `text/html`

### Development vs Production

**Local development:**
- Run `make serve` for local testing
- Serves from `build/dist/` on port 8000
- Hot reloading: rebuild with `make build`

**Production (GitHub Pages):**
- Deployed from `gh-pages` branch
- CDN distributed
- Automatic HTTPS
- No server required

### Build Automation (GitHub Actions)

For automatic builds on push, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Emscripten
      uses: mymindstorm/setup-emsdk@v11
      with:
        version: '3.1.47'

    - name: Setup Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.10'

    - name: Install dependencies
      run: |
        python -m pip install cmake

    - name: Build
      run: make build

    - name: Deploy to gh-pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./build/dist
        publish_branch: gh-pages
```

This will automatically build and deploy on every push to main.

---

**Your fractal explorer is now live!**

Visit: **https://wadelab.github.io/fractal-explorer/**

Share it, explore fractals, and enjoy the multi-threaded performance!
