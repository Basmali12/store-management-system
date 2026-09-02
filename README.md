<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy the Alnoor trial app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/af227f8b-26a9-411b-85b6-b400d50b862a

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Run the app in its default local-only data mode:
   `npm run dev`

## Data mode

The trial build stores its merchant, customer, inventory, and sales data only in
the browser on the current device. It does not connect to Convex.

The Convex integration is preserved for a future paid deployment. To enable it,
create `.env.local`, set `VITE_DATA_MODE=convex`, and provide
`VITE_CONVEX_URL` and `VITE_CONVEX_SITE_URL` for that customer's deployment.
