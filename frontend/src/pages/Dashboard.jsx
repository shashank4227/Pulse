import React, { useEffect, useState, useContext, useCallback } from 'react';
import api from '../utils/api';
import VideoUpload from '../components/VideoUpload';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { 
    FaPlay, FaExclamationTriangle, FaCheckCircle, FaSpinner, 
    FaSignOutAlt, FaRedo, FaWifi, FaBell, FaCloudUploadAlt,
    FaChartLine, FaClock, FaThumbsUp, FaComment, FaShare, FaTimes, FaVideo,
    FaBolt, FaCompass, FaUsers, FaHeart, FaSearch, FaPlus, FaStar, FaShieldAlt, FaTrash
} from 'react-icons/fa';
import { useNavigate, Link } from 'react-router-dom';

export const Dashboard = () => {
    const [videos, setVideos] = useState([]);
    const [stats, setStats] = useState({ totalViews: 0, subscribers: 0, safePercentage: 0, efficiencyStatus: 'Excellent', efficiencyPercentage: 100, growth: 0 });
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState(null);
    
    // Derived state for top video
    const [topVideo, setTopVideo] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [showInfoModal, setShowInfoModal] = useState(false);
    // Helper for API URL
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // ... (rest of component)
    // Replace occurrences:
    // src={`${API_BASE_URL}/videos/stream/${video._id}?token=${localStorage.getItem('token')}#t=2`}

    const { user, logout } = useContext(AuthContext);
    const { socket, isConnected } = useContext(SocketContext);
    const navigate = useNavigate();

    const fetchVideos = useCallback(async () => {
        try {
            const res = await api.get(`/videos?t=${Date.now()}`);
            const videosWithProgress = res.data.map(video => ({
                ...video,
                progress: video.progress !== undefined ? video.progress : (video.processingStatus === 'processing' ? 0 : undefined)
            }));
            
            // Sort by newest first
            const sortedVideos = videosWithProgress.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            // Calculate Stats: Safe Content %, Efficiency, & Growth
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            // Growth Calculation
            const thisMonthVideos = sortedVideos.filter(v => {
                const d = new Date(v.createdAt);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
            });
            const lastMonthVideos = sortedVideos.filter(v => {
                const d = new Date(v.createdAt);
                const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
                const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
                return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
            });
            const thisMonthViews = thisMonthVideos.reduce((acc, v) => acc + (v.views || 0), 0);
            const lastMonthViews = lastMonthVideos.reduce((acc, v) => acc + (v.views || 0), 0);
            let growthRate = 0;
            if (lastMonthViews === 0) {
                growthRate = thisMonthViews > 0 ? 100 : 0;
            } else {
                growthRate = ((thisMonthViews - lastMonthViews) / lastMonthViews) * 100;
            }

            // Safe Content & Efficiency
            const totalCount = sortedVideos.length;
            const safeCount = sortedVideos.filter(v => v.sensitivityStatus === 'safe').length;
            const safePercentage = totalCount > 0 ? Math.round((safeCount / totalCount) * 100) : 0;

            const failedCount = sortedVideos.filter(v => v.processingStatus === 'failed').length;
            const failureRate = totalCount > 0 ? (failedCount / totalCount) * 100 : 0;
            const efficiencyPercentage = Math.max(0, 100 - failureRate);

            let efficiencyStatus = 'Excellent';
            if (failureRate > 10) efficiencyStatus = 'Needs Attention';
            else if (failureRate > 0) efficiencyStatus = 'Good';

            const totalViews = sortedVideos.reduce((acc, v) => acc + (v.views || 0), 0);
            
            // Find top video
            const best = sortedVideos.reduce((max, v) => (v.views || 0) > (max ? max.views || 0 : -1) ? v : max, null);
            setTopVideo(best);
            setVideos(sortedVideos); // RESTOREED missing state update
            
            setStats({
                totalViews,
                subscribers: user?.subscribersCount || 0,
                safePercentage,
                efficiencyStatus,
                efficiencyPercentage,
                growth: Math.round(growthRate)
            });

        } catch (error) {
            console.error("Fetch videos failed", error);
        }
    }, [user]);

    useEffect(() => { fetchVideos(); }, [fetchVideos]);

    useEffect(() => {
        if (!socket) return;
        const handleVideoStatusUpdate = (data) => {
            setVideos(prevVideos => {
                const videoExists = prevVideos.some(v => v._id === data.videoId);
                if (!videoExists) { fetchVideos(); return prevVideos; }
                const newVideos = prevVideos.map(v => {
                    if (v._id === data.videoId) {
                        const updated = { 
                            ...v, 
                            processingStatus: data.status || v.processingStatus,
                            progress: data.progress !== undefined ? data.progress : v.progress
                        };
                        if (data.sensitivity !== undefined) updated.sensitivityStatus = data.sensitivity;
                        if (data.details !== undefined) updated.sensitivityDetails = data.details;
                        return updated;
                    }
                    return v;
                });
                return newVideos;
            });
        };
        socket.on('video_status_update', handleVideoStatusUpdate);
        return () => socket.off('video_status_update', handleVideoStatusUpdate);
    }, [socket, fetchVideos]);

    const getStatusColor = (status, sensitivity) => {
        if (status === 'failed' || sensitivity === 'flagged') return 'text-red-400';
        if (status === 'processing') return 'text-[#fcb900]';
        return 'text-green-400';
    };

    const getStatusText = (status, sensitivity) => {
        if (sensitivity === 'flagged') return 'Flagged';
        if (status === 'failed') return 'Failed';
        if (status === 'processing') return 'Processing';
        return 'Published';
    };

    const handleUpdateVideo = async () => {
        if (!editingVideo) return;
        try {
            await api.put(`/videos/${editingVideo._id}`, {
                title: editingVideo.title,
                description: editingVideo.description
            });
            setEditingVideo(null);
            fetchVideos(); 
        } catch (error) {
            console.error("Update failed", error);
            // Optionally add toast notification here
        }
    };

    const handleDeleteVideo = async (videoId) => {
        if (window.confirm('Are you sure you want to delete this video? This cannot be undone.')) {
            try {
                await api.delete(`/videos/${videoId}`);
                fetchVideos();
            } catch (error) {
                console.error('Delete failed:', error);
                alert('Failed to delete video');
            }
        }
    };

    const isEditor = user?.role === 'editor' || user?.role === 'content_creator' || user?.role === 'admin';

    // Filter Logic
    let processedVideos = [...videos];

    // 1. Filter Mechanism
    if (filter === 'safe') {
        processedVideos = processedVideos.filter(v => v.sensitivityStatus === 'safe');
    } else if (filter === 'flagged') {
        processedVideos = processedVideos.filter(v => v.sensitivityStatus === 'flagged');
    } else if (filter === 'processing') {
         processedVideos = processedVideos.filter(v => v.processingStatus !== 'completed');
    }

    // 2. Search Mechanism
    if (searchQuery) {
        processedVideos = processedVideos.filter(v => v.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }



    // 3. Sort Mechanism
    if (filter === 'trending') {
        processedVideos.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (filter === 'recent') {
        processedVideos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const filteredVideos = processedVideos;

    return (
        <div className="min-h-screen bg-dark-900 font-sans text-white overflow-hidden flex">
            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-dark-800 rounded-3xl border border-white/10 p-6 w-full max-w-lg shadow-2xl relative">
                        <button 
                            onClick={() => setIsUploadOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes />
                        </button>
                        <h3 className="text-xl font-bold text-white mb-6">Upload New Video</h3>
                        <VideoUpload onUploadSuccess={() => { setIsUploadOpen(false); fetchVideos(); }} />
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingVideo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-dark-800 rounded-3xl border border-white/10 p-6 w-full max-w-2xl shadow-2xl relative">
                        <button 
                            onClick={() => setEditingVideo(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes />
                        </button>
                        <h3 className="text-xl font-bold text-white mb-6">Edit Video Details</h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Title</label>
                                <input 
                                    type="text" 
                                    value={editingVideo.title}
                                    onChange={(e) => setEditingVideo({...editingVideo, title: e.target.value})}
                                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fcb900] transition-colors"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                                <textarea 
                                    rows="4"
                                    value={editingVideo.description || ''}
                                    onChange={(e) => setEditingVideo({...editingVideo, description: e.target.value})}
                                    className="w-full bg-dark-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fcb900] transition-colors"
                                ></textarea>
                            </div>

                            {/* Flagged Analysis View */}
                            {editingVideo.sensitivityStatus === 'flagged' && editingVideo.sensitivityDetails && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <h4 className="text-red-400 font-bold text-sm mb-3 flex items-center gap-2">
                                        <FaExclamationTriangle /> Flagged Content Analysis
                                    </h4>
                                    <div className="space-y-3 text-sm text-red-300/90">
                                        <div>
                                            <span className="font-bold text-red-400 block text-xs uppercase mb-1">Reason</span>
                                            <p className="bg-red-500/5 p-3 rounded-lg border border-red-500/10 leading-relaxed">
                                                {editingVideo.sensitivityDetails.reason || 'Content violation detected by AI.'}
                                            </p>
                                        </div>
                                        {editingVideo.sensitivityDetails.timestamp && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <span className="font-bold text-red-400 uppercase">Timestamp:</span>
                                                <span className="font-mono bg-red-500/20 px-1.5 py-0.5 rounded text-red-200">
                                                    {editingVideo.sensitivityDetails.timestamp}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => setEditingVideo(null)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleUpdateVideo}
                                    className="flex-1 px-4 py-3 rounded-xl bg-[#fcb900] text-dark-900 font-bold shadow-lg shadow-[#fcb900]/20 hover:bg-[#e5a800] transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Info Modal */}
            {showInfoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
                     <div className="bg-dark-800 rounded-3xl border border-white/10 p-8 w-full max-w-lg shadow-2xl relative">
                        <button 
                            onClick={() => setShowInfoModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <FaTimes />
                        </button>
                        
                        <div className="flex items-center gap-3 mb-6 text-[#fcb900]">
                            <FaShieldAlt className="text-3xl" />
                            <h3 className="text-2xl font-bold font-heading">Pulse AI Safety</h3>
                        </div>

                        <div className="space-y-4 text-gray-300 leading-relaxed">
                            <p>
                                <strong className="text-white">Active Content Moderation:</strong> Pulse uses advanced Generative AI to analyze every video frame-by-frame during upload.
                            </p>
                            <p>
                                <strong className="text-white">Real-time Flagging:</strong> Harmful content is instantly detected and flagged with detailed reasons (Violence, Nudity, Hate Speech).
                            </p>
                            <p>
                                <strong className="text-white">Viewer Protection:</strong> Sensitive content is automatically filtered from the main feed, ensuring a safe viewing experience for everyone.
                            </p>
                        </div>

                        <button 
                            onClick={() => setShowInfoModal(false)}
                            className="w-full mt-8 py-3 rounded-xl bg-[#fcb900] text-dark-900 font-bold hover:bg-[#e5a800] transition-colors"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}

            {/* LEFT SIDEBAR - Unified */}
            <div className="w-64 bg-dark-800/50 backdrop-blur-xl border-r border-white/5 flex flex-col p-6 hidden md:flex shrink-0">
                <div className="flex items-center gap-3 mb-10 text-[#fcb900]">
                    <FaBolt className="text-2xl" />
                    <span className="text-2xl font-bold font-heading tracking-wider">PULSE</span>
                </div>

                <div className="space-y-8 overflow-y-auto custom-scrollbar">
                    <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-4">Menu</h4>
                        <div className="space-y-2">
                            {isEditor ? (
                                <>
                                    <button 
                                        onClick={() => setFilter('all')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${filter === 'all' ? 'bg-[#fcb900] text-dark-900 shadow-lg shadow-[#fcb900]/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                                    >
                                        <FaVideo /> <span>All Videos</span>
                                    </button>
                                    <button 
                                        onClick={() => setFilter('safe')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${filter === 'safe' ? 'bg-[#fcb900] text-dark-900 shadow-lg shadow-[#fcb900]/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                                    >
                                        <FaShieldAlt /> <span>Safe Content</span>
                                    </button>
                                    <button 
                                        onClick={() => setFilter('flagged')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${filter === 'flagged' ? 'bg-[#fcb900] text-dark-900 shadow-lg shadow-[#fcb900]/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                                    >
                                        <FaExclamationTriangle /> <span>Flagged Content</span>
                                    </button>
                                    <button 
                                        onClick={() => setFilter('processing')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${filter === 'processing' ? 'bg-[#fcb900] text-dark-900 shadow-lg shadow-[#fcb900]/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                                    >
                                        <FaSpinner className={filter === 'processing' ? 'animate-spin' : ''} /> <span>Processing</span>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => setFilter('all')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${filter === 'all' ? 'bg-[#fcb900] text-dark-900 shadow-lg shadow-[#fcb900]/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                                    >
                                        <FaPlay /> <span>All Content</span>
                                    </button>
                                    <button 
                                        onClick={() => setFilter('trending')}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${filter === 'trending' ? 'bg-[#fcb900] text-dark-900 shadow-lg shadow-[#fcb900]/20' : 'hover:bg-white/5 text-gray-400 hover:text-white'}`}
                                    >
                                        <FaCompass /> <span>Trending</span>
                                    </button>
                                    <button 
                                        onClick={() => setShowInfoModal(true)}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <FaShieldAlt /> <span>AI Safety Info</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    


                    <div className="mt-auto pt-8 border-t border-white/5">
                        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors">
                            <FaSignOutAlt /> <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Header / Search */}
                <div className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-dark-900/90 backdrop-blur-sm z-10 shrink-0">
                    <div className="flex items-center gap-6 text-gray-400 text-sm font-medium">
                        {isEditor && (
                            <h2 className="text-white font-bold text-lg">Studio Dashboard</h2>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        {isEditor && (
                            <div 
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isConnected ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} transition-all`}
                                title={isConnected ? "Real-time connection active" : "Connection lost"}
                            >
                                <FaWifi className={`text-xs ${isConnected ? '' : 'opacity-50'}`} />
                                <span className="text-xs font-medium hidden md:block">{isConnected ? 'Live' : 'Offline'}</span>
                            </div>
                        )}

                        {!isEditor && (
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search videos..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-dark-800 text-white rounded-full px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-[#fcb900] w-64 transition-all"
                                />
                                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                            </div>
                        )}
                        

                        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                            <span className="text-sm font-bold text-white hidden sm:block">{user?.username}</span>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fcb900] to-[#fde047] p-0.5">
                                <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center text-[#fcb900] font-bold">
                                    {user?.username?.[0]?.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {/* Background Elements for Editor */}
                    {isEditor && (
                        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                            <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#fcb900]/5 rounded-full blur-[150px]"></div>
                            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[150px]"></div>
                        </div>
                    )}

                    {isEditor ? (
                         // =================================================================================
                         // STUDIO VIEW CONTENT (Refactored to list layout)
                         // =================================================================================
                         <div className="relative z-10 max-w-7xl mx-auto space-y-8">
                            
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <div className="bg-dark-800/50 backdrop-blur-md p-6 rounded-3xl border border-white/5">
                                    <div className="text-gray-400 text-sm mb-2">Total Views</div>
                                    <div className="text-3xl font-black text-white">{stats.totalViews.toLocaleString()}</div>
                                    <div className="text-[#fcb900] text-xs font-bold mt-2">+{stats.growth}% this month</div>
                                </div>
                                <div className="bg-dark-800/50 backdrop-blur-md p-6 rounded-3xl border border-white/5">
                                    <h3 className="text-white font-bold text-lg mb-6">Channel Health</h3>
                                    <div className="space-y-6">
                                        {/* Safe Content */}
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-gray-400 text-sm font-medium">Safe Content</span>
                                                <span className="text-green-400 font-bold">{stats.safePercentage}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-green-400 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${stats.safePercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        {/* Processing Efficiency */}
                                        <div>
                                            <div className="flex justify-between items-end mb-2">
                                                <span className="text-gray-400 text-sm font-medium">Processing Efficiency</span>
                                                <span className={`font-bold ${stats.efficiencyStatus === 'Excellent' ? 'text-green-400' : stats.efficiencyStatus === 'Good' ? 'text-[#fcb900]' : 'text-red-400'}`}>
                                                    {stats.efficiencyStatus}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-dark-900 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${stats.efficiencyStatus === 'Excellent' ? 'bg-green-400' : stats.efficiencyStatus === 'Good' ? 'bg-[#fcb900]' : 'bg-red-400'}`}
                                                    style={{ width: `${stats.efficiencyPercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-dark-800/50 backdrop-blur-md p-6 rounded-3xl border border-white/5">
                                    <div className="text-gray-400 text-sm mb-2">Total Videos</div>
                                    <div className="text-3xl font-black text-white">{videos.length}</div>
                                    <div className="text-blue-400 text-xs font-bold mt-2">Content Library</div>
                                </div>
                                <div className="rounded-3xl border border-[#fcb900]/30 bg-[#fcb900]/10 p-6 flex items-center justify-center">
                                     <button 
                                        onClick={() => setIsUploadOpen(true)}
                                        className="w-full h-full flex flex-col items-center justify-center gap-3 text-[#fcb900] hover:text-white transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-[#fcb900] text-dark-900 flex items-center justify-center text-xl shadow-lg shadow-[#fcb900]/20">
                                            <FaCloudUploadAlt />
                                        </div>
                                        <span className="font-bold">Upload New Video</span>
                                    </button>
                                </div>
                            </div>

                            {/* Main Content Split */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Recent Uploads */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold text-white">Recent Uploads</h3>
                                        <button className="text-sm text-[#fcb900] hover:text-white transition-colors">Manage All</button>
                                    </div>

                                    <div className="space-y-3">
                                        {filteredVideos.length === 0 ? (
                                             <div className="text-center py-12 text-gray-500 bg-dark-800/30 rounded-3xl border border-dashed border-white/10">
                                                <p>No videos uploaded yet.</p>
                                                <button onClick={() => setIsUploadOpen(true)} className="mt-4 text-[#fcb900] hover:underline">Upload your first video</button>
                                            </div>
                                        ) : (
                                            filteredVideos.map(video => (
                                                <div key={video._id} className="group flex flex-col gap-4 p-4 rounded-2xl bg-dark-800/40 hover:bg-dark-700/60 border border-white/5 hover:border-white/10 transition-all">
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-32 aspect-video rounded-xl bg-black/50 overflow-hidden relative shrink-0">
                                                            <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                                                                <FaPlay />
                                                            </div>
                                                            {video.processingStatus === 'completed' && (
                                                                <video
                                                                    src={`${API_BASE_URL}/videos/stream/${video._id}?token=${localStorage.getItem('token')}#t=2`}
                                                                    className="absolute inset-0 w-full h-full object-cover opacity-75"
                                                                    muted
                                                                    loop
                                                                    onMouseOver={e => e.target.play()}
                                                                    onMouseOut={e => { e.target.pause(); e.target.currentTime = 2; }}
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-white truncate mb-1 text-lg">{video.title}</h4>
                                                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                                                <div className="relative flex items-center">
                                                                    <span 
                                                                        className={`peer px-2 py-0.5 rounded-md bg-white/5 border border-white/5 ${getStatusColor(video.processingStatus, video.sensitivityStatus)} flex items-center gap-1.5 cursor-help`}
                                                                    >
                                                                        {video.processingStatus === 'processing' && <FaSpinner className="animate-spin" />}
                                                                        {video.sensitivityStatus === 'flagged' && <FaExclamationTriangle />}
                                                                        {getStatusText(video.processingStatus, video.sensitivityStatus)}
                                                                    </span>
                                                                    
                                                                    {/* Custom Hover Tooltip */}
                                                                    {video.sensitivityStatus === 'flagged' && video.sensitivityDetails && (
                                                                        <div className="hidden peer-hover:block hover:block absolute left-0 top-full mt-2 z-50 w-96 p-3 bg-dark-800 rounded-xl border border-red-500/30 shadow-xl shadow-black/50">
                                                                            <div className="text-xs text-red-400 font-bold mb-1 flex items-center gap-2">
                                                                                <FaExclamationTriangle /> Flagged Content
                                                                            </div>
                                                                            <p className="text-xs text-red-300/90 leading-relaxed">
                                                                                {video.sensitivityDetails.reason || 'Content violation detected'}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                    <span className="flex items-center gap-1"><FaUsers className="text-[#fcb900]" /> {video.uploadedBy?.username || 'Unknown'}</span>
                                                                    <span className="flex items-center gap-1"><FaClock /> {new Date(video.createdAt).toLocaleDateString()}</span>
                                                                    <span className="flex items-center gap-1"><FaChartLine /> {video.views || 0} views</span>
                                                                    {video.size && <span className="bg-white/5 px-1.5 py-0.5 rounded text-gray-500">{(video.size / (1024 * 1024)).toFixed(2)} MB</span>}
                                                            </div>

                                                            {video.processingStatus === 'processing' && (
                                                                <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                                                                    <div className="h-full bg-[#fcb900] transition-all duration-500" style={{ width: `${video.progress || 0}%` }}></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => navigate(`/watch/${video._id}`)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Watch">
                                                                <FaPlay />
                                                            </button>
                                                            <button onClick={() => setEditingVideo(video)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Edit">
                                                                <FaRedo />
                                                            </button>
                                                            <button onClick={() => handleDeleteVideo(video._id)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Analytics & Top Performer */}
                                <div className="space-y-6">
                                     {/* Top Performer */}
                                    <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl p-6 border border-indigo-500/20">
                                        <h3 className="text-lg font-bold text-indigo-200 mb-4">Top Performer</h3>
                                        {topVideo ? (
                                            <div>
                                                <div className="aspect-video rounded-xl bg-black/40 mb-4 overflow-hidden relative">
                                                    <video
                                                        src={`${API_BASE_URL}/videos/stream/${topVideo._id}?token=${localStorage.getItem('token')}#t=2`}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-60"
                                                        muted
                                                        loop
                                                        autoPlay
                                                        playsInline
                                                    />
                                                </div>
                                                <div className="font-bold text-white mb-1 truncate">{topVideo.title}</div>
                                                <div className="flex justify-between text-sm text-gray-400">
                                                    <span>{topVideo.views} views</span>
                                                    <span className="text-[#fcb900]">#1</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500">No data available</p>
                                        )}
                                    </div>

                              
                                </div>
                            </div>
                         </div>
                    ) : (
                        // =================================================================================
                        // VIEWER VIEW CONTENT
                        // =================================================================================
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Center Column */}
                            <div className="flex-1 space-y-8">
                                
                                {/* SEARCH RESULTS VIEW */}
                                {searchQuery ? (
                                    <div className="animate-fadeIn">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-[#fcb900]/10 flex items-center justify-center text-[#fcb900] border border-[#fcb900]/20">
                                                    <FaSearch className="text-xl" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-bold text-white">Search Results</h2>
                                                    <p className="text-gray-400">Found {filteredVideos.length} videos for "<span className="text-[#fcb900]">{searchQuery}</span>"</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setSearchQuery('')}
                                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm font-bold flex items-center gap-2"
                                            >
                                                <FaTimes /> Clear Search
                                            </button>
                                        </div>

                                        {filteredVideos.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filteredVideos.map(video => (
                                                    <div key={video._id} className="bg-dark-800 rounded-3xl p-4 hover:bg-dark-700 transition-colors group cursor-pointer border border-white/5 hover:border-[#fcb900]/30" onClick={() => navigate(`/watch/${video._id}`)}>
                                                        <div className="aspect-video rounded-2xl bg-black/50 relative overflow-hidden mb-4">
                                                            <video
                                                                src={`${API_BASE_URL}/videos/stream/${video._id}?token=${localStorage.getItem('token')}#t=2`}
                                                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                                                                muted
                                                                loop
                                                                onMouseOver={e => e.target.play()}
                                                                onMouseOut={e => { e.target.pause(); e.target.currentTime = 2; }}
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                                <div className="w-12 h-12 rounded-full bg-[#fcb900] flex items-center justify-center text-dark-900 shadow-xl transform scale-50 group-hover:scale-100 transition-transform">
                                                                    <FaPlay className="ml-1" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <h4 className="font-bold text-white truncate mb-1 text-lg">{video.title}</h4>
                                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                                            <span>{video.uploadedBy?.username || 'Detailed View'}</span>
                                                            <span className="flex items-center gap-1"><FaChartLine className="text-[#fcb900]"/> {video.views || 0}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-20 text-center">
                                                <div className="w-20 h-20 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-600">
                                                    <FaSearch className="text-3xl" />
                                                </div>
                                                <h3 className="text-xl font-bold text-white mb-2">No videos found</h3>
                                                <p className="text-gray-500">Try searching for something else</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* STANDARD DASHBOARD CONTENT */
                                    <>
                                        {/* Hero Banner */}
                                {topVideo ? (
                                    <div className="w-full h-[400px] rounded-[2rem] relative overflow-hidden group shadow-2xl">
                                        <div className="absolute inset-0 bg-dark-800">
                                            {/* Placeholder for video thumbnail as background */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/50 to-transparent z-10"></div>
                                            <video 
                                                src={`${import.meta.env.VITE_API_URL}/videos/stream/${topVideo._id}?token=${localStorage.getItem('token')}#t=2`} 
                                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                                                autoPlay 
                                                muted 
                                                loop 
                                                playsInline
                                            />
                                        </div>
                                        <div className="absolute bottom-0 left-0 p-10 z-20 w-full max-w-2xl">
                                            <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-bold text-[#fcb900] mb-4">
                                                #{topVideo.organization || 'Trending'}
                                            </div>
                                            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight font-heading shadow-black drop-shadow-lg">
                                                {topVideo.title}
                                            </h1>
                                            <p className="text-gray-300 mb-8 line-clamp-2 text-lg drop-shadow-md">
                                                {topVideo.description || "Experience the latest trending content on Pulse. Watch now in high definition."}
                                            </p>
                                            <div className="flex items-center gap-4">
                                                <button 
                                                    onClick={() => navigate(`/watch/${topVideo._id}`)}
                                                    className="px-8 py-4 rounded-xl bg-[#fcb900] text-dark-900 font-bold text-lg hover:bg-[#e5a800] transition-transform hover:scale-105 shadow-lg shadow-[#fcb900]/20 flex items-center gap-2"
                                                >
                                                    <FaPlay /> Watch Now
                                                </button>
                                                <button className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white text-xl hover:bg-white/20 transition-colors">
                                                    <FaPlus />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full h-[300px] rounded-[2rem] bg-dark-800 flex items-center justify-center border border-white/5">
                                        <div className="text-center">
                                            <p className="text-gray-500 text-lg">No featured content available</p>
                                        </div>
                                    </div>
                                )}

                                {/* Continue Watching (Video Library for now) */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white">Continue Watching</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredVideos.slice(0, 3).map(video => (
                                                <div key={video._id} className="bg-dark-800 rounded-3xl p-4 hover:bg-dark-700 transition-colors group cursor-pointer border border-transparent hover:border-white/5" onClick={() => navigate(`/watch/${video._id}`)}>
                                                <div className="aspect-video rounded-2xl bg-black/50 relative overflow-hidden mb-4">
                                                    <video
                                                        src={`${API_BASE_URL}/videos/stream/${video._id}?token=${localStorage.getItem('token')}#t=2`}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                                                        muted
                                                        loop
                                                        onMouseOver={e => e.target.play()}
                                                        onMouseOut={e => { e.target.pause(); e.target.currentTime = 2; }}
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                                                        <div className="w-12 h-12 rounded-full bg-[#fcb900] flex items-center justify-center text-dark-900 shadow-xl transform scale-50 group-hover:scale-100 transition-transform">
                                                            <FaPlay className="ml-1" />
                                                        </div>
                                                    </div>
                                                    {/* Progress Bar Mockup */}
                                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/10">
                                                        <div className="h-full bg-[#fcb900]" style={{ width: `${Math.random() * 80 + 10}%` }}></div>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-white truncate mb-1">{video.title}</h4>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                                    <span className="flex items-center gap-1"><FaChartLine className="text-[#fcb900]"/> {video.views || 0}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* For You Grid */}
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-xl font-bold text-white">For You</h3>
                                        <button className="text-[#fcb900] text-sm hover:underline">See All</button>
                                    </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {filteredVideos.map(video => (
                                            <div key={video._id} className="relative group cursor-pointer" onClick={() => navigate(`/watch/${video._id}`)}>
                                                <div className="aspect-[3/4] rounded-2xl bg-dark-800 overflow-hidden relative mb-3 border border-white/5">
                                                     <video
                                                        src={`${API_BASE_URL}/videos/stream/${video._id}?token=${localStorage.getItem('token')}#t=2`}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                                                        muted
                                                        loop
                                                        onMouseOver={e => e.target.play()}
                                                        onMouseOut={e => { e.target.pause(); e.target.currentTime = 2; }}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                        <h5 className="font-bold text-white text-sm line-clamp-2">{video.title}</h5>
                                                        <p className="text-xs text-gray-300 mt-1">{video.views || 0} views</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                    </>
                                )}
                            </div>

                            {/* Right Sidebar (Top Lists) */}
                            <div className="w-full lg:w-80 space-y-10">
                                {/* Search Bar (Mobile/Tablet only) - hidden on desk since it's in header */}
                                
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-6">Top This Week</h3>
                                    <div className="space-y-4">
                                        {filteredVideos.slice(0, 4).sort((a,b) => (b.views||0) - (a.views||0)).map((video, idx) => (
                                            <div key={video._id} className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate(`/watch/${video._id}`)}>
                                                <div className="w-16 h-16 rounded-xl bg-dark-800 flex-shrink-0 relative overflow-hidden border border-white/5">
                                                     <video
                                                        src={`${API_BASE_URL}/videos/stream/${video._id}?token=${localStorage.getItem('token')}#t=2`}
                                                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                                                        muted
                                                        loop
                                                        onMouseOver={e => e.target.play()}
                                                        onMouseOut={e => { e.target.pause(); e.target.currentTime = 2; }}
                                                    />
                                                    {/* Ranking Badge */}
                                                    <div className="absolute top-0 left-0 w-6 h-6 bg-[#fcb900] text-dark-900 flex items-center justify-center text-xs font-bold rounded-br-lg z-10">{idx + 1}</div>
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-white text-sm truncate group-hover:text-[#fcb900] transition-colors">{video.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500">{video.uploadedBy?.username || 'Unknown User'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-[#fcb900]">
                                                        <FaChartLine /> <span className="text-white">{video.views || 0} views</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                            {videos.length === 0 && <p className="text-gray-500 text-sm">No trending videos.</p>}
                                    </div>
                                    <button className="w-full mt-6 py-3 rounded-xl bg-[#fcb900] text-dark-900 font-bold font-sm hover:bg-[#e5a800] transition-colors">
                                        See More
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
