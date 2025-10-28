🧠 Campaign Workflow Assistant

Autonomous Brand Campaign Strategist (Backend + Frontend)
Final Round Project — Bit & Build 2025

🚀 Overview

The Campaign Workflow Assistant is an AI-powered collaboration platform that autonomously transforms a marketing brief into a complete brand campaign package — including strategy, visuals, copywriting, media plans, and influencer recommendations.

It combines intelligent reasoning agents (Python) with an interactive workflow canvas (React + Vite) to help teams ideate, refine, and deploy campaigns faster and smarter.

🎯 Problem Statement

Modern marketing teams — especially startups and SMEs — struggle with campaign creation due to:

Fragmented workflows across strategy, design, and media planning.

Limited time and creative bandwidth.

Difficulty converting broad ideas into cohesive campaigns.

💡 Our Solution

A fully autonomous campaign strategist that:

Understands and deconstructs the marketing brief.

Reasons about target audience, message, and goals.

Uses specialized tools (LLM, image generation, web research) to create:

Strategic Concepts

Visual Identities

Copywriting

Market Research & Influencer Outreach

Media Planning & Scheduling

Presents the campaign in a collaborative visual interface, where users can regenerate, edit, and export assets.

🧩 System Architecture
pyTeam_Final-Round_10/
│
├── backend/                 # Python backend and agent logic
│   ├── main.py              # Backend entrypoint
│   ├── agents/              # Agent orchestration & reasoning
│   ├── tools/               # Specialized tools (LLM, image, moderation, search)
│   ├── models/              # Data schemas
│   ├── collaboration_sync.py# Collaboration utilities
│   └── requirements.txt     # Python dependencies
│
├── frontend/                # React + Vite frontend
│   ├── src/                 # Components, pages, store, hooks, utils
│   ├── package.json         # Frontend dependencies
│   └── README.md            # Frontend notes
│
├── .gitignore
└── README.md                # You are here 🚀

⚙️ Key Features
Feature	Description
🧭 Strategy Formation	The AI agent interprets the marketing brief and forms a core campaign concept.
🎨 Visual Identity Generation	Uses image generation tools (e.g. DALL·E, Midjourney) to create a moodboard and visual assets.
✍️ Copywriting Assistant	Generates ad copy, taglines, captions, and blog content aligned with the strategy.
🌍 Market Research	Searches for influencers, local opportunities, and drafts personalized outreach messages.
📅 Media Planning	Suggests posting schedules, channels, and promotional strategies.
🧑‍💻 Interactive Canvas (Frontend)	Visual interface where users can review, regenerate, or edit campaign elements in real time.
🖥️ Tech Stack
Layer	Technology
Frontend	React, Vite, Tailwind CSS
Backend	Python 3.10+, FastAPI/Flask (based on main.py)
AI Tools	OpenAI API, image generation APIs, web research tools
Collaboration	Custom synchronization layer (collaboration_sync.py)
Data	JSON models / temporary storage (DB optional)
⚡ Getting Started
🧱 Prerequisites

Python ≥ 3.8 (recommended 3.10+)

Node.js (LTS)

npm or yarn

(Optional) PowerShell for setup commands on Windows

🧠 Backend Setup
# 1️⃣ Navigate to the project
cd C:\projects\Bit&Build2025\pyTeam_Final-Round_10

# 2️⃣ Create & activate a virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3️⃣ Install dependencies
pip install --upgrade pip
pip install -r backend\requirements.txt

# 4️⃣ Set environment variables (if required)
$env:OPENAI_API_KEY = "sk-..."
$env:TWITTER_API_KEY = "..."

# 5️⃣ Run backend
python backend\main.py


📝 Note:
main.py is the backend entrypoint — check it for details on server initialization (Flask/FastAPI).

🌐 Frontend Setup
# 1️⃣ Move to frontend directory
cd frontend

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start the Vite dev server
npm run dev


Open your browser at ➜ http://localhost:5173

If your backend runs on a different host/port, update the API base URL in frontend/src/api.js.

🔒 Environment Variables
Variable	Purpose
OPENAI_API_KEY	Access to language model tools
TWITTER_API_KEY / TWITTER_API_SECRET	For social outreach and research
DATABASE_URL	(Optional) If using a persistent database
MODERATION_API_KEY	(Optional) For content safety

Keep keys private — never commit them to the repo.

🧪 Testing

Backend: Add pytest for agent and tool testing.

Frontend: Add Jest or React Testing Library for component tests.

Example:

pytest backend/tests/
npm run test

🤝 Contribution Guidelines

Fork or create a new branch from main.

Keep PRs small and focused.

Include a clear commit message and testing notes.

Follow consistent naming conventions for agents and tools.

📜 License

Currently unlicensed.
If open-sourced, add an appropriate license (e.g., MIT).

🧑‍💼 Maintainers

Team: BnB-25-Final-Round
Repository: pyTeam_Final-Round_10
For support or collaboration, please open an issue or contact via team channels.

🌟 Future Scope

Integration with real-time collaboration (multi-user canvas sync)

Analytics dashboard for campaign performance

Integration with live ad platforms (Meta, X, Google Ads)

Advanced prompt tuning for visual generation and reasoning

🏁 Summary

The Campaign Workflow Assistant merges creativity with intelligence — empowering marketing teams to go from idea → insight → impact faster than ever before.
