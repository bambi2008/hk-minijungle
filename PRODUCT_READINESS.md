# FiveCrop Product Readiness

This prototype is now structured as a local MVP with replaceable production seams.

## Brand Naming

Current product name direction:
- Brand: FiveCrop
- App Store title: `FiveCrop: Plant Doctor`
- App Store subtitle: `Care for 5 edible plants`

App Store positioning:
- App name: `FiveCrop: Plant Doctor`
- Subtitle: `Care for 5 edible plants`
- Short description: Photo-first diagnosis and follow-up care for five indoor edible crops: dwarf tomato, basil, rosemary, strawberry, and compact pepper.
- Primary keywords: plant doctor, plant care, indoor garden, edible plants, tomato, basil, strawberry, pepper, rosemary.

Rationale:
- Keep the brand short, memorable, and easy to spell.
- Include searchable App Store intent terms such as `Plant Doctor` and `Plant Care`.
- Signal the product boundary: care and diagnosis for five indoor edible crops.

## App Store First Screens

Goal:
- The first four screenshots should sell the complete loop in order: photo -> one next action -> follow-up proof -> five-crop focus.
- Use real app UI states, not marketing mockups. Each screenshot should look like a customer can immediately understand what to do.
- Keep each caption short and action-led; do not mention internal AI, confidence formulas, graph paths, or backend storage.

Screenshot 1: photo diagnosis
- Caption: `Snap a plant photo. Get a diagnosis.`
- Promise: FiveCrop starts from one clear plant photo, not a long form.
- UI state: customer mode, intake/photo upload active, crop selected, camera/photo card visible.
- Visual: phone frame showing a tomato or basil photo preview and the first action button.
- Avoid: showing expert controls, multi-step forms, raw report text, or implementation labels.

Screenshot 2: one next step
- Caption: `Only one next step for today.`
- Promise: the customer does not need to compare many possible remedies.
- UI state: diagnosis result after a golden path, with the compact plan focused on `今天做什么`.
- Visual: highlight the single primary action and keep the supporting reason secondary.
- Avoid: cause rankings, long checklists, internal confidence cards, or multiple equal-weight buttons.

Screenshot 3: follow-up proof
- Caption: `Come back and see if it improved.`
- Promise: FiveCrop closes the loop instead of giving a one-off diagnosis.
- UI state: reminder/follow-up due, same-angle photo requested or comparison result visible.
- Visual: before/after or "current vs follow-up" treatment using the rosemary or strawberry golden path.
- Avoid: calendar-heavy scheduling UI, notification plumbing, or technical comparison metrics.

Screenshot 4: five edible indoor crops
- Caption: `Built for five edible indoor crops.`
- Promise: narrow scope means more relevant advice for tomato, basil, rosemary, strawberry, and pepper.
- UI state: crop chooser or crop model overview with all five crops visible.
- Visual: five crop tiles with simple plant names and one representative symptom each.
- Avoid: generic houseplant language, ornamental plants, or a broad plant encyclopedia feel.

Copy hierarchy:
- App name/offer: `FiveCrop: Plant Doctor`
- Subtitle: `Care for 5 edible plants`
- Screenshot captions:
  - `Snap a plant photo. Get a diagnosis.`
  - `Only one next step for today.`
  - `Come back and see if it improved.`
  - `Built for five edible indoor crops.`

Production checklist:
- Capture all four screenshots from customer mode.
- Use one golden path per screenshot where possible: tomato photo diagnosis, basil one next step, rosemary follow-up, five-crop crop chooser.
- Keep the first screenshot visually strongest because it carries the listing thumbnail decision.
- Reuse the same phone frame, crop-safe top/bottom margins, and caption style across all four assets.

## Vision Recognition

Current state:
- `/api/vision/analyze` uses the OpenAI Responses API when `OPENAI_API_KEY` is configured, with strict JSON schema output for the app contract.
- The local heuristic adapter remains as a fallback for missing images, missing credentials, quota/rate failures, network failures, or invalid model JSON.
- Frontend performs lightweight color and quality checks, then calls `/api/vision/analyze`.
- Intake photos are saved as per-photo-type baselines so follow-up photos can be compared against the matching view when available.
- `npm run vision:smoke` runs a live OpenAI vision adapter check against a generated test image without writing persistent data.
- `npm run vision:golden` runs live OpenAI checks for all five golden-path crops against generated test images, then verifies the follow-up comparison contract. It uses a temporary data directory and is intentionally not executed by the default check script because it calls the paid API.
- OpenAI vision requests have a default 45 second timeout via `OPENAI_REQUEST_TIMEOUT_MS` so customer diagnosis falls back instead of waiting indefinitely.

