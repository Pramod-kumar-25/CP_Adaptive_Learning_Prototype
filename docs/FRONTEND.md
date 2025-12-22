# Frontend Documentation

## Tech Details
- **Framework**: React 18+
- **Styling**: Modern CSS with Glassmorphism, CSS Variables, and Flex/Grid layouts.
- **Icons**: Lucide-React
- **Animations**: Framer Motion (for modal-like cards and mode switching).

## UI Architecture

### 1. Unified Landing Portal
The application starts with a **Role Selection** screen (`step: 'selection'`). 
- **Learner Portal**: Leads to the classroom environment.
- **Tutor Console**: Leads to the control center.
- **Role Enforcement**: Authentication is checked against the selected role to prevent spoofing.

### 2. Learner Dashboard
A focused learning environment with a persistent sidebar.
- **Cinema Mode Video**: Uses the **YouTube IFrame Player API** for pixel-perfect tracking of `play` and `pause` events directly within the embedded player.
- **Audio Visualizer**: Features a pulsing animation synced with the background instrumental podcast.
- **Behavioral Sensors**:
    - `scroll`: Tracks reading progress in Text Mode.
    - `idle`: 30-second inactivity sensor that resets on interaction.
    - `live`: Constant status ping to the Tutor via WebSockets.

### 3. Tutor Dashboard (Split Layout)
A command center designed for high-density monitoring.
- **Control Grid**: Individual cards for each student to remotely trigger `MODE_SWITCH`.
- **System Log Terminal**: A bottom-anchored, monospace terminal that streams raw JSON-like events directly from the student's clients.
- **Critical Alerts**: A top-priority section for behavior-driven warnings (e.g., "Excessive Pausing").

## Design Language
The UI uses a "Dark Mode First" philosophy with:
- **Glassmorphism**: 半透明 blurred backgrounds for a premium, lightweight feel.
- **Neon Accents**: Primary (Indigo) for Learners, Accent (Emerald) for Tutors.
- **Vibrant Blobs**: Animated background decor to provide depth.
