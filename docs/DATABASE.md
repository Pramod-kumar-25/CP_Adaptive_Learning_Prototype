# Database Documentation

The prototype uses **Supabase (PostgreSQL)** for persistent storage of behavior events, session logs, and remote control actions.

## Identity Management
For robust demo tracking, `id` fields in this prototype are **text-based** rather than UUIDs. 
- **Format**: `name@example.com` is transformed into `name_example_com` for use as a primary key.
- **Benefit**: Simplifies WebSocket debugging and live-log readability.

## Tables

### `users`
Tracks system participants and authentication data.
- `id`: TEXT PRIMARY KEY
- `email`: TEXT UNIQUE NOT NULL
- `password`: TEXT NOT NULL (Default: `pass123`)
- `role`: 'learner' or 'tutor'

### `behavior_events`
The raw behavioral event stream.
- `id`: BIGINT (Identity)
- `user_id`: Target Learner
- `event_type`: play, pause, seek, scroll, idle, login
- `metadata`: JSONB payload
- `created_at`: TIMESTAMP

### `alerts`
Processed events requiring tutor intervention.
- `user_id`: Target Learner
- `alert_type`: excessive_pausing, long_idle
- `message`: Contextual alert string

### `control_actions`
Audit log of tutor medium-switching.
- `tutor_id`: Action source
- `learner_id`: Action target
- `action_type`: 'switch_mode'
- `new_mode`: video, text, audio

### `session_logs`
Tracks login/logout timestamps for performance reporting.
