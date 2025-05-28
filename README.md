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
- Python 3.8+
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

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Fly.io Deployment

1. Install Fly.io CLI
2. Run setup script: `./scripts/setup.sh`
3. Deploy: `flyctl deploy`

## Environment Variables

- `API_ID` - Telegram API ID
- `API_HASH` - Telegram API Hash  
- `TELEGRAM_SESSION` - Telegram session string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key

## License

MIT License
