import React, { useState, useRef } from 'react';
import api from '../utils/api';
import { FaCloudUploadAlt, FaFileVideo, FaCheck } from 'react-icons/fa';

const VideoUpload = ({ onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('video', file);
        formData.append('title', title || file.name.split('.')[0]);

        try {
            setUploading(true);
            setProgress(0);
            
            const config = {
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.lengthComputable) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(percentCompleted);
                        console.log(`Upload progress: ${percentCompleted}%`);
                    }
                }
            };
            
            await api.post('/videos/upload', formData, config);
            
            // Animation delay to show 100%
            setTimeout(() => {
                setFile(null);
                setTitle('');
                setProgress(0);
                setUploading(false);
                if (onUploadSuccess) onUploadSuccess();
            }, 1000);
            
        } catch (error) {
            console.error(error);
            setUploading(false);
            setProgress(0);
            alert('Upload failed: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8 shadow-xl max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-heading font-bold text-white flex items-center gap-3">
                    <span className="p-2 bg-primary-DEFAULT/10 rounded-lg text-primary-DEFAULT">
                        <FaCloudUploadAlt className="text-xl" />
                    </span>
                    Upload Video
                </h3>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
                {/* Drag and Drop Zone */}
                <div 
                    className={`relative border-2 border-dashed rounded-xl p-10 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer text-center group
                        ${dragActive ? 'border-primary-DEFAULT bg-primary-DEFAULT/10 scale-[1.01]' : 'border-gray-700 hover:border-primary-DEFAULT/50 hover:bg-dark-700/50'}
                        ${file ? 'border-green-500/50 bg-green-500/5' : ''}
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current.click()}
                >
                    <input 
                        ref={inputRef}
                        type="file" 
                        accept="video/*" 
                        onChange={handleChange} 
                        className="hidden"
                    />
                    
                    {file ? (
                        <div className="flex flex-col items-center animate-fadeIn">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                <FaCheck className="text-green-500 text-2xl" />
                            </div>
                            <p className="text-white font-medium text-lg mb-1">{file.name}</p>
                            <p className="text-gray-500 text-sm">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                className="mt-4 text-xs text-red-400 hover:text-red-300 hover:underline z-10"
                            >
                                Remove file
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center pointer-events-none">
                            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                                <FaFileVideo className="text-gray-400 text-2xl group-hover:text-primary-DEFAULT transition-colors" />
                            </div>
                            <p className="text-gray-300 font-medium text-lg mb-2">
                                Drag & drop video here
                            </p>
                            <p className="text-gray-500 text-sm">
                                or <span className="text-primary-DEFAULT group-hover:underline">browse files</span> from your computer
                            </p>
                        </div>
                    )}
                </div>

                {/* Details & Actions */}
                <div className={`transition-all duration-500 ${file ? 'opacity-100 translate-y-0' : 'opacity-50 pointer-events-none translate-y-4'}`}>
                    <div className="mb-6">
                        <label className="block text-gray-400 text-sm font-medium mb-2 ml-1">Title</label>
                        <input 
                            type="text" 
                            placeholder="Give your video a catchy title..." 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            className="w-full bg-dark-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-primary-DEFAULT focus:ring-1 focus:ring-primary-DEFAULT transition-all placeholder-gray-600"
                        />
                    </div>

                    {uploading && (
                        <div className="mb-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-primary-glow font-medium">Uploading...</span>
                                <span className="text-white">{progress}%</span>
                            </div>
                            <div className="w-full bg-dark-900 rounded-full h-2 relative overflow-hidden">
                                <div 
                                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary-DEFAULT to-accent rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    style={{ width: `${Math.max(progress, 2)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button 
                            type="submit" 
                            disabled={uploading || !file}
                            className={`
                                px-8 py-3 rounded-xl font-bold text-white transition-all duration-300 shadow-lg
                                ${uploading 
                                    ? 'bg-dark-700 cursor-not-allowed text-gray-400' 
                                    : 'bg-gradient-to-r from-primary-DEFAULT to-blue-600 hover:from-blue-500 hover:to-primary-DEFAULT hover:shadow-primary-DEFAULT/30 hover:-translate-y-0.5'
                                }
                            `}
                        >
                            {uploading ? 'Processing...' : 'Upload Video'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default VideoUpload;
