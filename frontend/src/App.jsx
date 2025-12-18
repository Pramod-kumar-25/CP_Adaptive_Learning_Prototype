import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FileText, Music, Video, User, Bell, Radio, Send, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = "http://localhost:8000";
const WS_BASE = "ws://localhost:8000/ws";

export default function App() {
    const [user, setUser] = useState(null); // { email, role, id }
    const [view, setView] = useState('home'); // home, learner, tutor

    const handleLogin = (email, role) => {
        const newUser = { email, role, id: email.replace(/[^a-zA-Z0-9]/g, '_') };
        setUser(newUser);
        setView(role === 'learner' ? 'learner' : 'tutor');

        // Track login
        fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: newUser.id,
                event_type: 'login',
                metadata: { timestamp: new Date().toISOString() }
            })
        });
    };

    const handleLogout = () => {
        if (user) {
            fetch(`${API_BASE}/events`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    event_type: 'logout',
                    metadata: { timestamp: new Date().toISOString() }
                })
            });
        }
        setUser(null);
        setView('home');
    };

    if (view === 'home') return <Home onLogin={handleLogin} />;
    if (view === 'learner') return <LearnerDashboard user={user} onLogout={handleLogout} />;
    if (view === 'tutor') return <TutorDashboard user={user} onLogout={handleLogout} />;
}

