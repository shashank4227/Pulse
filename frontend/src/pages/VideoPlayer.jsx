import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaThumbsUp, FaShare, FaFlag, FaUserCircle, FaClock, FaEye } from 'react-icons/fa';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const VideoPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [video, setVideo] = useState(null);
    const [relatedVideos, setRelatedVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    // Helper for API URL
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchVideoData = async () => {
            try {
                setLoading(true);
                // 1. Fetch current video details
                const videoRes = await api.get(`/videos/${id}`);
                setVideo(videoRes.data);

                // 2. Fetch related videos (using normal list for now, ideally filtered)
                const relatedRes = await api.get('/videos');
                // Filter out current video
                const others = relatedRes.data.filter(v => v._id !== id);
                setRelatedVideos(others);

                // 3. Increment View
                await api.post(`/videos/${id}/view`);
            } catch (err) {
                console.error("Failed to load video data", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchVideoData();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-dark-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-[#fcb900] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!video) return <div className="text-white text-center mt-20">Video not found</div>;

    return (
        <div className="min-h-screen bg-dark-900 text-white font-sans">
             {/* Navbar Placeholder (Back Button) */}
             <div className="h-16 flex items-center px-6 border-b border-white/5 bg-dark-800/80 backdrop-blur-sm sticky top-0 z-50">
                 <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <FaArrowLeft /> <span className="font-bold">Back to Feed</span>
                </button>
             </div>

             <div className="max-w-[1800px] mx-auto p-6 lg:p-10 flex flex-col lg:flex-row gap-8">
                {/* LEFT: Main Player & Info */}
                <div className="flex-1 min-w-0">
                    {/* Player Container */}
                    <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/5 relative group">
                         <video 
                            controls 
                            autoPlay 
                            className="w-full h-full object-contain"
                            onError={() => setError(true)}
                        >
                           <source src={`${API_BASE_URL}/videos/stream/${id}?token=${localStorage.getItem('token')}`} type="video/mp4" />
                           Your browser does not support the video tag.
                        </video>
                         {error && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-red-500 backdrop-blur-sm">
                                <div className="text-4xl mb-4">⚠️</div>
                                <h3 className="text-xl font-bold mb-2">Streaming Error</h3>
                                <p className="text-gray-400">Failed to load stream. You may not have permission.</p>
                            </div>
                        )}
                    </div>

                    {/* Metadata Section */}
                    <div className="mt-6 space-y-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">{video.title}</h1>
                            <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1.5"><FaEye /> {video.views} views</span>
                                    <span className="flex items-center gap-1.5"><FaClock /> {new Date(video.createdAt).toLocaleDateString()}</span>
                                </div>

                            </div>
                        </div>

                         {/* Creator Info & Description */}
                         <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/[0.07] transition-colors cursor-pointer border border-white/5">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#fcb900] to-[#fde047] p-0.5 shrink-0">
                                <div className="w-full h-full rounded-full bg-dark-900 flex items-center justify-center text-[#fcb900] font-bold text-xl">
                                    {video.uploadedBy?.username?.[0]?.toUpperCase() || <FaUserCircle />}
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg">{video.uploadedBy?.username || 'Unknown Creator'}</h3>
                                <p className="text-sm text-gray-400 mb-3">{'Pulse Creator'}</p>
                                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                                    {video.description || "No description provided."}
                                </p>
                            </div>
                         </div>
                    </div>
                </div>

                {/* RIGHT: Sidebar (Wait Next) */}
                <div className="w-full lg:w-[400px] shrink-0 space-y-6">
                    <h3 className="text-xl font-bold text-white mb-4">Up Next</h3>
                    <div className="space-y-4">
                         {relatedVideos.slice(0, 10).map(relVideo => (
                             <div 
                                key={relVideo._id} 
                                onClick={() => navigate(`/watch/${relVideo._id}`)}
                                className="flex gap-3 group cursor-pointer"
                            >
                                <div className="w-40 aspect-video rounded-xl bg-gray-800 overflow-hidden relative shrink-0 border border-white/5">
                                    <video 
                                        src={`${API_BASE_URL}/videos/stream/${relVideo._id}?token=${localStorage.getItem('token')}#t=5`} 
                                        className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
                                        muted
                                        onMouseOver={e => e.target.play()}
                                        onMouseOut={e => {e.target.pause(); e.target.currentTime=5;}}
                                    />
                                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">4:20</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm line-clamp-2 mb-1 group-hover:text-[#fcb900] transition-colors">{relVideo.title}</h4>
                                    <p className="text-xs text-gray-400">{relVideo.uploadedBy?.username || 'Pulse Creator'}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1">
                                        <span>{relVideo.views || 0} views</span>
                                        <span>•</span>
                                        <span>{new Date(relVideo.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                             </div>
                         ))}
                         {relatedVideos.length === 0 && (
                             <div className="text-gray-500 text-sm text-center py-10">No related videos found.</div>
                         )}
                    </div>
                </div>
             </div>
        </div>
    );
};

export default VideoPlayer;
