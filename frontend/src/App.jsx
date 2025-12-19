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
            <div className="home-layout">
                {/* Background Decor */}
                <div className="decor-blob blob-primary" />
                <div className="decor-blob blob-accent" />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass hero-card"
                >
                    <div className="hero-badge">
                        Adaptive Learning System
                    </div>
                    <h1 className="hero-title">
                        Universal Control
                    </h1>
                    <p className="hero-subtitle">
                        Seamlessly bridge the gap between instruction and insight. Choose your portal.
                    </p>

                    <div className="role-grid">
                        <button
                            onClick={() => setStep('learnerLogin')}
                            className="role-card group"
                        >
                            <div className="icon-box icon-primary">
                                <User size={40} />
                            </div>
                            <div className="role-text-container">
                                <span className="role-title group-hover-primary">Learner</span>
                                <span className="role-action">Enter Classroom</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setStep('tutorLogin')}
                            className="role-card group"
                        >
                            <div className="icon-box icon-accent">
                                <Radio size={40} />
                            </div>
                            <div className="role-text-container">
                                <span className="role-title group-hover-accent">Tutor</span>
                                <span className="role-action">Control Console</span>
                            </div>
                        </button>
                    </div>
                </motion.div>

                <p className="footer-version">v2.0 • Human-in-the-Loop Architecture</p>
            </div>
        );
    }

    const isTutor = step === 'tutorLogin';

    return (
        <div className="login-layout">
            <div className="decor-blob blob-primary" style={{ top: '-10%', left: '-10%', opacity: 0.4 }} />
            <div className="decor-blob blob-accent" style={{ bottom: '-10%', right: '-10%', opacity: 0.4 }} />

            <button onClick={() => setStep('selection')} className="back-link">
                <LogOut size={16} className="rotate-180" /> Back to selection
            </button>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="login-card glass"
            >
                <h2 className="login-title">{isTutor ? 'Tutor Console' : 'Learner Login'}</h2>
                <p className="login-subtitle">Please enter your credentials to {isTutor ? 'access controls' : 'start learning'}.</p>

                <form onSubmit={(e) => handleSubmit(e, isTutor ? 'tutor' : 'learner')} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="name@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className={`form-submit ${isTutor ? 'btn-type-tutor' : 'btn-type-learner'}`}>
                        Enter {isTutor ? 'Console' : 'Classroom'}
                    </button>
                </form>

                <div className="demo-credentials">
                    <p className="demo-label">Demo Credentials:</p>
                    {isTutor ? (
                        <p>tutor@example.com / admin123</p>
                    ) : (
                        <div className="text-left inline-block">
                            <p>learners: (pramod, jaswanth)@example.com</p>
                            <p>password: pass123</p>
                        </div>
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
        <div className="dashboard-container">
            {/* SIDEBAR */}
            <aside className="dash-sidebar">
                <div className="user-profile">
                    <div className="avatar-circle">L</div>
                    <div className="profile-info">
                        <div className="profile-name">Learner</div>
                        <div className="profile-status">
                            <span className="status-dot online"></span> Online
                        </div>
                    </div>
                </div>

                <div className="nav-section">
                    <h3 className="nav-header">Content Controls</h3>
                    <div className="nav-menu">
                        <button
                            className={`nav-item ${mode === 'video' ? 'active' : ''}`}
                            onClick={() => console.log('Mode handled by backend in this prototype')}
                        >
                            <Video size={18} /> <span>Video Mode</span>
                        </button>
                        <button className={`nav-item ${mode === 'text' ? 'active' : ''}`}>
                            <FileText size={18} /> <span>Text Mode</span>
                        </button>
                        <button className={`nav-item ${mode === 'audio' ? 'active' : ''}`}>
                            <Music size={18} /> <span>Audio Mode</span>
                        </button>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <button onClick={onLogout} className="btn-logout">
                        <LogOut size={18} /> Categories
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="dash-content" onScroll={() => trackEvent('scroll', { pos: window.scrollY })}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="content-wrapper"
                    >
                        <header className="content-header">
                            <h2 className="section-title">{mode} Lessons</h2>
                        </header>

                        {mode === 'video' && (
                            <div className="lesson-card">
                                <div className="video-container">
                                    <div id="yt-player" className="video-frame"></div>
                                </div>
                                <div className="lesson-details">
                                    <div className="lesson-meta">
                                        <span className="module-tag">Module 1 • Introduction</span>
                                        <div className="live-badge">
                                            <span className="status-dot pulse"></span> LIVE SENSOR DATA
                                        </div>
                                    </div>
                                    <h1 className="lesson-title">Neural Networks: The Complete Foundation</h1>
                                    <p className="tracking-status">Comprehensive Behavioral Tracking Active</p>
                                </div>
                            </div>
                        )}

                        {mode === 'text' && (
                            <div className="lesson-card text-mode">
                                <div className="text-content">
                                    <h3 className="text-chapter">Chapter 1: The Perceptron</h3>
                                    <p className="text-paragraph">
                                        Adaptive learning systems focus on using technology to provide customized learning experiences.
                                        By tracking real-time behavioral signals, teachers can understand when a student is struggling
                                        or disengaged. This allows for immediate intervention and personalized content delivery.
                                    </p>
                                    <p className="text-paragraph">
                                        Neural networks are computing systems vaguely inspired by the biological neural networks that constitute animal brains.
                                        Such systems "learn" to perform tasks by considering examples, generally without being programmed with task-specific rules.
                                    </p>
                                </div>
                                <div className="action-row">
                                    <button onClick={() => trackEvent('scroll', { section: 'end' })} className="btn-primary-action">
                                        Mark as Read
                                    </button>
                                </div>
                            </div>
                        )}

                        {mode === 'audio' && (
                            <div className="lesson-card audio-mode">
                                <div className="audio-visualizer">
                                    <div className={`visualizer-circle ${isAudioPlaying ? 'playing' : ''}`}>
                                        <Music size={48} />
                                    </div>
                                    {isAudioPlaying && <div className="wave-animation"></div>}
                                </div>

                                <div className="audio-info">
                                    <span className="module-tag">Episode 12 • Instrumental Background</span>
                                    <h1 className="lesson-title">Podcast: The Future of Pedagogy</h1>
                                </div>

                                <audio
                                    ref={audioRef}
                                    src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                                    onPlay={() => setIsAudioPlaying(true)}
                                    onPause={() => setIsAudioPlaying(false)}
                                    className="hidden-audio"
                                />

                                <div className="audio-controls">
                                    <button
                                        onClick={() => isAudioPlaying ? handleAudio('pause') : handleAudio('play')}
                                        className="btn-play-pause"
                                    >
                                        {isAudioPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
                                    </button>
                                </div>

                                <div className="lesson-meta mt-6">
                                    <div className="live-badge">
                                        <span className="status-dot pulse"></span> Tracking Active
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
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
        <div className="dashboard-container">
            {/* SIDEBAR - SPLIT LAYOUT */}
            <aside className="tutor-sidebar">
                {/* TOP HALF: Profile & Alerts */}
                <div className="sidebar-top">
                    <div className="user-profile">
                        <div className="avatar-circle tutor-avatar">T</div>
                        <div className="profile-info">
                            <div className="profile-name">Tutor Admin</div>
                            <div className="profile-status">
                                <span className={`status-dot ${isLive ? 'online pulse' : 'offline'}`}></span>
                                {isLive ? 'System Live' : 'Connecting...'}
                            </div>
                        </div>
                    </div>

                    <div className="alert-section">
                        <h3 className="nav-header flex items-center gap-2">
                            <Bell size={14} /> Critical Alerts
                        </h3>
                        {alerts.length === 0 && <div className="alert-empty">System Nominal. Monitoring...</div>}
                        <div className="alert-list">
                            {alerts.map((alert, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className="alert-card"
                                >
                                    <div className="alert-header">⚠️ {alert.alert_type}</div>
                                    <div className="alert-body">{alert.message}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* BOTTOM HALF: Debug Console */}
                <div className="sidebar-console">
                    <div className="console-header">
                        <Radio size={14} /> System Logs
                    </div>
                    <div className="console-terminal">
                        {activities.map((act, i) => (
                            <div key={i} className="log-line">
                                <span className="log-time">[{act.time}]</span>
                                <span className="log-user">{act.user_id}</span>
                                <span className="log-event">{act.event}</span>
                            </div>
                        ))}
                        {activities.length === 0 && <div className="log-line opacity-30">Initializing data stream...</div>}
                    </div>

                    <button onClick={onLogout} className="btn-logout mt-4">
                        <LogOut size={16} /> Terminate Session
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="dash-content">
                <header className="content-header">
                    <h2 className="section-title">Universal Remote Dashboard</h2>
                </header>

                <div className="student-grid">
                    {students.length === 0 && <div className="empty-state">No students connected. Waiting for active sessions...</div>}
                    {students.map(student => (
                        <div key={student.id} className="student-card glass">
                            <div className="student-info">
                                <div className="avatar-circle student-avatar">{student.email[0]}</div>
                                <div>
                                    <div className="student-name">
                                        {student.email}
                                        <span className={`status-dot ${student.status === 'online' ? 'online' : 'offline'} ml-2`}></span>
                                    </div>
                                    <div className="student-meta">
                                        <span className={`role-badge badge-${student.mode}`}>{student.mode}</span>
                                        <span className="status-text">{student.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="control-actions">
                                <button
                                    onClick={() => switchMode(student.id, 'video')}
                                    className={`action-btn ${student.mode === 'video' ? 'active' : ''}`}
                                >
                                    <Video size={16} /> Video
                                </button>
                                <button
                                    onClick={() => switchMode(student.id, 'text')}
                                    className={`action-btn ${student.mode === 'text' ? 'active' : ''}`}
                                >
                                    <FileText size={16} /> Text
                                </button>
                                <button
                                    onClick={() => switchMode(student.id, 'audio')}
                                    className={`action-btn ${student.mode === 'audio' ? 'active' : ''}`}
                                >
                                    <Music size={16} /> Audio
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <footer className="dashboard-footer">
                    Human-in-the-Loop Prototype: Real-time behavior analysis and remote control interface.
                </footer>
            </main>
        </div>
    );
}
