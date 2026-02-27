# Frontend - Transaction Scrutinization Engine Dashboard

React-based dashboard for monitoring and managing the AI-Powered Transaction Scrutinization Engine.

## Tech Stack

- **React 18.3** - UI Framework
- **Vite 5.4** - Build tool and dev server
- **React Router 6.30** - Client-side routing
- **Axios** - HTTP client
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Recharts 2.15** - Data visualization
- **React Toastify** - Notifications
- **Lucide React** - Icons

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Access the dashboard:**
   Open `http://localhost:5173` in your browser

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── Common/     # Shared components (Button, Card, Modal, etc.)
│   ├── Dashboard/  # Dashboard-specific components
│   └── Layout/     # Layout components (Header, Sidebar, etc.)
├── pages/          # Page components/routes
├── services/       # API services
├── hooks/          # Custom React hooks
└── api/            # API configuration
```

## Configuration

The frontend expects the backend API to be running on `http://localhost:8000`.

To change the API URL, update the configuration in `src/services/api.js`.

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.
