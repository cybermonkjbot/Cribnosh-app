# Migrating Data from Dev to Production

This guide explains how to migrate your current dev data to production in Convex.

## Prerequisites

- You have access to both dev and production deployments
- You have `CONVEX_DEPLOY_KEY` set for production (or `CONVEX_DEPLOYMENT` configured)
- You have the Convex CLI installed (`bunx convex` or `npx convex`)

## Step-by-Step Migration Process

### 1. Export Data from Dev Deployment

First, export all data from your dev deployment. This creates a ZIP file containing all tables and optionally file storage.

```bash
# Navigate to the convex package directory
cd packages/convex

# Export data from dev (default deployment)
bunx convex export --path ./dev_backup.zip

# Or if you want to include file storage:
bunx convex export --include-file-storage --path ./dev_backup.zip
```

**What this does:**
- Exports all table data from your dev deployment
- Creates a ZIP file with the current state of your database
- Preserves `_id` and `_creationTime` fields
- Optionally includes file storage data

### 2. Import Data into Production

Import the exported data into your production deployment.

```bash
# Import into production (use --prod flag)
bunx convex import --prod --replace ./dev_backup.zip
```

**What this does:**
- Imports all data from the ZIP file into production
- The `--prod` flag targets your production deployment
- The `--replace` flag overwrites existing data in tables (if any)
- Preserves document IDs and creation times

### 3. Verify the Migration

After importing, verify that the data was migrated correctly:

```bash
# Check production data (if you have queries set up)
bunx convex run --prod <your-query-function>
```

Or check the Convex Dashboard:
1. Go to https://dashboard.convex.dev
2. Select your production project
3. Navigate to Data → Tables
4. Verify that your tables contain the expected data

## Alternative: Export to Specific Path

You can also export to a specific directory:

```bash
# Export to Downloads folder
bunx convex export --path ~/Downloads/convex_dev_backup.zip

# Then import from that location
bunx convex import --prod --replace ~/Downloads/convex_dev_backup.zip
```

## Important Notes

### ⚠️ Data Safety

- **Backup production first**: If production already has data, export it before importing:
  ```bash
  bunx convex export --prod --path ./prod_backup_before_migration.zip
  ```

- **The `--replace` flag**: This will **overwrite** existing data in production tables. Use with caution!

- **Test first**: Consider testing the migration on a preview deployment first if possible.

### 📋 What Gets Migrated

- ✅ All table documents (with `_id` and `_creationTime` preserved)
- ✅ Table relationships (references between tables)
- ✅ File storage (if `--include-file-storage` was used during export)
- ❌ Environment variables (must be set separately in production)
- ❌ Functions/code (deployed separately via `bunx convex deploy`)

### 🔄 Partial Migration

If you only want to migrate specific tables:

```bash
# Export specific table to JSONL
# (This requires custom export logic or using the API)

# Import specific table
bunx convex import --prod --table <tableName> <path-to-file.jsonl>
```

## Troubleshooting

### "Deployment not found" Error

Make sure you have the correct `CONVEX_DEPLOY_KEY` set for production:

```bash
# Check your deployment configuration
cat .env.local | grep CONVEX
```

### "Table already has data" Error

If tables in production already have data and you didn't use `--replace`:

```bash
# Use --replace to overwrite existing data
bunx convex import --prod --replace ./dev_backup.zip
```

### Export/Import Takes Too Long

For large datasets:
- The export/import process may take several minutes
- Monitor progress in the terminal
- Large file storage exports will take longer

## Example: Complete Migration Workflow

```bash
# 1. Navigate to convex directory
cd packages/convex

# 2. Export dev data
bunx convex export --include-file-storage --path ./dev_backup_$(date +%Y%m%d).zip

# 3. (Optional) Backup production first
bunx convex export --prod --path ./prod_backup_$(date +%Y%m%d).zip

# 4. Import dev data to production
bunx convex import --prod --replace ./dev_backup_$(date +%Y%m%d).zip

# 5. Verify migration
echo "✅ Migration complete! Check the Convex Dashboard to verify data."
```

## Related Commands

- `bunx convex export --help` - See all export options
- `bunx convex import --help` - See all import options
- `bunx convex deploy --prod` - Deploy code to production (separate from data migration)

