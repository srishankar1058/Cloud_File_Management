# Cloud-Based File Management System

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=fff)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=fff)
![Express](https://img.shields.io/badge/Express-4-000?logo=express&logoColor=fff)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss&logoColor=fff)
![Gemini API](https://img.shields.io/badge/Gemini_API-Optional-4285F4?logo=google&logoColor=fff)

A modern cloud file management dashboard inspired by enterprise drive products such as OneDrive and Google Drive. The application provides a complete file workspace experience with file browsing, upload simulation, sharing controls, version history, comments, storage analytics, a protected vault, admin operations, server monitoring, webhooks, audit logs, and optional Gemini-powered AI assistance.

The current UI is branded as **OmniDrive Enterprise Files** inside the app, while the repository name describes the project category: a cloud-based file management system.

**Repository:** [Jayan1463/Cloud-Based-File-Management-System](https://github.com/Jayan1463/Cloud-Based-File-Management-System)

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [AI Demo Mode](#ai-demo-mode)
- [Data Model](#data-model)
- [Future Improvements](#future-improvements)
- [License](#license)

## Overview

This project demonstrates how a business-focused cloud storage platform can be built with a React frontend and an Express backend. The frontend behaves like a full file management workspace, while the backend serves the app, exposes health checks, and provides AI endpoints for document summarization, content generation, file insights, and semantic search.

Most file, server, alert, device, webhook, and user records are currently seeded from local mock data in `src/mockData.ts`. This makes the project easy to run, test, and present without requiring a database setup.

## Features

### File Workspace

- Dashboard with recent files, shared items, favorites, storage usage, quick access folders, pinned projects, upload progress, and recent activity.
- File explorer with list and grid views.
- Breadcrumb navigation for folders.
- Search across file names and contents.
- Sorting by name, owner, size, and modified date.
- Filtering by all items, folders, documents, images, and shared files.
- Multi-select support for file rows and cards.
- Context menu actions for opening, sharing, downloading, favoriting, keeping offline, restoring, and deleting files.
- Drag-and-drop upload area with simulated upload progress.
- Folder creation and quick document creation.
- Recycle bin behavior with restore and permanent purge actions.

### Collaboration and Access Control

- Share dialog with role selection for Viewer, Commenter, Editor, and Owner.
- Public link copy flow.
- Per-file sharing state: Private, Shared, Team, and Public.
- Details panel with metadata, permissions, versions, activity, and comments.
- Comment thread support on file records.
- Document save flow with version history.
- Restore previous file versions.

### Secure Vault

- Dedicated Vault section for sensitive business files and credentials.
- Add and remove protected vault items.
- Vault files are separated from the regular file explorer.

### Storage Analytics

- Storage usage visualization.
- Category-based storage breakdown.
- Largest file list.
- Cleanup suggestions.
- Recycle bin usage tracking.
- Version usage tracking.

### Admin and Operations

- Admin area for workspace operations.
- User invitation flow.
- Server status cards with CPU, memory, disk, region, and backup metadata.
- Manual snapshot action.
- Recovery action for server incidents.
- Webhook creation and removal.
- Audit history feed.
- System notices for server alerts.

### Account and Security

- Profile summary.
- Multi-factor authentication toggle.
- Trusted device list.
- Device removal action.

### AI Assistance

- AI semantic search endpoint for matching files by meaning.
- AI document summarization endpoint.
- AI file insights endpoint for security, compliance, and file health.
- AI generation endpoint for scripts, configuration, and documentation.
- Built-in fallback responses when no Gemini API key is configured.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS 4, custom CSS |
| Icons | Lucide React |
| Animation dependency | Motion |
| Backend | Node.js, Express |
| AI integration | Google Gemini API through `@google/genai` |
| Build tooling | Vite, esbuild, TypeScript |
| Development runtime | tsx |

## Architecture

```text
Browser
  |
  | React SPA
  v
src/main.tsx
  |
  v
src/App.tsx
  |
  | Uses local state and seeded records
  v
src/mockData.ts + src/types.ts

Backend
  |
  v
server.ts
  |
  | Serves Vite middleware in development
  | Serves dist assets in production
  | Provides AI and health API routes
  v
Gemini API, when GEMINI_API_KEY is configured
```

The frontend keeps the workspace interactive with React state. The backend currently focuses on serving the app and handling AI requests. There is no external database connected in the current version.

## Project Structure

```text
.
├── src/
│   ├── App.tsx                  # Main application shell and UI logic
│   ├── main.tsx                 # React entry point
│   ├── index.css                # Tailwind import and global styles
│   ├── mockData.ts              # Seeded files, users, servers, alerts, logs, webhooks
│   ├── types.ts                 # Shared TypeScript interfaces
│   └── components/              # Additional component modules and earlier UI sections
├── server.ts                    # Express server, Vite middleware, Gemini AI routes
├── index.html                   # HTML shell
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Scripts and dependencies
├── package-lock.json            # Locked dependency versions
├── .env.example                 # Example environment variables
└── README.md                    # Project documentation
```

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- Optional: a Gemini API key if you want live AI responses

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/Jayan1463/Cloud-Based-File-Management-System.git
cd Cloud-Based-File-Management-System
npm install
```

Create an environment file from the example:

```bash
cp .env.example .env
```

Update `.env` if you want to use Gemini:

```env
GEMINI_API_KEY="your_gemini_api_key"
APP_URL="http://localhost:3000"
```

Run the development server:

```bash
npm run dev
```

Open the app in your browser:

```text
http://localhost:3000
```

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | Optional | Enables live Gemini responses for summarization, generation, insights, and semantic search. If omitted or left as the placeholder value, the app runs in demo mode. |
| `APP_URL` | Optional | Public or local application URL. Useful for hosted environments and self-referential links. |

## Available Scripts

| Script | Command | Description |
| --- | --- | --- |
| Development | `npm run dev` | Starts the Express server with Vite middleware on port `3000`. |
| Build | `npm run build` | Builds the React frontend and bundles the Express server into `dist/server.cjs`. |
| Start | `npm start` | Runs the production server from `dist/server.cjs`. |
| Lint/type check | `npm run lint` | Runs TypeScript checks with `tsc --noEmit`. |
| Clean | `npm run clean` | Removes build output files. |

## API Endpoints

### Health Check

```http
GET /api/health
```

Returns server status and the current server timestamp.

### AI Summarization

```http
POST /api/ai/summarize
```

Request body:

```json
{
  "fileName": "Document 1.docx",
  "content": "Document content to summarize"
}
```

Returns a concise summary of the provided document content.

### AI Content Generation

```http
POST /api/ai/generate
```

Request body:

```json
{
  "prompt": "Generate a backup monitoring script",
  "context": "Linux server sync automation"
}
```

Returns generated code, configuration, or documentation text.

### AI File Insights

```http
POST /api/ai/insights
```

Request body:

```json
{
  "fileName": "Production Config.json",
  "content": "File content to analyze"
}
```

Returns security, compliance, file health, and placement recommendations.

### AI Semantic Search

```http
POST /api/ai/search
```

Request body:

```json
{
  "query": "database backup configuration",
  "files": []
}
```

Returns matching files, relevance levels, snippets, and a short AI explanation.

## AI Demo Mode

The application works even without a real Gemini API key. If `GEMINI_API_KEY` is missing or still set to the placeholder value, the backend returns realistic demo responses for AI features. This keeps the project presentable for demos, college submissions, and GitHub review without exposing API credentials.

To enable live AI responses, set a valid Gemini API key in `.env` and restart the development server.

## Data Model

The main TypeScript models are defined in `src/types.ts`:

- `FileItem`: file, folder, image, document, log, config, sharing, version, vault, recycle bin, and metadata fields.
- `CommentItem`: file comments and timestamps.
- `FileVersion`: version history records.
- `ServerInstance`: monitored server metadata, health values, backup paths, and sync agent information.
- `AlertNotification`: system alerts for CPU, memory, disk, security, backup, and ransomware signals.
- `UserAccount`: user profile, role, storage quota, MFA status, and devices.
- `DeviceItem`: trusted devices and sync status.
- `AuditLog`: workspace and system activity history.
- `DeveloperWebhook`: developer webhook configuration.

## Current Limitations

- File, user, server, alert, and webhook data are stored in frontend state and seeded from mock data.
- Uploaded files are simulated in the browser and reset after refresh.
- There is no database, authentication provider, or real object storage connected yet.
- Admin actions such as snapshots and recovery are simulated for demonstration.
- AI routes are available, but live responses require a valid Gemini API key.

## Future Improvements

- Connect persistent storage using PostgreSQL, MongoDB, Firebase, Supabase, or another database.
- Add real authentication and role-based access control.
- Integrate real file uploads with cloud object storage.
- Store version history and comments on the backend.
- Add server-side audit log persistence.
- Add automated tests for frontend workflows and API routes.
- Add deployment configuration for Vercel, Render, Railway, Cloud Run, or Docker.
- Add screenshot assets to the README after the UI is finalized.

## License

This project currently does not include a dedicated license file. Add a license such as MIT if you plan to publish it as an open-source project.
#   c l o u d f i l e s y s t e m  
 