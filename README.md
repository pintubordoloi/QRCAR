# QR Design Studio

QR Design Studio is a visual-only QR customization tool. It intentionally renders dummy, non-scannable QR-like previews so customers can design a style without generating a working QR code.

## Features

- Visual-only dummy QR preview rendered with SVG
- Dot and corner style customization
- Solid and gradient color controls
- Transparent, solid, and patterned backgrounds
- Center logo upload with size, radius, and padding controls
- Presets for common styles
- Watermarked preview to discourage screenshots
- Low-quality PNG export and SVG export
- Customer submission flow to a mock Express backend
- Admin submissions view
- Undo and redo for design changes
- Manual admin template builder with draw-to-define text, QR, and image/logo regions
- Reusable saved templates that load into the user editor for customization

## Run locally

1. Install dependencies:

```bash
npm run install:all
```

2. Start the backend:

```bash
npm run dev:server
```

3. In a second terminal, start the frontend:

```bash
npm run dev:client
```

4. Open the local Vite URL shown in the terminal, usually `http://localhost:5173`.

## GitHub Pages deployment

GitHub Pages can host the frontend only. It cannot run the Express server.

This project is now configured to work in two modes:

- With backend:
  Set `VITE_API_BASE` to your deployed backend origin and the app will use the Express API.
- Without backend:
  Leave `VITE_API_BASE` unset and the app will use browser `localStorage` for submissions, admin presets, and manual templates.

### Deploy on GitHub Pages

1. Push the repository to GitHub
2. Open repository `Settings -> Pages`
3. Set `Source` to `GitHub Actions`
4. Push to `main`

The workflow file at `.github/workflows/deploy-pages.yml` will build `client/` and publish it.

### Full live deployment

If you want shared backend storage across users, GitHub Pages is not enough. In that case:

- host the frontend on GitHub Pages
- host the backend somewhere else
- set `VITE_API_BASE` to that backend origin before building

## Template folder

Place custom template images in `/Users/dango/Documents/QR Scanner/template`.

- Supported: `png`, `jpg`, `jpeg`, `svg`, `webp`
- These files show up in the admin template importer
- You can also drag and drop a template image directly in the admin view

## Preset folder

Place draggable preset asset images in `/Users/dango/Documents/QR Scanner/preset`.

- Supported: `png`, `jpg`, `jpeg`, `svg`, `webp`
- Only files in this folder appear in the drag-and-drop preset asset panel

## QR preset folder

Saved QR presets are stored in `/Users/dango/Documents/QR Scanner/qr-preset`.

- The backend reads and writes QR preset data in this root folder
- This is separate from the drag-and-drop asset folder at `/preset`

## Backend API

- `GET /api/submissions`
- `POST /api/submissions`
- `GET /api/manual-templates`
- `POST /api/manual-templates`

The frontend expects the API at `http://localhost:4000`.

## Manual Template Builder

Open the app and switch to `Admin View` to use the template builder.

1. Upload a background image.
2. Drag on the builder canvas to draw a region.
3. When prompted, choose `text`, `qr`, or `image`.
4. Edit the selected region in the properties panel.
5. Save the template.

Saved builder templates appear in the user-facing `Templates` gallery and can be customized with:

- editable text boxes
- replaceable logo/image slots
- styled dummy QR region
