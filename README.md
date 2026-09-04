# Digital Forensics Platform — Backend

API for running digital forensics investigations: cases, evidence with hash
verification and chain of custody, an event timeline, and analytics over them.

Companion frontend:
[`digital-forensics-platform_frontend`](https://github.com/MergenUchiha/digital-forensics-platform_frontend).

## Stack

| | |
|---|---|
| Runtime | Node.js 20+ |
| Framework | NestJS 10 (Express) |
| Database | SQLite via Prisma 5 |
| Auth | JWT (passport-jwt), bcrypt, role and ownership guards |
| Validation | Zod 3 |
| i18n | nestjs-i18n — English, Russian, Turkmen |
| Docs | Swagger at `/api/docs` |

## Getting started

```bash
bun install                  # or npm install
cp .env.example .env         # then fill in the required values

# generate a signing key
openssl rand -base64 48

npx prisma migrate dev       # creates prisma/dev.db
npm run prisma:seed          # admin account plus four demo cases
npm run start:dev
```

The API listens on `http://localhost:5001/api`, Swagger on `/api/docs`, and a
health check on `/api/health`.

### Environment

Every variable is validated at boot: the process stops with a readable message
rather than failing later inside a library. See
[`.env.example`](.env.example).

| Variable | Required | Default | Purpose |
|---|:---:|---|---|
| `DATABASE_URL` | yes | — | SQLite file, e.g. `file:./dev.db` |
| `NODE_ENV` | no | `development` | `development`, `test` or `production` |
| `PORT` | no | `5001` | HTTP port |
| `JWT_SECRET` | yes | — | Token signing key, minimum 32 characters |
| `JWT_EXPIRES_IN` | no | `7d` | Token lifetime |
| `SEED_ADMIN_EMAIL` | seeding | — | Administrator created by the seeder |
| `SEED_ADMIN_PASSWORD` | seeding | — | Minimum 12 characters |
| `CORS_ORIGINS` | no | `http://localhost:3000,http://localhost:5173` | Comma-separated allowed origins |
| `SWAGGER_ENABLED` | no | on outside production | Serves `/api/docs` |
| `MAX_UPLOAD_MB` | no | `100` | Size ceiling for one evidence file |
| `SIEM_URL` | no | — | Forward request logs to a SIEM |
| `SIEM_API_KEY` | no | — | Shared key for `/api/logs`; without it those routes are disabled |

## Accounts and access

There is no public registration. The first account comes from the seeder;
further accounts are created by an administrator through `POST /auth/users`.

Access has two layers.

**Role.** `ADMIN` or `ANALYST`. Destructive operations — deleting a case, a
piece of evidence or a timeline event — and the account directory are
administrator-only.

**Ownership.** An analyst sees the cases they opened and the cases assigned to
them, along with the evidence and timeline events under those cases. An
administrator sees everything. Evidence and timeline access is derived from the
case, so there is one rule rather than three.

## Endpoints

All paths are under `/api`.

### Auth

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | public | Exchange credentials for a JWT |
| POST | `/auth/users` | admin | Create an account |
| GET | `/auth/users` | admin | List accounts |

### Cases

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/cases` | any | Cases the caller may see; `?status=` filters |
| GET | `/cases/:id` | owner or admin | One case with evidence and timeline |
| POST | `/cases` | any | Open a case |
| PUT | `/cases/:id` | owner or admin | Update title, description, severity, status, tags, assignee |
| DELETE | `/cases/:id` | admin | Delete the case, its evidence, chain of custody, timeline and stored files |

### Evidence

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/evidence` | any | Evidence from visible cases; `?caseId=` filters |
| GET | `/evidence/:id` | owner or admin | One item with its chain of custody |
| GET | `/evidence/:id/file` | owner or admin | Download the artefact |
| POST | `/evidence` | any | Create, optionally with a `multipart/form-data` file |
| DELETE | `/evidence/:id` | admin | Delete the record and the stored file |

### Timeline

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/timeline` | any | `?caseId=`, `?severity=`, `?limit=` (max 500) |
| GET | `/timeline/:id` | owner or admin | One event |
| POST | `/timeline` | any | Add an event to a case |
| DELETE | `/timeline/:id` | admin | Remove an event |

### Analytics, users, notifications

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/analytics/dashboard` | any | Case, evidence and event counts for the caller |
| GET | `/analytics/time-series?hours=` | any | Hourly event counts, 1–8760 |
| GET | `/analytics/severity-distribution` | any | Events by severity |
| GET | `/analytics/source-distribution` | any | Top ten event sources |
| GET | `/users/me` | any | The signed-in account |
| GET | `/users` | admin | Account directory |
| PUT | `/users/me` | any | Change your display name |
| PUT | `/users/me/password` | any | Change your own password |
| GET/PUT/DELETE | `/notifications…` | any | Per-user notifications |

## Evidence handling

An uploaded file is stored under `uploads/` with a generated name. Both an MD5
and a SHA-256 digest are computed by streaming the file, and both are recorded
with the evidence, which is what makes it verifiable later. A record created
without a file has no hashes rather than random ones.

Uploads are capped by `MAX_UPLOAD_MB`. The stored name never keeps an extension
the browser would render — `.html`, `.svg`, `.js` and friends become `.bin` —
and downloads are served as `application/octet-stream` with `nosniff` and a
restrictive `Content-Security-Policy`, so an artefact cannot execute in the
API's own origin. The name it was uploaded under is preserved separately and
used for the download.

Deleting evidence, or the case above it, removes the files from disk too.

## Database

SQLite through Prisma, which has neither scalar lists nor a JSON column type,
so `Case.tags`, `Evidence.metadata` and the list fields on `TimelineEvent` hold
JSON as text. `src/common/utils/json-columns.ts` is the only place that knows
this; the REST payloads carry real arrays and objects.

```
User                 id, email, password, name, role, avatar, timestamps
Case                 id, title, description, status, severity, tags,
                     location*, counters, createdById, assignedToId
Evidence             id, name, type, description, filePath, fileSize,
                     originalFilename, md5Hash, sha256Hash, iotDeviceType,
                     metadata, caseId, uploadedById
ChainOfCustodyEntry  id, action, notes, signature, timestamp, evidenceId,
                     performedById
TimelineEvent        id, timestamp, type, source, severity, title,
                     description, metadata, ipAddresses, usernames, files,
                     devices, caseId
```

## Internationalisation

Error and status messages are translated into English, Russian and Turkmen.
The language comes from the `x-lang` header, falling back to `Accept-Language`
and then to English. Translations live in `src/i18n/<lang>/common.json` and are
copied to `dist/i18n` at build time.

## Scripts

```bash
npm run build          # tsc -> dist/main.js
npm run start:dev      # watch mode
npm run start:prod     # node dist/main
npm run lint           # ESLint with type-aware rules
npm run prisma:migrate # apply migrations
npm run prisma:seed    # administrator plus demo data
npm run prisma:studio  # browse the database
npm run db:setup       # generate, migrate and seed in one step
```

## Known limitations

* **No tests.** Correctness was checked by running the API and exercising it
  by hand; there is no automated suite.
* **Notifications live in memory** and do not survive a restart.
* **Tokens cannot be revoked before they expire.** There is no refresh token
  and no session store. Deleting an account does cut its token off at once —
  the role and the account's existence are read from the database on every
  request rather than trusted from the token.
* **No rate limiting** on login or on evidence upload.
* **Chain of custody entries are written but never signed.** The `signature`
  column exists and nothing fills it, so the chain records who did what and
  when, but does not prove it.
* **Evidence is stored on the local filesystem** under `uploads/`, with no
  integrity re-check after the initial hash and no object storage backend.

## Licence

MIT
