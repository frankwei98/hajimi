# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm dev` — Start Vite dev server
- `pnpm build` — Type-check (`tsc -b`) then build with Vite
- `pnpm lint` — ESLint across the project
- `pnpm test` — Run tests once with Vitest (node environment)
- `pnpm test:watch` — Run tests in watch mode
- Single test: `pnpm vitest run tests/path/to/file.test.ts`

## Architecture

**Hajimi** is an in-browser E2EE messaging tool that disguises ciphertext as ordinary text. The crypto stack runs entirely client-side; the backend is only used for storing long encrypted blobs and user identity metadata.

### Frontend (React + Vite + TypeScript)

- **Routing**: `src/App.tsx` defines routes. Pages are in `src/pages/`, each route gets its own directory with co-located hooks and components.
- **State**: Zustand (`src/lib/state/keyVaultStore.ts`) holds key vault state (unlocked status, decrypted private keys). All global state flows through this store.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Utility classes only, no component library.

### Crypto Layer (`src/lib/crypto/`)

This is the core of the project. Two main subsystems:

- **`hybrid/`** — Hybrid encryption (X25519-HKDF-SHA256-AES-256-GCM). `encryptForRecipients()` generates an ephemeral X25519 keypair per message, encrypts with AES-256-GCM, then wraps the CEK for each recipient using HKDF-derived KEKs. The envelope format is `HybridEnvelope` (versioned, with AAD binding). `decryptForRecipient()` reverses the process.
- **`vault/`** — PIN-based local key encryption. Private keys are encrypted with AES-GCM using a key derived from the user's PIN via HKDF, then stored in IndexedDB.
- **`x25519.ts`** — Key generation with WebCrypto fallback to `@noble/curves`. Public keys are bech32-encoded with the `hajimi` prefix (e.g., `hajimi1...`).

### Key Actions (`src/lib/keyActions/`)

Composable hooks (`useKeyGenerate`, `useKeyReveal`, `useKeyVaultActions`, `useKeyPinChange`) that depend on `KeyActionDeps` — a shared interface for state setters injected from the key center page. This keeps business logic out of page components.

### Storage (`src/lib/storage/`)

IndexedDB (`hajimi` database, `keys` object store) for persisting encrypted private keys. See `StoredKey` type for the schema. The `keyStore.ts` module is a thin wrapper around raw IDB; all encryption/decryption happens in `vault/` before data reaches storage.

### Backend (Convex)

- `convex/schema.ts` — Defines the `message` table matching `HybridEnvelope.body` structure.
- `convex/messages.ts` — Two endpoints: `uploadMessage` (action with Cloudflare Turnstile verification, then internal mutation) and `getMessage` (query by ID). The backend never handles plaintext — it only stores and retrieves encrypted blobs.
- Convex client is initialized in `src/main.tsx` via `ConvexProvider`. Requires `VITE_CONVEX_URL` env var for networking features; without it, local-only features (key management, encrypt/decrypt) still work.

### Encrypt Page (`src/pages/encrypt/`)

Split into components, hooks, and utils. Key hooks:
- `useEncryptComposer` — Orchestrates the full encrypt flow: recipient parsing, validation, encryption, and share.
- `useRecipientManager` — Manages selected recipients from the key vault and parsed from text input.
- `useShareAction` — Handles uploading the encrypted envelope to Convex via `uploadMessage`.

## Conventions

- **100-line file limit**: Files should stay under 100 lines. When a file grows too large, split it into focused modules (see git history for the refactor that enforced this across the codebase).
- Error messages and UI copy are in Chinese — maintain this consistency.
- The crypto module uses `base64url` encoding (not base64) throughout the `hybrid/` package.