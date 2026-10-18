<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/748e630e-c617-46b3-a9e1-2c6066fa0961

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Vercel

Deploy the Vite frontend to Vercel and the Express backend to Render. Vercel
serves only `dist/client`; Render runs the built Express server.

Set `VITE_API_BASE_URL` in Vercel's Production Environment Variables to the
Render API URL (for example, `https://your-service.onrender.com/api`) and
redeploy. Set `FRONTEND_URL` in Render to the Vercel frontend origin so the
browser can call the API. Never commit `.env.local` or other secret files.
