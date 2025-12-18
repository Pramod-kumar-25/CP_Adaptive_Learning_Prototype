# Database Documentation

The prototype uses **Supabase (PostgreSQL)**.

## Tables

### `users`
Tracks system participants.
- `id`: UUID
- `email`: Personal identifier
- `role`: 'learner' or 'tutor'

### `behavior_events`
The raw event stream.
- `user_id`: Link to learner
- `event_type`: play, pause, seek, scroll, idle
- `metadata`: JSON payload (e.g., scroll percentage)

### `alerts`
Processed events that require attention.
- `user_id`: Target student
- `alert_type`: excessive_pausing, long_idle
- `message`: Human-readable description

### `control_actions`
Log of tutor interventions.
- `tutor_id`: Who took action
- `learner_id`: Target student
- `action_type`: 'switch_mode'
- `new_mode`: video, text, audio

### `session_logs`
Tracks login/logout performance.
