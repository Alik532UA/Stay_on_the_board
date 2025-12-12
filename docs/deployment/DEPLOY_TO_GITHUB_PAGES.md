# Deploying Svelte App to GitHub Pages (PowerShell)

cd svelte-app

## 1. Install dependencies (if not yet installed)
```powershell
npm install
```

## 2. Install gh-pages (if not yet installed)
```powershell
npm install --save-dev gh-pages
```

## 3. Build the project
```powershell
npm run build
```

## 4. Deploy to GitHub Pages
```powershell
npm run deploy
```

---

**Note:**
- Run all commands from the `svelte-app` directory:
```powershell
cd svelte-app
```
- Make sure the `base` path in `vite.config.ts` is set to your repo name (e.g. `/Stay_on_the_board/`).
- The `deploy` script uses `gh-pages -d build` to publish the `build` folder to GitHub Pages. 