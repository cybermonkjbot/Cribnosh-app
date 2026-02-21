# Convex Database Backups

This folder holds snapshot exports from the Convex production deployment
(`moonlit-stork-467`), useful for migrating to self-hosting or disaster recovery.

## Contents

| File | Date | Includes |
|------|------|----------|
| `convex-backup-2026-02-21.zip` | 2026-02-21 | All tables + File Storage |

## How to restore to a self-hosted Convex instance

```bash
# Import into a self-hosted or new Convex deployment
npx convex import --path backups/convex-backup-2026-02-21.zip
```

> **Note:** The ZIP files are git-ignored (see `.gitignore`). Store them
> securely — they contain all your user data. Consider encrypting before
> uploading to cloud storage.

## Re-running a backup

```bash
cd packages/convex
npx convex export --prod --include-file-storage \
  --path ../../backups/convex-backup-$(date +%Y-%m-%d).zip
```
