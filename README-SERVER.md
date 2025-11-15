# Fixing "Preview Not Found" Issue with Live Server

## Problem
When accessing routes directly (like `/dashboard`, `/login`, etc.) from a live server, you get a "404 Not Found" or "Preview Not Found" error. This happens because the server tries to find a file at that path, but in a Single Page Application (SPA), all routes are handled by the client-side router.

## Solutions

### Option 1: Use the Node.js Development Server (Recommended)
This is the most reliable solution for development.

1. Make sure you have Node.js installed
2. Run the server:
   ```bash
   npm start
   # or
   node server.js
   ```
3. Open your browser to `http://localhost:5500`
4. All routes will now work correctly!

### Option 2: VS Code Live Server Extension
The Live Server extension doesn't natively support SPA routing. However, you can:

1. **Use the Node.js server instead** (Option 1 above)
2. **Or configure Live Server** by:
   - Right-click on `index.html`
   - Select "Open with Live Server"
   - Always start from `index.html`, not from a route URL
   - Navigate within the app using the app's navigation (not by typing URLs directly)

### Option 3: For Production Deployment
- **Netlify/Vercel**: The `_redirects` file is already configured
- **Apache**: The `.htaccess` file is already configured
- **Other servers**: Configure them to serve `index.html` for all routes

## Quick Fix
If you're currently using VS Code Live Server and getting "Preview Not Found":
1. Stop the Live Server
2. Run `npm start` in the terminal
3. Access `http://localhost:5500` in your browser

All routes should now work correctly!

