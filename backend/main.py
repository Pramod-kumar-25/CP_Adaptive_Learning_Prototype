import os
import json
import asyncio
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Adaptive Learning API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Setup (To be filled by user in .env)
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- WebSocket Manager ---
class ConnectionManager:
    def __init__(self):
        # user_id -> {websocket, role, email, mode}
        self.active_users: Dict[str, Dict] = {} 

    async def connect(self, user_id: str, role: str, email: str, websocket: WebSocket):
        await websocket.accept()
        self.active_users[user_id] = {
            "ws": websocket,
            "role": role,
            "email": email,
            "mode": "video" # default
        }
        print(f"Connected: {user_id} ({role})")
        await self.broadcast_students()

    def disconnect(self, user_id: str):
        if user_id in self.active_users:
            del self.active_users[user_id]
            print(f"Disconnected: {user_id}")
            asyncio.create_task(self.broadcast_students())

    async def broadcast_students(self):
        # Send list of learners to all tutors
        learners = [
            {"id": uid, "email": info["email"], "mode": info["mode"]}
            for uid, info in self.active_users.items()
            if info["role"] == "learner"
        ]
        msg = {"type": "STUDENT_LIST", "data": learners}
        for info in self.active_users.values():
            if info["role"] == "tutor":
                await info["ws"].send_json(msg)

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_users:
            await self.active_users[user_id]["ws"].send_json(message)

    async def broadcast(self, message: dict, role_filter: Optional[str] = None):
        for info in self.active_users.values():
            if not role_filter or info["role"] == role_filter:
                await info["ws"].send_json(message)

manager = ConnectionManager()

# --- Models ---
class BehaviorEvent(BaseModel):
    user_id: str
    event_type: str
    metadata: Optional[Dict] = {}

class ControlAction(BaseModel):
    tutor_id: str
    learner_id: str
    action_type: str
    new_mode: str

class LoginRequest(BaseModel):
    email: str
    password: str

# --- Alert Logic ---
event_buffer: Dict[str, List[datetime]] = {}

async def check_alerts(event: BehaviorEvent):
    if event.event_type == 'pause':
        user_id = event.user_id
        now = datetime.now()
        if user_id not in event_buffer:
            event_buffer[user_id] = []
        
        event_buffer[user_id].append(now)
        event_buffer[user_id] = [t for t in event_buffer[user_id] if now - t < timedelta(seconds=60)]
        
        if len(event_buffer[user_id]) >= 5:
            alert = {
                "user_id": user_id,
                "alert_type": "excessive_pausing",
                "message": f"Student paused video {len(event_buffer[user_id])} times in a minute.",
                "created_at": now.isoformat()
            }
            if supabase:
                try:
                    supabase.table("alerts").insert(alert).execute()
                except Exception as e:
                    print(f"Supabase Alert Error: {e}")
            
            await manager.broadcast({"type": "ALERT", "data": alert}, role_filter="tutor")

# --- Endpoints ---

@app.get("/")
async def root():
    return {"message": "Adaptive Learning Backend is Running"}

@app.get("/students")
async def get_students():
    if supabase:
        try:
            # Query the users table for learners only
            res = supabase.table("users").select("*").eq("role", "learner").execute()
            learners_from_db = res.data
            
            # Cross-reference with active users for live status
            students = []
            for l in learners_from_db:
                uid = l['id']
                is_online = uid in manager.active_users
                mode = manager.active_users[uid]['mode'] if is_online else "video"
                students.append({
                    "id": uid,
                    "email": l['email'],
                    "mode": mode,
                    "status": "online" if is_online else "offline"
                })
            
            # Also add any online learners not yet in DB (robustness)
            for uid, info in manager.active_users.items():
                if info['role'] == 'learner' and not any(s['id'] == uid for s in students):
                    students.append({
                        "id": uid,
                        "email": info['email'],
                        "mode": info['mode'],
                        "status": "online"
                    })
            
            return students
        except Exception as e:
            print(f"Error fetching students: {e}")
            return []
    return []


@app.get("/alerts")
async def get_alerts():
    if supabase:
        try:
            res = supabase.table("alerts").select("*").order("created_at", desc=True).limit(10).execute()
            return res.data
        except: return []
    return []

@app.get("/activities")
async def get_activities():
    if supabase:
        try:
            res = supabase.table("behavior_events").select("*").order("created_at", desc=True).limit(20).execute()
            return res.data
        except: return []
    return []

@app.post("/register_user")
async def register_user(user: dict = Body(...)):
    if supabase:
        try:
            # Check if user exists
            res = supabase.table("users").select("*").eq("id", user["id"]).execute()
            if not res.data:
                # Use default password if not provided
                if "password" not in user:
                    user["password"] = "pass123"
                supabase.table("users").insert(user).execute()
            return {"status": "success"}
        except Exception as e:
            print(f"Register error: {e}")
            return {"status": "error"}
    return {"status": "no_db"}

@app.post("/login")
async def login(req: LoginRequest):
    if supabase:
        try:
            res = supabase.table("users").select("*").eq("email", req.email).eq("password", req.password).execute()
            if res.data:
                user = res.data[0]
                return {
                    "status": "success",
                    "user": {
                        "id": user["id"],
                        "email": user["email"],
                        "role": user["role"]
                    }
                }
            else:
                raise HTTPException(status_code=401, detail="Invalid email or password")
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            print(f"Login error: {e}")
            raise HTTPException(status_code=500, detail="Database error")
    
    # Mock fallback for demo if no Supabase
    if req.email == "tutor@example.com" and req.password == "admin123":
        return {"status": "success", "user": {"id": "tutor_admin", "email": req.email, "role": "tutor"}}
    if "learner" in req.email and req.password == "pass123":
        uid = req.email.replace("@", "_").replace(".", "_")
        return {"status": "success", "user": {"id": uid, "email": req.email, "role": "learner"}}
    
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/events")
async def receive_event(event: BehaviorEvent):
    if supabase:
        try:
            supabase.table("behavior_events").insert({
                "user_id": event.user_id,
                "event_type": event.event_type,
                "metadata": event.metadata
            }).execute()
        except Exception as e:
            print(f"Supabase Event Error: {e}")
    
    await check_alerts(event)
    await manager.broadcast({"type": "ACTIVITY", "user_id": event.user_id, "event": event.event_type}, role_filter="tutor")
    return {"status": "success"}


@app.post("/control-action")
async def control_action(action: ControlAction):
    if supabase:
        try:
            supabase.table("control_actions").insert({
                "tutor_id": action.tutor_id,
                "learner_id": action.learner_id,
                "action_type": action.action_type,
                "new_mode": action.new_mode
            }).execute()
        except Exception as e:
            print(f"Supabase Action Error: {e}")
    
    # Update local state
    if action.learner_id in manager.active_users:
        manager.active_users[action.learner_id]["mode"] = action.new_mode

    # Send update to learner
    await manager.send_personal_message({
        "type": "MODE_SWITCH",
        "new_mode": action.new_mode
    }, action.learner_id)
    
    # Refresh student list for tutors
    await manager.broadcast_students()
    
    return {"status": "mode_switched", "learner_id": action.learner_id, "new_mode": action.new_mode}

# --- WebSocket ---

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    # For prototype simplification, we pass role/email in query params or just infer
    role = websocket.query_params.get("role", "learner")
    email = websocket.query_params.get("email", "unknown")
    
    await manager.connect(user_id, role, email, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
