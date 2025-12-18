# Backend Documentation

## Tech Details
- **Framework**: FastAPI
- **Server**: Uvicorn
- **Integration**: Supabase-py

## API Reference

### `POST /events`
Receives behavioral signals from learners.
- **Payload**: ` { user_id: string, event_type: string, metadata: object } `
- **Logic**: 
    1. Saves event to Supabase.
    2. Runs alert checking logic.
    3. Broadcasts "ACTIVITY" to all connected Tutors.

### `POST /control-action`
Receives remote control commands from tutors.
- **Payload**: ` { tutor_id: string, learner_id: string, action_type: 'switch_mode', new_mode: string } `
- **Logic**:
    1. Saves action to Supabase.
    2. Sends a targeted WebSocket message to the `learner_id`.

## Alert Logic
Currently implemented in-memory for the demo:
- **Rule 1**: 5 'pause' events within 60 seconds triggers an `excessive_pausing` alert.
- **Rule 2**: 'idle' event (30s inactivity) triggers a `long_idle` alert. (WIP)
