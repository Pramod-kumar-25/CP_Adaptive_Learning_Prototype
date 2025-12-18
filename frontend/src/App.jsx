import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, FileText, Music, Video, User, Bell, Radio, Send, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = "http://localhost:8000";
const WS_BASE = "ws://localhost:8000/ws";

export default function App() {
    const [user, setUser] = useState(null); // { email, role, id }
    const [view, setView] = useState('home'); // home, learner, tutor

    const handleLogin = (userData) => {
        setUser(userData);
        setView(userData.role === 'learner' ? 'learner' : 'tutor');

        // Track login event
        fetch(`${API_BASE}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userData.id,
                event_type: 'login',
                metadata: { timestamp: new Date().toISOString() }
            })
        });
    };

    const handleLogout = () => {
        setUser(null);
        setView('home');
    };

    if (view === 'home') return <Home onLogin={handleLogin} />;
    if (view === 'learner') return <LearnerDashboard user={user} onLogout={handleLogout} />;
    if (view === 'tutor') return <TutorDashboard user={user} onLogout={handleLogout} />;
}

// --- HOME / ROLE SELECTION ---
function Home({ onLogin }) {
    const [step, setStep] = useState('selection'); // selection, tutorLogin, learnerLogin
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e, expectedRole) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (data.status === 'success') {
                if (data.user.role !== expectedRole) {
                    setError(`Access Denied: Use the ${data.user.role === 'tutor' ? 'Tutor' : 'Learner'} login page.`);
                    return;
                }
                onLogin(data.user);
            } else {
                setError(data.detail || 'Invalid credentials');
            }
        } catch (e) {
            setError('Connection failed');
        }
    };

    if (step === 'selection') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card glass max-w-lg w-full p-12 text-center">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Universal Remote</h1>
                    <p className="text-muted mb-12 text-lg">Choose your portal to enter the adaptive classroom.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onClick={() => setStep('learnerLogin')} className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/50 transition-all group">
                            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <User size={32} />
                            </div>
                            <span className="font-bold text-xl">Learner Portal</span>
                        </button>

                        <button onClick={() => setStep('tutorLogin')} className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-accent/20 hover:border-accent/50 transition-all group">
                            <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                                <Radio size={32} />
                            </div>
                            <span className="font-bold text-xl">Tutor Console</span>
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    const isTutor = step === 'tutorLogin';

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card glass max-w-md w-full p-8">
                <button onClick={() => setStep('selection')} className="text-muted hover:text-white mb-6 flex items-center gap-2 text-sm">
                    <LogOut size={16} className="rotate-180" /> Back to selection
                </button>

                <h2 className="text-3xl font-bold mb-2">{isTutor ? 'Tutor Console' : 'Learner Login'}</h2>
                <p className="text-muted mb-8 text-sm">Please enter credentials to continue.</p>

                <form onSubmit={(e) => handleSubmit(e, isTutor ? 'tutor' : 'learner')} className="flex flex-col gap-4">
                    <div className="text-left space-y-1">
                        <label className="text-xs font-bold uppercase text-muted px-1">Email</label>
                        <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary/50" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="text-left space-y-1">
                        <label className="text-xs font-bold uppercase text-muted px-1">Password</label>
                        <input type="password" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 outline-none focus:border-primary/50" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    <button type="submit" className={`btn ${isTutor ? 'btn-accent' : 'btn-primary'} w-full justify-center mt-4`}>
                        Enter {isTutor ? 'Console' : 'Classroom'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-[10px] text-muted space-y-1">
                    <p className="font-bold mb-1">Demo Credentials:</p>
                    {isTutor ? (
                        <p>Tutor: tutor@example.com / admin123</p>
                    ) : (
                        <>
                            <p>Learners: (pramod, jaswanth, abhi)@example.com</p>
                            <p>Password: pass123</p>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// --- LEARNER DASHBOARD ---
function LearnerDashboard({ user, onLogout }) {
    const [mode, setMode] = useState('video');
    const [ws, setWs] = useState(null);
    const playerRef = useRef(null);
    const audioRef = useRef(null);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);

    // Audio Play/Pause tracking
    const handleAudio = (type) => {
        if (!audioRef.current) return;
        if (type === 'play') {
            audioRef.current.play();
            setIsAudioPlaying(true);
        } else {
            audioRef.current.pause();
            setIsAudioPlaying(false);
        }
        trackEvent(type, { mode: 'audio' });
    };

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


    useEffect(() => {
        if (mode === 'video') {
            // Load YouTube API
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            }

            window.onYouTubeIframeAPIReady = () => {
                createPlayer();
            };

            if (window.YT && window.YT.Player) {
                createPlayer();
            }
        }

        function createPlayer() {
            playerRef.current = new window.YT.Player('yt-player', {
                height: '100%',
                width: '100%',
                videoId: 'dQw4w9WgXcQ',
                playerVars: {
                    'playsinline': 1,
                    'controls': 1,
                },
                events: {
                    'onStateChange': (event) => {
                        if (event.data === window.YT.PlayerState.PLAYING) trackEvent('play');
                        if (event.data === window.YT.PlayerState.PAUSED) trackEvent('pause');
                    }
                }
            });
        }

        return () => {
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy();
            }
        };
    }, [mode]);

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
                            <div className="flex flex-col h-[82vh] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/5 group relative">
                                <div id="yt-player" className="w-full h-full absolute inset-0"></div>
                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 via-black/60 to-transparent backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-primary text-xs font-bold uppercase tracking-wider mb-2">Module 1 • Introduction</div>
                                            <h2 className="text-3xl font-bold text-white mb-1">Neural Networks: The Complete Foundation</h2>
                                            <p className="text-sm text-white/50">Comprehensive Behavioral Tracking Active</p>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-green-500 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                            LIVE SENSOR DATA
                                        </div>
                                    </div>
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
                                <div className={`w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mb-6 border-4 border-primary/20 ${isAudioPlaying ? 'animate-pulse' : ''}`}>
                                    <Music size={64} className="text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Podcast: The Future of Pedagogy</h3>
                                <p className="text-muted mb-8">Episode 12 • Instrumental Background</p>

                                <audio
                                    ref={audioRef}
                                    src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                                    onPlay={() => setIsAudioPlaying(true)}
                                    onPause={() => setIsAudioPlaying(false)}
                                />

                                <div className="flex gap-6 items-center">
                                    <button
                                        onClick={() => isAudioPlaying ? handleAudio('pause') : handleAudio('play')}
                                        className="btn btn-primary rounded-full w-20 h-20 justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-transform"
                                    >
                                        {isAudioPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                                    </button>
                                </div>

                                <div className="mt-12 w-full max-w-md">
                                    <div className="flex justify-between text-xs text-muted mb-2">
                                        <span>Live Session</span>
                                        <span>Tracking Active</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            animate={isAudioPlaying ? { x: ["-100%", "100%"] } : { x: "0%" }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                            className="h-full w-1/2 bg-primary"
                                        />
                                    </div>
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

                <div className="flex-1 overflow-y-auto pr-2">
                    <h3 className="text-sm font-semibold uppercase text-muted mb-4 flex items-center gap-2">
                        <Bell size={16} /> Key Alerts
                    </h3>
                    {alerts.length === 0 && <p className="text-xs text-muted italic">Monitoring signals...</p>}
                    <div className="space-y-3 mb-8">
                        {alerts.map((alert, i) => (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="alert-item">
                                <div className="font-bold text-xs">⚠️ {alert.alert_type}</div>
                                <div className="text-xs text-white/70">{alert.message}</div>
                            </motion.div>
                        ))}
                    </div>

                    <h3 className="text-sm font-semibold uppercase text-muted mb-4 flex items-center gap-2">
                        <Radio size={16} /> Live Activity Log
                    </h3>
                    <div className="space-y-2 bg-black/20 rounded-xl p-4 font-mono text-[10px] max-h-[300px] overflow-y-auto scrollbar-hide">
                        {activities.map((act, i) => (
                            <div key={i} className="text-white/40 border-b border-white/5 pb-1 flex justify-between">
                                <span className="truncate mr-2"><span className="text-primary">[{act.time}]</span> {act.user_id}</span>
                                <span className="text-white/60">{act.event}</span>
                            </div>
                        ))}
                        {activities.length === 0 && <p className="text-center italic opacity-30 mt-4">Awaiting data...</p>}
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
