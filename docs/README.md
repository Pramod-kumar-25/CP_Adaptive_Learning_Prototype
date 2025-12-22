# Adaptive Learning Prototype: "Universal Remote Control"

This prototype demonstrates a **Teacher with a Universal Remote Control** concept. It allows educators to monitor learner behavior in real-time and instantly adjust the learning medium (Video, Text, Audio) to maintain engagement and improve learning outcomes.

## 🚀 Vision
In a world of digital-first education, students often get distracted or stuck. This system provides:
1. **Real-time Insights**: Tutors see live alerts and a **Live System Log Terminal** when a student is disengaged (e.g., excessive pausing or long idle periods).
2. **Instant Intervention**: Tutors can switch the student's active content mode with a single click—no page refreshes, no delays.
3. **Human-in-the-Loop**: Instead of a purely automated black-box AI, this empowers the human educator with "superpowers."

## 🎨 Premium Experience
The prototype features a modern **Glassmorphism** interface with neon highlights:
- **Hero Landing**: An immersive role-selection portal for Learners and Tutors.
- **Cinema Mode**: A high-end video player with auto-hiding metadata overlays.
- **Audio Visualizers**: Dynamic pulse animations for audio-based learning.

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Glassmorphism CSS, Framer Motion, Lucide Icons.
- **Backend**: Python (FastAPI), WebSockets for real-time signaling.
- **Database**: Supabase (PostgreSQL) for persistence and authentication.

## 🏃 Quick Start

### 1. Database Setup
1. Create a project at [Supabase](https://supabase.com).
2. Run the SQL located in `/database/schema.sql` to setup tables and default learners.
3. Obtain your `SUPABASE_URL` and `SUPABASE_ANON_KEY`.

### 2. Backend Setup
1. Navigate to `/backend`.
2. Create a `.env` file:
   ```env
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_key
   ```
3. Install dependencies: `pip install -r requirements.txt`
4. Run server: `python main.py` (Server runs on port 8000)

### 3. Frontend Setup
1. Navigate to `/frontend`.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev` (Runs on port 5173)

### 4. Running the Demo
1. Open two browser windows.
2. Choose your role on the **Universal Remote** landing page.
3. **Tutor**: Login with `tutor@example.com` / `admin123`.
4. **Learner**: Login with `pramod@example.com` / `pass123`.
5. In Learner tab, play the YouTube video or Audio podcast.
6. Watch the Tutor console's **System Log** for real-time play/pause events.
7. In Tutor console, click "Text" or "Audio" to remotely switch the Learner's view!
