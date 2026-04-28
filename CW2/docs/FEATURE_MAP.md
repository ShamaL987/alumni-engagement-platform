# Feature Map

## Alumni platform

Routes under `/alumni/*`.

- `/alumni/profile` — create/update/clear alumni profile.
- `/alumni/development` — create professional-development item.
- `/alumni/development/:id/update` — update professional-development item.
- `/alumni/development/:id/delete` — delete professional-development item.
- `/alumni/bids` — active bid cycle, current bid, bid history and cancellation.

## Client analytics platform

Routes under `/client/*`.

- `/client/dashboard` — database-driven analytics.
- `/client/alumni` — searchable/filterable alumni list.
- `/client/export.csv` — CSV export from filtered alumni data.
- `/client/presets` — save/delete dashboard filter presets.

Analytics service data sources:

- `profile.skills`
- `profile.programme`
- `profile.graduationYear`
- `profile.industrySector`
- `profile.currentJobTitle`
- `profile.country/city`
- `profile_document.documentType`
- `profile_document.title`
- `profile_document.issuer`
- `bid` and `bidding_cycle` summary counts

## Admin/API security platform

Routes under `/admin/*` and `/api/*`.

- `/admin/api-keys` — create and revoke scoped API keys.
- `/admin/usage` — view API and authenticated request usage.
- `/api/alumni` — requires `read:alumni`.
- `/api/analytics/overview` — requires `read:analytics`.
- `/api/public/alumni-of-day` — requires `read:alumni_of_day`.
