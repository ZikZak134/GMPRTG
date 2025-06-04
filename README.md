# Telegram Channel Parser

A powerful retro-styled Telegram channel parser with analytics and automation features.

## Features

- 🔍 Parse Telegram channels and extract messages
- 📊 Advanced analytics and statistics
- 🤖 AI-powered recommendations
- ⏰ Scheduled parsing tasks
- 📈 Export data in multiple formats
- 🎮 Retro pixel art interface with Tetris game

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.8+ (for the separate Python API, if used)
- Telegram API credentials

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/your-username/telegram-channel-parser.git
   cd telegram-channel-parser
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`
   If you encounter peer dependency issues, you might try:
   \`\`\`bash
   npm install --legacy-peer-deps
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your credentials
   \`\`\`

4. Run the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Deployment

This project is configured for deployment on Vercel and Fly.io.

### Vercel Deployment

1.  **Connect your GitHub repository to Vercel.**
2.  **Set environment variables** in the Vercel project dashboard.
3.  **Root Directory Setting**:
    *   Ensure your `package.json` is at the root of your project.
    *   In your Vercel Project Settings → General → **Root Directory**:
        *   If `package.json` is at the actual root of your Git repository, this setting should be **empty** or `.`.
        *   If your Next.js app is in a subdirectory (e.g., `my-next-app/`), set the Root Directory to `my-next-app`.
4.  **Install Command & Peer Dependencies**:
    *   Vercel uses `npm install` by default (as defined in `vercel.json`).
    *   If your project requires `--legacy-peer-deps` to resolve dependency conflicts:
        *   Go to Vercel Project Settings → General → Build & Development Settings.
        *   Override the "Install Command" to `npm install --legacy-peer-deps`.
        *   Alternatively, set an Environment Variable in Vercel: `NPM_FLAGS` with the value `--legacy-peer-deps`.
5.  **Deploy automatically on push to main branch.**

**Troubleshooting Vercel `ENOENT` for `package.json`:**
*   **Verify `package.json` Location**: Double-check that `package.json` is in the root of your project directory that Vercel is trying to build.
*   **Check `.vercelignore` and `.gitignore`**: Make sure `package.json` is not accidentally ignored in these files.
*   **Case Sensitivity**: Ensure the filename is exactly `package.json` (all lowercase).

### Fly.io Deployment

(Instructions for Fly.io remain the same as previously provided in DEPLOYMENT.md)

1. Install Fly.io CLI
2. Run setup script: `./scripts/setup.sh`
3. Deploy: `flyctl deploy` (or use the GitHub Action)


## Environment Variables (General)

- `API_ID` - Telegram API ID
- `API_HASH` - Telegram API Hash
- `TELEGRAM_SESSION` - Telegram session string
- `SUPABASE_URL` - Supabase project URL (if using Supabase)
- `SUPABASE_ANON_KEY` - Supabase anonymous key (if using Supabase)
- `NEXT_PUBLIC_PYTHON_API_URL` - URL for your Python API backend

## License

MIT License
