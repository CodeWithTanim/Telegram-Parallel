# Telegram-Parallel Architecture & Guidelines

Refer to [AGENTS.md](file:///d:/SCRIPTS/GitHub/Telegram-Parallel/AGENTS.md) for the complete architecture blueprint, IPC contract, and future upgrade specifications.

## Key Rules:

1. **WebContentsView Layering**: Always emit `set-view-visibility(false)` when any modal, drawer, or dialog is open in the renderer.
2. **Session Isolation**: Partitions must always use `persist:tg_account_${accountId}`.
3. **Typecheck & Quality**: Always verify changes with `npm run typecheck` and `npm run lint`.
4. **Draggable Regions**: Maintain `-webkit-app-region: drag` for custom titlebars, and `-webkit-app-region: no-drag` for interactive elements.
5. **Default Startup Mode**: The application launches into the Account Selection Hub with `activeAccountId === null` (no account auto-opened). Sending `switch-account(null)` detaches active `WebContentsView` instances and returns to the hub.
