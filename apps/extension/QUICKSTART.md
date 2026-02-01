# Quick Start Guide

Get Unlock running in under 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Build Publisher SDK

```bash
cd publisher-sdk
npm run build
cd ..
```

## 3. Start Demo Server

```bash
cd demo-server
npm run dev
```

Server runs at `http://localhost:3000`

## 4. Load Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select `extension` folder

## 5. Test It

1. Visit `http://localhost:3000`
2. Click "Try Premium Article"
3. Extension shows payment modal
4. Click "Unlock Now"
5. Article loads (using $3 starter credits)

## That's It!

You just unlocked premium content with micropayments.

## Next Steps

1. Read README.md for full documentation
2. Explore ARCHITECTURE.md for technical details
3. Check SETUP.md for production deployment
4. See CONTRIBUTING.md to help build

## Common Issues

**Extension not loading?**
- Check manifest.json exists
- Ensure all files present
- Look for errors in chrome://extensions

**Server not starting?**
- Kill process on port 3000: `lsof -i :3000`
- Check node version: `node -v` (need 18+)
- Verify dependencies installed

**Payment failing?**
- Check browser console (F12)
- Verify internet connection
- Check starter credits not depleted

## Get Help

1. Check SETUP.md troubleshooting section
2. Search GitHub issues
3. Join Discord (link in README)

---

**Welcome to the future of web monetization! 🔓**

