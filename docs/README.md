# Adaptive Learning Prototype: "Universal Remote Control"

This prototype demonstrates a **Teacher with a Universal Remote Control** concept. It allows educators to monitor learner behavior in real-time and instantly adjust the learning medium (Video, Text, Audio) to maintain engagement and improve learning outcomes.

## 🚀 Vision
In a world of digital-first education, students often get distracted or stuck. This system provides:
1. **Real-time Insights**: Tutors see live alerts when a student is disengaged (e.g., excessive pausing or long idle periods).
2. **Instant Intervention**: Tutors can switch the student's active content mode with a single click—no page refreshes, no delays.
3. **Human-in-the-Loop**: Instead of a purely automated black-box AI, this empowers the human educator with "superpowers."

## 🛠️ Tech Stack
- **Frontend**: React (Vite), Tailwind-inspired CSS, Lucide Icons, Framer Motion.
- **Backend**: Python (FastAPI), WebSockets for real-time signaling.
- **Database**: Supabase (PostgreSQL) for persistence.

## 🏃 Quick Start

### 1. Database Setup
1. Create a project at [Supabase](https://supabase.com).
2. Run the SQL located in `/database/schema.sql` in the Supabase SQL Editor.
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
1. Open two browser windows/tabs.
2. Tab 1: Login as **Tutor**.
3. Tab 2: Login as **Learner**.
4. In Learner tab, click "Mock Pause" repeatedly (5 times in 60s).
5. Watch the Tutor tab for the real-time Alert.
6. In Tutor tab, click "Text" or "Audio" buttons.
7. Watch the Learner tab update instantly!
