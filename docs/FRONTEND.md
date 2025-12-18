# Frontend Documentation

## Tech Details
- **Framework**: React 18+
- **Styling**: Vanilla CSS with CSS Variables for theme management.
- **Icons**: Lucide-React
- **Animations**: Framer Motion

## Key Flows

### 1. Learner Flow
- **Dashboard**: A clean, focused interface with a main content area.
- **Event Tracking**: 
    - `scroll`: Debounced tracking of page movement.
    - `video`: Mock events for play/pause to simulate YouTube API integration.
    - `idle`: A 30-second timer that resets on mouse movement. If triggered, it sends an 'idle' event.
- **WebSocket Listener**: Listens for `MODE_SWITCH` messages. Updates the `mode` local state, which swaps the rendered component.

### 2. Tutor Flow
- **Dashboard**: A command center showing active students.
- **Alert Stream**: Real-time display of behavior-triggered alerts (e.g., "Excessive Pausing").
- **Remote Control**: Buttons that trigger `POST /control-action` to the backend.

## Design Aesthetics
The UI uses "Glassmorphism" (semi-transparent blurred cards) on a dark slate background to provide a modern, premium feel suitable for a tech-forward prototype.
