# Discord Bot

A Discord bot powered by discord.js and TypeScript.

## Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your bot token and client ID:
   ```
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   ```
4. Build the TypeScript code:
   ```bash
   npm run build
   ```
5. Register the bot slash commands:
   ```bash
   npm run register-bot
   npm run register-commands
   ```
6. Start the bot:
   ```bash
   npm start
   ```

For development with auto-restart:
