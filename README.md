# FHIR Resource Studio

A client-side FHIR R4 resource viewer, editor, and validator. Connect to any FHIR R4 server or use the built-in Demo Mode with sample healthcare data — no server required.

## Features

- **Demo Mode**: Explore 17 sample FHIR resources (patients, observations, conditions, encounters, medication requests) with no server connection
- **Public Server Connection**: Connect to any FHIR R4 endpoint with optional CORS proxy support
- **SMART on FHIR**: Standalone OAuth2 + PKCE launch for authenticated servers
- **Resource Explorer**: Search, filter, and browse resources by type
- **Resource Viewer**: Human-readable details view, syntax-highlighted JSON, and split view
- **Resource Editor**: Form-based editing, raw JSON editing with CodeMirror, and live validation
- **Validation**: Validate resources against the FHIR server with detailed OperationOutcome feedback

## Prerequisites

- Node.js 18.17 or later
- npm 9 or later

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd <project-directory>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`. It starts in Demo Mode automatically.

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

## Deployment

This project is configured for Netlify deployment via `netlify.toml`:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect the repository to Netlify
3. Netlify will automatically detect the Next.js project and use the `@netlify/plugin-nextjs` plugin
4. The build command (`npx next build`) and publish directory (`.next`) are pre-configured

Alternatively, you can deploy to any platform that supports Next.js (Vercel, AWS Amplify, etc.).

## Connecting to a Real FHIR Server

1. Click **Disconnect** in the top bar
2. Under **Public Server**, enter a FHIR R4 base URL (e.g., `https://hapi.fhir.org/baseR4`)
3. Click **Test Connection** to verify, then **Connect**
4. If you get a CORS error, expand **Advanced Settings** and enable a CORS proxy

### SMART on FHIR

1. Click **Disconnect** in the top bar
2. Switch to the **SMART on FHIR** tab
3. Enter the FHIR issuer URL (e.g., `https://sandbox.smarthealthit.org/smart/api/fhir/`)
4. Click **Launch SMART Authorization** — you'll be redirected through OAuth and returned with an access token

## Tech Stack

- **Next.js 13** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui** components
- **CodeMirror** for JSON editing
- **Lucide React** for icons
