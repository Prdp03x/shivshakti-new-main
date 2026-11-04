# Shivshakti Backup & Restore

## Enable the feature

Add a long random secret to `server/.env`:

```env
BACKUP_RESTORE_KEY=replace-with-a-long-random-secret
```

Restart the Express server after changing the environment file. For Render, add the same variable in the backend service's Environment settings. Do not add this key to the Vite frontend `.env` or commit it to Git.

## Create a backup

Open **Settings** in Shivshakti Billing, enter the `BACKUP_RESTORE_KEY`, and select **Download Backup (.json)**. The downloaded JSON includes the four app collections: parties, items, transactions and units. MongoDB ObjectIds and dates are stored as Extended JSON so references and date values can be reconstructed.

Keep backup files private and store a copy away from the computer running the app.

## Restore a backup

Open **Settings**, enter the same key, select a valid Shivshakti backup JSON, review its collection counts, type `RESTORE`, and confirm. Restore replaces the current documents in the four app collections in one MongoDB transaction. It does not drop collections, remove their indexes, or modify unrelated collections in the database.

**Warning:** Restore replaces current business data and cannot be undone. Download a backup of the current database before restoring. MongoDB transactions require a replica set or sharded cluster; MongoDB Atlas supports this.

## Security

The backend refuses backup/restore requests unless `BACKUP_RESTORE_KEY` is configured and the request includes the matching `x-backup-key` header. Use HTTPS in production. The frontend keeps the key in session storage only for the current browser tab/session and does not include it in the Vite build.