// --- HOME PAGE ---
function Home({ onLogin }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card glass max-w-md w-full"
            >
                <h1 className="text-4xl font-bold mb-2">Universal Remote</h1>
                <p className="text-muted mb-8">Adaptive Learning Prototype</p>

                <div className="flex flex-col gap-4">
                    <button
                        onClick={() => onLogin('learner@example.com', 'learner')}
                        className="btn btn-primary w-full justify-center"
                    >
                        <User size={20} /> Login as Learner
                    </button>
                    <button
                        onClick={() => onLogin('tutor@example.com', 'tutor')}
                        className="btn btn-outline w-full justify-center"
                    >
                        <Radio size={20} /> Login as Tutor
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

// --- LEARNER DASHBOARD ---
function LearnerDashboard({ user, onLogout }) {
    const [mode, setMode] = useState('video'); // video, text, audio
    const [ws, setWs] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        // Pass role and email in query params for backend to track
        const socket = new WebSocket(`${WS_BASE}/${user.id}?role=learner&email=${user.email}`);
        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'MODE_SWITCH') {
                setMode(msg.new_mode);
            }
        };
        setWs(socket);
        return () => socket.close();
    }, [user.id, user.email]);

    const trackEvent = (type, metadata = {}) => {
        console.log(`Tracking Event: ${type}`, metadata);
        fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                event_type: type,
                metadata
            })
        }).catch(err => console.error("Event Track Fail:", err));
    };

    // Idle Tracking
    useEffect(() => {
        let idleTimer;
        const resetTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                trackEvent('idle', { duration: 30 });
            }, 30000);
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        resetTimer();

        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            clearTimeout(idleTimer);
        };
    }, []);

    return (
        <div className="dashboard-layout">
            <div className="sidebar glass">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold">L</div>
                    <div>
                        <div className="font-bold">Learner</div>
                        <div className="text-xs text-muted">Online</div>
                    </div>
                </div>

                <div className="flex-1">
                    <h3 className="text-sm font-semibold uppercase text-muted mb-4">Content Controls</h3>
                    <div className="space-y-2">
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${mode === 'video' ? 'bg-primary/20 text-primary' : 'text-muted'}`}>
                            <Video size={18} /> Video Mode
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${mode === 'text' ? 'bg-primary/20 text-primary' : 'text-muted'}`}>
                            <FileText size={18} /> Text Mode
                        </div>
                        <div className={`flex items-center gap-3 p-3 rounded-lg ${mode === 'audio' ? 'bg-primary/20 text-primary' : 'text-muted'}`}>
                            <Music size={18} /> Audio Mode
                        </div>
                    </div>
                </div>

                <button onClick={onLogout} className="btn btn-outline border-none text-muted hover:text-white">
                    <LogOut size={18} /> Logout
                </button>
            </div>

            <div className="main-content" onScroll={() => trackEvent('scroll', { pos: window.scrollY })}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="content-display"
                    >
                        <h2 className="text-3xl font-bold mb-6 capitalize">{mode} Lessons</h2>

                        {mode === 'video' && (
                            <div className="card glass aspect-video p-0 overflow-hidden">
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                                    title="Video Player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    onLoad={() => trackEvent('video_load')}
                                />
                                <div className="p-4 flex gap-4">
                                    <button onClick={() => trackEvent('pause')} className="btn btn-outline"><Pause size={18} /> Mock Pause</button>
                                    <button onClick={() => trackEvent('play')} className="btn btn-outline"><Play size={18} /> Mock Play</button>
                                </div>
                            </div>
                        )}

                        {mode === 'text' && (
                            <div className="card glass">
                                <p className="text-lg leading-relaxed mb-4">
                                    Adaptive learning systems focus on using technology to provide customized learning experiences.
                                    By tracking real-time behavioral signals, teachers can understand when a student is struggling
                                    or disengaged...
                                </p>
                                <p className="text-lg leading-relaxed mb-4">
                                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                                </p>
                                <button onClick={() => trackEvent('scroll', { section: 'end' })} className="btn btn-primary">Mark as Read</button>
                            </div>
                        )}

                        {mode === 'audio' && (
                            <div className="card glass flex flex-col items-center py-12">
                                <Music size={64} className="text-primary mb-6 animate-pulse" />
                                <h3 className="text-xl font-bold mb-2">Podcast: The Future of Pedagogy</h3>
                                <p className="text-muted mb-8">Episode 12 • 45 mins</p>
                                <div className="flex gap-4">
                                    <button onClick={() => trackEvent('audio_play')} className="btn btn-primary rounded-full w-16 h-16 justify-center"><Play size={24} /></button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

// --- TUTOR DASHBOARD ---
function TutorDashboard({ user, onLogout }) {
    const [students, setStudents] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [activities, setActivities] = useState([]);
    const [isLive, setIsLive] = useState(false);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sRes, aRes, acRes] = await Promise.all([
                    fetch(`${API_BASE}/students`),
                    fetch(`${API_BASE}/alerts`),
                    fetch(`${API_BASE}/activities`)
                ]);
                setStudents(await sRes.json());
                setAlerts((await aRes.json()).map(a => ({ ...a, alert_type: a.alert_type, message: a.message })));
                setActivities((await acRes.json()).map(ac => ({
                    user_id: ac.user_id,
                    event: ac.event_type,
                    time: new Date(ac.created_at).toLocaleTimeString()
                })));
            } catch (e) { console.error("Initial Fetch Error:", e); }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const socket = new WebSocket(`${WS_BASE}/${user.id}?role=tutor&email=${user.email}`);
        socket.onopen = () => setIsLive(true);
        socket.onclose = () => setIsLive(false);
        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'ALERT') {
                setAlerts(prev => [msg.data, ...prev].slice(0, 10));
            } else if (msg.type === 'ACTIVITY') {
                const newAct = { user_id: msg.user_id, event: msg.event, time: new Date().toLocaleTimeString() };
                setActivities(prev => [newAct, ...prev].slice(0, 20));
            } else if (msg.type === 'STUDENT_LIST') {
                setStudents(msg.data);
            }
        };
        return () => socket.close();
    }, [user.id, user.email]);


    const switchMode = (studentId, newMode) => {
        console.log(`Switching student ${studentId} to ${newMode}`);
        fetch(`${API_BASE}/control-action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tutor_id: user.id,
                learner_id: studentId,
                action_type: 'switch_mode',
                new_mode: newMode
            })
        }).catch(err => console.error("Control Action Fail:", err));
    };

    return (
        <div className="dashboard-layout">
            <div className="sidebar glass">
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white">T</div>
                    <div>
                        <div className="font-bold">Tutor Admin</div>
                        <div className="text-xs flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {isLive ? 'System Live' : 'Connecting...'}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <h3 className="text-sm font-semibold uppercase text-muted mb-4 flex items-center gap-2">
                        <Bell size={16} /> Recent Alerts
                    </h3>
                    {alerts.length === 0 && <p className="text-xs text-muted italic">No active alerts</p>}
                    {alerts.map((alert, i) => (
                        <div key={i} className="alert-item">
                            <div className="font-bold text-xs">⚠️ {alert.alert_type}</div>
                            <div className="text-xs">{alert.message}</div>
                        </div>
                    ))}

                    <h3 className="text-sm font-semibold uppercase text-muted mt-8 mb-4">Activity Log</h3>
                    <div className="space-y-2">
                        {activities.map((act, i) => (
                            <div key={i} className="text-xs text-muted border-b border-white/5 pb-1">
                                <span className="text-primary font-mono">{act.time}</span> {act.event}
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={onLogout} className="btn btn-outline border-none text-muted hover:text-white">
                    <LogOut size={18} /> Logout
                </button>
            </div>

            <div className="main-content">
                <h2 className="text-3xl font-bold mb-8">Universal Remote Dashboard</h2>

                <div className="grid grid-cols-1 gap-6">
                    {students.length === 0 && <p className="text-muted italic">No students currently online.</p>}
                    {students.map(student => (
                        <div key={student.id} className="card glass flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold">{student.email[0].toUpperCase()}</div>
                                <div>
                                    <div className="font-bold text-xl flex items-center gap-2">
                                        {student.email}
                                        <span className={`w-2 h-2 rounded-full ${student.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`badge badge-${student.mode}`}>{student.mode.toUpperCase()}</span>
                                        <span className="text-xs text-muted">{student.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => switchMode(student.id, 'video')}
                                    className={`btn ${student.mode === 'video' ? 'btn-primary' : 'btn-outline'}`}
                                >
                                    <Video size={18} /> Video
                                </button>
                                <button
                                    onClick={() => switchMode(student.id, 'text')}
                                    className={`btn ${student.mode === 'text' ? 'btn-primary' : 'btn-outline'}`}
                                >
                                    <FileText size={18} /> Text
                                </button>
                                <button
                                    onClick={() => switchMode(student.id, 'audio')}
                                    className={`btn ${student.mode === 'audio' ? 'btn-primary' : 'btn-outline'}`}
                                >
                                    <Music size={18} /> Audio
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 opacity-50 text-center">
                    <p className="text-sm">Human-in-the-Loop Prototype: Real-time behavior analysis and remote control interface.</p>
                </div>
            </div>
        </div>
    );
}
