# BlockForge AI — Minecraft Bedrock World Studio

Mobile-first Turkish web app: prompt-to-build planning, Three.js voxel preview, materials list, AI endpoint, and a real `.mcworld` archive export workflow.

## Important `.mcworld` workflow

The app does **not** fake a `.mcworld` by renaming a `.mcpack`. Instead:
1. Generate a build plan with the AI.
2. In Minecraft Bedrock, export a copy of an existing world as `.mcworld`.
3. Select that `.mcworld` in the app.
4. Click **.mcworld oluştur**. The app adds a Behavior Pack and links it in `world_behavior_packs.json`, then downloads a new `.mcworld` archive.
5. Import/open the new world in Minecraft, enable cheats, and run `/function blockforge/build` in chat to place the generated blocks.

This method creates a valid world archive based on a real exported world, but it does not directly edit LevelDB chunk records or build the structure before Minecraft opens. Minecraft places blocks when the function is run. Always test on a copy.

## Run locally (optional)
Requires Node.js 18+.
1. Extract the ZIP.
2. `npm install`
3. Copy `.env.example` to `.env` and set `OPENAI_API_KEY`.
4. `npm start`
5. Open `http://localhost:3000`.

## Deploy as a public website
1. Create a Node.js web service on a hosting provider.
2. Upload/import these project files.
3. Build/install command: `npm install`
4. Start command: `npm start`
5. Add environment variables `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in the host dashboard. Never put the API key in browser JavaScript or a public repository.
6. Deploy and open the HTTPS URL. The `.mcworld` assembly is performed in the user's browser; only the prompt goes to the AI endpoint.

## Features and limits
- Server-side OpenAI API call creates a bounded JSON block plan.
- Three.js renders an approximate voxel preview.
- Export options: `.mcworld` based on a user-supplied Bedrock world, `.mcfunction`, and JSON plan.
- The seed is a prompt reference only; this app does not generate Minecraft terrain from a seed.
- The structure is placed by a Bedrock function when run in the imported world; it is not baked into LevelDB chunk data.
- The generated function uses absolute coordinates and standard `setblock` commands. Enable cheats and use a backup.
- Before public launch, add authentication, rate limiting, quotas, and operational monitoring.
