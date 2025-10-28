# 🚀 BrandMind AI - Frontend

## Overview

Modern React-based UI with **two powerful modes**:

1. **⚡ Quick Mode** - Simple campaign generator
2. **🔄 Workflow Builder** - Visual node-based AI workflow editor

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **React Flow** - Workflow canvas
- **Zustand** - State management
- **Lucide React** - Icons
- **Axios** - API client

## Quick Start

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open: **http://localhost:5173**

### Build for Production
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── workflow/              # 🆕 Workflow Builder Components
│   │   ├── WorkflowBuilder.jsx    # Main canvas
│   │   ├── AgentNode.jsx          # Custom nodes
│   │   ├── Sidebar.jsx            # Agent blocks
│   │   └── WorkflowNavbar.jsx     # Controls
│   ├── AssetCard.jsx          # Campaign asset display
│   ├── BriefInput.jsx         # Campaign brief form
│   ├── CampaignCanvas.jsx     # Campaign results view
│   └── ExportButton.jsx       # Export functionality
├── store/
│   └── workflowStore.js       # 🆕 Workflow state management
├── api/
│   ├── agentAPI.js            # 🆕 Agent execution API
│   └── api.js                 # Campaign API
├── App.jsx                    # Main app with mode toggle
├── main.jsx                   # Entry point
├── index.css                  # Global styles
└── workflow.css               # 🆕 React Flow custom styles
```

## Features

### Quick Mode ⚡
- Simple text input for campaign brief
- One-click campaign generation
- View strategy, assets, calendar
- Edit and regenerate assets
- Export as ZIP

### Workflow Builder 🔄
- **Visual Canvas** - Drag & drop interface
- **5 Agent Types**:
  - 🎯 Strategy Agent
  - ✍️ Copywriting Agent
  - 🎨 Visual Design Agent
  - 🔍 Market Research Agent
  - 📊 Media Planner Agent
- **Node Connections** - Link agents with edges
- **Dual Execution**:
  - Run individual agents
  - Run entire workflow
- **Persistence** - Save/load to localStorage
- **Export/Import** - JSON workflow files

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Configuration

### API Endpoint
Located in `src/api.js` and `src/api/agentAPI.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

Change to your backend URL in production.

### Workflow Settings
Located in `src/store/workflowStore.js`:
```javascript
localStorage.setItem('brandmind_workflow', JSON.stringify(workflow));
```

## Customization

### Adding New Agent Types

1. **Update Sidebar** (`components/workflow/Sidebar.jsx`):
```javascript
{
  type: 'email',
  label: 'Email Agent',
  icon: Mail,
  color: 'teal',
  description: 'Creates email campaigns',
}
```

2. **Add Styling** (`components/workflow/AgentNode.jsx`):
```javascript
email: {
  border: 'border-teal-400',
  bg: 'bg-gradient-to-br from-teal-50 to-teal-100',
  icon: '📧',
  glow: 'shadow-teal-400/50',
}
```

3. **Implement API** (`api/agentAPI.js`):
```javascript
email: async (input) => {
  // Mock or real API call
  return { subject: '...', body: '...' };
}
```

### Styling

**Tailwind Config** - `tailwind.config.js`
```javascript
theme: {
  extend: {
    colors: {
      brand: {
        primary: '#5B9DFE',
        dark: '#1E1E2E',
      }
    }
  }
}
```

**Custom CSS** - `workflow.css`
- React Flow styling
- Node animations
- Canvas background

## Environment Variables

Create `.env.local` for custom configuration:
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=BrandMind AI
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## Browser Support

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Supported (15+)
- Mobile: ⚠️ Desktop-optimized (workflow builder)

## Performance

### Optimization Tips
- Keep workflows under 20 nodes
- Use production build for deployment
- Enable code splitting for large apps
- Clear localStorage periodically

### Bundle Size
- React Flow: ~500KB
- Zustand: ~4KB
- Total (uncompressed): ~2MB
- Total (gzipped): ~600KB

## Development

### Hot Module Replacement (HMR)
Vite provides instant HMR - changes reflect immediately without full reload.

### React DevTools
Install React DevTools extension for debugging:
- Component tree inspection
- Props and state viewing
- Performance profiling

### Zustand DevTools
Install Redux DevTools extension to debug Zustand store:
```javascript
import { devtools } from 'zustand/middleware';

const useStore = create(devtools((set) => ({
  // ... store
})));
```

## Testing

### Manual Testing Checklist
- [ ] Quick Mode: Generate campaign
- [ ] Quick Mode: Edit assets
- [ ] Quick Mode: Export campaign
- [ ] Workflow: Drag agent to canvas
- [ ] Workflow: Connect two nodes
- [ ] Workflow: Run single agent
- [ ] Workflow: Run full workflow
- [ ] Workflow: Save workflow
- [ ] Workflow: Load workflow
- [ ] Workflow: Export JSON
- [ ] Mode toggle works
- [ ] Responsive on desktop

### Unit Tests (Future)
```bash
npm install --save-dev vitest @testing-library/react
npm run test
```

## Deployment

### Build
```bash
npm run build
```

Output in `dist/` folder.

### Deploy to Vercel
```bash
npx vercel
```

### Deploy to Netlify
```bash
npm run build
netlify deploy --prod --dir=dist
```

### Environment Variables
Set these in your deployment platform:
- `VITE_API_BASE_URL` - Backend API URL

## Troubleshooting

### "Cannot find module 'reactflow'"
```bash
npm install reactflow@11.10.4
```

### Styles not loading
```bash
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Port 5173 already in use
```bash
# Change port in vite.config.js
server: {
  port: 3000
}
```

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Documentation

- **Quick Start**: `../INSTALL_WORKFLOW.md`
- **Full Guide**: `../WORKFLOW_BUILDER_GUIDE.md`
- **Summary**: `../WORKFLOW_SUMMARY.md`
- **Backend Integration**: `../API_REFERENCE.md`

## Contributing

### Code Style
- Use ES6+ features
- Functional components with hooks
- Tailwind classes for styling
- Props destructuring
- Named exports for utilities

### File Naming
- Components: `PascalCase.jsx`
- Utilities: `camelCase.js`
- Styles: `kebab-case.css`

## License

MIT License - See LICENSE file

---

**Need Help?**
- 📖 Read the guides in `../` directory
- 🐛 Check console for errors
- 💬 Review component code for examples

