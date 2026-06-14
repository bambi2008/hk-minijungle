# Grow Clinic Product Readiness

This prototype is now structured as a local MVP with replaceable production seams.

## Vision Recognition

Current state:
- `/api/vision/analyze` is a local heuristic placeholder.
- Frontend performs lightweight color and quality checks, then calls `/api/vision/analyze`.
- Intake photos are saved as per-photo-type baselines so follow-up photos can be compared against the matching view when available.

Production replacement:
- Do not start by training on a large custom image dataset. V1 should call a general multimodal vision model through the same `/api/vision/analyze` contract, then collect opt-in images and confirmed outcomes for later improvement.
- Fine-tuning or custom training becomes useful only after the product has enough labeled examples per crop, symptom, photo type, and growth stage.
- Keep a local fallback for demos, offline use, and provider failures.
- Replace `/api/vision/analyze` with a real vision model adapter.
- Required outputs:
  - photo type: plant, leaf, root, flower, pest
  - findings: yellowing, curling, spots, pest signs, algae, white fuzz, wilting, flower drop
  - quality: blur, brightness, exposure, crop distance
  - follow-up comparison: improved, unchanged, worse

## Database

Current state:
- Reports and notification jobs are stored in `data/grow-clinic.sqlite`.
- `data/diagnosis-reports.json` and `data/notification-jobs.json` remain legacy backups and migration sources.
- `/api/storage/status` reports the active storage engine and record counts.

Recommended production schema:
- users: id, contact, locale, consent flags
- plants: id, user_id, crop_key, variety, medium, created_at
- images: id, plant_id, type, url, quality_json, vision_json, captured_at
- diagnoses: id, plant_id, version, top_risk, confidence, report_json, created_at
- prescriptions: id, diagnosis_id, action, due_window, status
- followups: id, diagnosis_id, reminder_key, due_at, completed_at, result_json
- notification_jobs: id, followup_id, channel, due_at, status, provider_response

Migration path:
1. SQLite for local/internal beta.
2. Postgres/Supabase or cloud SQL for multi-user production.
3. Object storage for images.
4. Add row-level ownership and consent controls before public beta.

## Notifications

Current state:
- `/api/notifications/schedule` creates local jobs only.
- `/api/notifications/due` exposes due jobs.
- `PATCH /api/notifications/:id` updates job state.
- No external messages are sent.

Production channels:
- WeChat mini program subscription messages
- SMS
- Email
- In-app push

Scheduling rule:
- V1 uses fixed windows: 24h, 48h, day 3, day 7.
- Prescription rules enable only relevant windows.
- V2 recalculates from the moment the user marks an action complete.

## Crop Models

Current API:
- `/api/crop-models`

First batch:
- dwarf tomato: pollination, fruit set, light, heat, water swing
- basil: pruning, leggy growth, continuous harvest, low light
- rosemary: overwatering, airflow, root hypoxia, low light
- strawberry: pollination, wet crown, deformed fruit, fungal signs
- compact pepper: flower drop, heat, low light, water swing

## Important Product Rule

Customer mode should stay photo-first:
- ask for one photo at a time
- auto-check quality
- ask for missing photos only when needed
- show one next action
- keep internal analytics hidden from customers
