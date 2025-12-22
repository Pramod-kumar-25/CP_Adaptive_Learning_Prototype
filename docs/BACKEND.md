# Backend Documentation

## Tech Details
- **Framework**: FastAPI
- **Real-time**: WebSockets
- **Database Integration**: Supabase-py (PostgreSQL)

## API Reference

### `POST /login`
Authenticates a user against the Supabase database.
- **Payload**: `{ email: string, password: string }`
- **Response**: `{ status: "success", user: { id, email, role } }`
- **Logic**: Performs a strict lookup of email/password/role.

### `POST /register_user`
Seamlessly registers or updates users in the database.
- **Payload**: `{ id: string, email: string, role: string, password?: string }`
- **Logic**: Uses Upsert logic. If no password is provided, defaults to `pass123`.

### `POST /events`
Receives behavioral signals (play, pause, scroll, idle, login).
- **Payload**: `{ user_id: string, event_type: string, metadata: object }`
- **Broadcast**: Emit `ACTIVITY` to all connected Tutors for the live system log terminal.

### `POST /control-action`
Executes remote medium switching from Tutor to Learner.
- **Payload**: `{ tutor_id: string, learner_id: string, action_type: 'switch_mode', new_mode: string }`
- **Logic**: Targeted WebSocket message to specific `learner_id`.

## Alert & Sync Logic
- **WebSocket Manager**: Maintains a map of `user_id -> {ws, role, email, mode}`.
- **Broadcasting**:
    - `STUDENT_LIST`: Pushed to Tutors whenever someone connects/disconnects.
    - `ALERT`: Triggered when 5 pauses occur in < 60s.
- **Cross-Reference**: The `/students` endpoint blends live WebSocket state with the Supabase `users` table to track offline/online status.
