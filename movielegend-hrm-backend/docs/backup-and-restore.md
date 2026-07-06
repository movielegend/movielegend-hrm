# Backup And Restore

## PostgreSQL Logical Backup

Use `pg_dump` against the target database:

```bash
pg_dump "$DATABASE_URL" --format=custom --file=movielegend-hrm-$(date +%F).dump
```

Do not commit backups. Treat dumps as sensitive production data.

## Restore

Restore into a clean database with the compatible application version:

```bash
createdb movielegend_hrm_restore
pg_restore --dbname="$RESTORE_DATABASE_URL" --clean --if-exists movielegend-hrm-YYYY-MM-DD.dump
npx prisma migrate deploy
```

## Test Restore

Regularly test restore into a non-production database and run:

```bash
npx prisma migrate status
npm run build
npm run test
```

## Object Storage

Employee documents, contract files, signatures, task attachments, KPI evidence, and export files may live outside PostgreSQL. Back up object storage with provider-native versioning or scheduled copies.

## Migration Compatibility

Before risky migrations, take a database backup and confirm the application image contains the same `prisma/migrations` directory that will be deployed.