Production replacement:
- Do not start by training on a large custom image dataset. V1 should call a general multimodal vision model through the same `/api/vision/analyze` contract, then collect opt-in images and confirmed outcomes for later improvement.
- Fine-tuning or custom training becomes useful only after the product has enough labeled examples per crop, symptom, photo type, and growth stage.
- Keep a local fallback for demos, offline use, and provider failures.
- Keep monitoring live adapter failures such as 429 quota/rate errors and surface them as fallback reasons instead of breaking diagnosis.
- Required outputs:
  - photo type: plant, leaf, root, flower, pest
  - findings: yellowing, curling, spots, pest signs, algae, white fuzz, wilting, flower drop
  - quality: blur, brightness, exposure, crop distance
  - follow-up comparison: improved, unchanged, worse

## Customer Trust And Privacy

Current MVP rule:
- Customer mode shows one short trust explanation with 2-3 evidence points only: photo type, visible symptoms, and the missing or next photo.
- Internal pathway IDs, model routing, raw confidence math, and diagnostic graph details stay hidden from customer mode.
- The privacy notice states when a compressed plant photo is sent for real vision analysis, that FiveCrop does not save original images into cases, and that photos are not used by default for model training or improvement.
- A visible customer action clears this browser's local photo preview, baseline photo, reminders, and follow-up records.

Before public beta:
- Add authenticated server-side delete/export controls for reports, metadata, and any future object-storage images.
- Add explicit opt-in before using customer images for model improvement datasets.

## P2 Long-Term Moat

Current implementation:
- `p2-growth.js` is the first split-out browser module from `app.js`; it owns P2 data schema, correction records, pricing boundaries, and lightweight funnel analytics.
- Diagnosis reports now include an `annotation` object shaped for future training data: crop, stage, photo type, symptoms, visuals, predicted diagnosis, corrected diagnosis, and final outcome.
- Expert mode includes a P2 panel for annotation preview, expert correction, subscription boundary, and experiment metrics.
- `/api/p2-growth` summarizes server-side report coverage for labeling readiness, action completion, follow-up return, and monetization boundaries.

Label schema:
- cropKey
- stageKey
- photoType
- symptoms
- visuals
- predictedDiagnosis
- correctedDiagnosis
- finalOutcome

Correction loop:
- Internal reviewers can save a corrected diagnosis and outcome from the expert panel.
- Corrections are stored locally in the browser for MVP validation and create structured training-ready records.
- Public beta should persist corrections server-side with reviewer identity, source image IDs, and audit timestamps.

Monetization boundary:
- Free: 3 photo diagnoses, one next action, basic follow-up reminder.
- Plus: advanced follow-up, before/after comparison, unlimited case history.
- Expert Review: human correction or expert advice.

Lightweight experiment dashboard:
- Conversion rate proxy: paid boundary shown.
- Photo completion rate.
- Follow-up return rate.
- Diagnosis-to-action completion rate.
- Correction rate.

Refactor direction:
- Keep splitting `app.js` by product capability, starting with growth/data modules that have minimal dependencies.
- Next split candidates: vision/photo pipeline, customer follow-up loop, case/notification manager, and expert analytics.

## Database

Current state:
- Reports and notification jobs are stored in `data/grow-clinic.sqlite`.
- `data/diagnosis-reports.json` and `data/notification-jobs.json` remain legacy backups and migration sources.
- `/api/storage/status` reports the active storage engine and record counts.
- API tests and live vision smoke tests run against temporary data directories and assert that protected demo data files are not modified.

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
- `/api/golden-paths`

First batch:
- dwarf tomato: pollination, fruit set, light, heat, water swing
- basil: pruning, leggy growth, continuous harvest, low light
- rosemary: overwatering, airflow, root hypoxia, low light
- strawberry: pollination, wet crown, deformed fruit, fungal signs
- compact pepper: flower drop, heat, low light, water swing

Golden paths:
- Tomato flower drop: flower photo -> pollination/light/temperature diagnosis -> one pollination action -> 3-7 day flower follow-up.
- Basil leggy growth: plant photo -> low-light/late-pruning diagnosis -> prune and move light closer -> 7 day side-view follow-up.
- Rosemary wet root decline: root photo -> overwatering/root hypoxia diagnosis -> stop watering and ventilate -> 48 hour root/shoot follow-up.
- Strawberry pollination/wet crown: flower/root photos -> crown moisture plus fruit-set risk -> dry crown and hand-pollinate -> 48 hour crown or 3-5 day flower follow-up.
- Pepper flower drop: flower photo -> heat/light/water-swing diagnosis -> stabilize temperature and pollinate -> 5-7 day flower/young-fruit follow-up.

## Important Product Rule

Customer mode should stay photo-first:
- ask for one photo at a time
- auto-check quality
- ask for missing photos only when needed
- show one next action
- keep internal analytics hidden from customers
