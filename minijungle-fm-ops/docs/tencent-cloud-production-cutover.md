# Tencent Cloud production cutover

This is the runbook for the DR FOREST production path on Hong Kong Tencent Cloud. It does not change the existing Bridge Shen services. The pilot stack remains on SQLite/local media until the external checks below are complete.

## 1. TencentDB PostgreSQL

Create a Hong Kong TencentDB PostgreSQL instance with private networking, TLS, point-in-time recovery, automated snapshots and a restricted application account. The Lighthouse host must be able to reach the TencentDB private endpoint through the approved VPC/security-group route. Do not expose port 5432 to the public internet.

Set the connection URL only in the deployment secret manager or a local, untracked `.env.production` file. URL-encode the username and password:

```text
DR_FOREST_DATABASE_URL=postgresql://ops_app:<url-encoded-password>@<private-tencentdb-endpoint>:<port>/dr_forest_ops?sslmode=require
DR_FOREST_STORAGE_BACKEND=postgres
```

From the deployment runner, apply and verify all repository migrations:

```powershell
npm.cmd run migrate:postgres:schema -- --out .\evidence\postgres-schema-apply.json
npm.cmd run verify:postgres:schema -- --out .\evidence\postgres-schema-verify.json
```

The migration runner does not seed pilot data. Import only reviewed client, wall, module, work-order and contract data after the schema and relationship checks pass.

## 2. COS media and backup buckets

Create two private COS buckets in Hong Kong: one for proof/camera media and one for encrypted database backups. Use separate bucket policies and credentials with least privilege. The bucket name must include the Tencent APPID suffix, for example `drforest-prod-1250000000`.

Use the COS S3-compatible endpoint and virtual-hosted addressing:

```text
DR_FOREST_OBJECT_STORAGE_PROVIDER=cos
DR_FOREST_OBJECT_STORAGE_ENDPOINT=https://cos.ap-hongkong.myqcloud.com
DR_FOREST_OBJECT_STORAGE_REGION=ap-hongkong
DR_FOREST_OBJECT_STORAGE_STYLE=virtual
DR_FOREST_OBJECT_STORAGE_BUCKET=drforest-prod-1250000000
DR_FOREST_PROOF_MEDIA_BACKEND=s3
DR_FOREST_BACKUP_DESTINATION=s3://drforest-backup-1250000000/hk/prod
```

The application resolves the media object host as `bucket.cos.ap-hongkong.myqcloud.com`. Do not put SecretId or SecretKey in browser code, URLs or committed files. COS supports AWS Signature V4, and Tencent recommends HTTPS; newly created buckets should use virtual-hosted style. See the official [COS S3-compatible configuration](https://intl.cloud.tencent.com/document/product/436/34688?lang=en).

Run the connectivity probe from the deployment runner. It performs a signed PUT, GET checksum comparison and DELETE. It does not set the production evidence marker:

```powershell
npm.cmd run probe:cos
```

The probe output is connectivity evidence only. A real proof image must still pass the media upload, readback, retention and malware-scan acceptance path before `DR_FOREST_MEDIA_SCAN_VERIFIED=verified` is allowed.

The application stores each scanner callback in `proof_media_scan_results` with a foreign key to the media ledger. Record the scanner result only after the scanner has checked the exact uploaded bytes:

```powershell
$scan = @{ scanId = "cos-scan-<id>"; provider = "<approved-scanner>"; status = "clean"; sha256 = "<media-sha256>"; scannedAt = (Get-Date).ToUniversalTime().ToString("o"); recordedBy = "<scanner-principal>"; note = "Clean result for the exact COS object bytes." } | ConvertTo-Json
Invoke-WebRequest -UseBasicParsing -Method Put -ContentType "application/json" -Headers @{ Authorization = "Bearer <short-lived-oidc-token>" } -Body $scan https://ops.example.com/api/proof/media-evidence/<media-id>/scan
```

Production media downloads are blocked unless the latest scan status is `clean`; a hash mismatch is also blocked. A pilot scan record is a contract test, not malware-scanning evidence.

## 3. Encrypted off-host backup and isolated restore

The production image includes `pg_dump` and `pg_restore`. Create an encrypted custom-format archive, upload the archive and manifest to the separate COS backup bucket, then verify the remote bytes:

```powershell
npm.cmd run backup:postgres -- --out .\evidence\postgres-backup-<timestamp> --upload
```

First verify the downloaded off-host archive without writing to a database:

```powershell
npm.cmd run restore:postgres -- --from-offhost --verify-only
```

Then restore the remote copy into a separately provisioned isolated TencentDB/PostgreSQL database. The target must not be the source database:

```powershell
$env:DR_FOREST_RESTORE_DATABASE_URL = "postgresql://restore_user:<password>@<isolated-endpoint>:<port>/dr_forest_restore?sslmode=require"
npm.cmd run restore:postgres -- --from-offhost --target-url $env:DR_FOREST_RESTORE_DATABASE_URL
```

Keep the backup manifest, remote readback report, restore report, timestamps and operator identity in the release evidence folder. Only after an independent reviewer accepts the drill may `DR_FOREST_OFFHOST_RESTORE_DRILL=verified` be recorded.

For scheduled production operation, use `npm.cmd run backup:runtime`. The monitored wrapper selects the PostgreSQL backup implementation and adds `--upload`; it does not run the SQLite backup path in production. Review local retention candidates with `npm.cmd run backup:retention:plan`. Configure the authoritative retention lifecycle on the COS backup bucket separately and retain that Tencent Cloud configuration/export as evidence.

## 4. Production container

Copy `.env.production.example` to an untracked `.env.production`, replace every placeholder through the approved secret process, and set all evidence markers to `pending` until their corresponding real checks pass. Start the production compose only after the external database, COS, identity and monitoring resources are ready:

```powershell
docker compose --env-file .env.production -f docker-compose.production.example.yml build
docker compose --env-file .env.production -f docker-compose.production.example.yml up -d
docker compose --env-file .env.production -f docker-compose.production.example.yml ps
```

Readiness must report PostgreSQL and S3 backends. A HTTP 200 from the staging URL, a local PostgreSQL rehearsal or a successful COS probe is not a production sign-off by itself.

## Release boundary

This cutover clears the database, media and recovery engineering path only after the real cloud checks pass. It does not create real device telemetry, customer service cycles, signed client acceptance or complete ESG assurance evidence. Do not change any `DR_FOREST_*_VERIFIED` marker by hand to make the application appear ready.
