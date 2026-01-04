import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import api from '../utils/api';

const VideoPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [videoUrl, setVideoUrl] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        // Use standard consistent logic for local development
         setVideoUrl(`${import.meta.env.VITE_API_URL}/videos/stream/${id}?token=${token}`);

         // Explicitly increment view count when player mounts (user visits page)
         // This handles "resuming" correctly as every visit is a view.
         const incrementView = async () => {
             try {
                 await api.post(`/videos/${id}/view`);
             } catch (err) {
                 console.error("View increment failed", err);
             }
         };
         incrementView();
    }, [id]);

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center relative animate-fadeIn">
            <button 
                onClick={() => navigate('/')} 
                className="absolute top-8 left-8 text-white/70 flex items-center gap-2 hover:text-white hover:bg-white/10 px-4 py-2 rounded-full transition-all duration-300 group z-50 backdrop-blur-sm"
            >
                <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
                <span className="font-heading">Back to Library</span>
            </button>

            <div className="w-full max-w-6xl px-4 relative z-10">
                <div className="aspect-video bg-dark-900 rounded-2xl overflow-hidden shadow-2xl shadow-primary-DEFAULT/10 border border-white/5 relative group">
                   {!videoUrl ? (
                       <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-10 h-10 border-4 border-primary-DEFAULT border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p>Loading Stream...</p>
                       </div>
                   ) : (
                       <video 
                            controls 
                            autoPlay 
                            className="w-full h-full object-contain"
                            onError={() => setError(true)}
                       >
                           <source src={videoUrl} type="video/mp4" />
                           Your browser does not support the video tag.
                       </video>
                   )}
                   
                   {error && (
                       <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-red-500 backdrop-blur-sm">
                           <div className="text-4xl mb-4">⚠️</div>
                           <h3 className="text-xl font-bold mb-2">Streaming Error</h3>
                           <p className="text-gray-400">Failed to load stream. You may not have permission.</p>
                       </div>
                   )}
                </div>
                
                <div className="mt-6 flex justify-between items-end px-2">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2 font-heading">Now Playing</h1>
                        <p className="text-gray-500 text-sm">Stream ID: <span className="font-mono text-gray-400">{id}</span></p>
                    </div>
                </div>
            </div>
            
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary-DEFAULT/5 blur-[150px] pointer-events-none z-0"></div>
        </div>
    );
};

export default VideoPlayer;
