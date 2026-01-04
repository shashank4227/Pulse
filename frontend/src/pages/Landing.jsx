import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBolt, FaShieldAlt, FaChartLine, FaVideo, FaArrowRight, FaPlay, FaFingerprint, FaCloudUploadAlt, FaQrcode, FaBell, FaCreditCard, FaUsers, FaHamburger } from 'react-icons/fa';

/**
 * ScrollReveal Component
 * Adds a "swipe up fade in" animation when the element enters the viewport.
 */
const Reveal = ({ children, delay = 0, className = "" }) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        if (ref.current) observer.observe(ref.current);

        return () => {
            if (ref.current) observer.disconnect();
        };
    }, []);

    const style = {
        transitionDelay: `${delay}ms`,
        transform: isVisible ? 'translateY(0)' : 'translateY(50px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)', // Smooth ease-out
    };

    return (
        <div ref={ref} style={style} className={className}>
            {children}
        </div>
    );
};

const Landing = () => {
    const scrollToSection = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="min-h-screen bg-dark-900 text-white font-sans selection:bg-primary selection:text-white overflow-x-hidden">
            
            {/* Fixed Sidebar Navigation */}
            <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6 hidden lg:flex">
                
                <div className="p-2 rounded-full bg-dark-800/80 backdrop-blur-md border border-white/10 flex flex-col gap-4">
                    <div onClick={() => scrollToSection('home')} className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-gray-400 hover:bg-[#fcb900] hover:text-dark-900 transition-colors cursor-pointer group">
                         <FaVideo className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div onClick={() => scrollToSection('moderation')} className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-gray-400 hover:bg-white hover:text-dark-900 transition-colors cursor-pointer group">
                        <FaShieldAlt className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div onClick={() => scrollToSection('analytics')} className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-gray-400 hover:bg-white hover:text-dark-900 transition-colors cursor-pointer group">
                        <FaChartLine className="group-hover:scale-110 transition-transform" />
                    </div>
                </div>
            </div>

            {/* Mobile/Tablet Navbar (Top) */}
            <nav className="lg:hidden absolute top-0 w-full z-50 p-6 flex justify-between items-center bg-gradient-to-b from-dark-900 via-dark-900/90 to-transparent">
                 <div className="w-10 h-10 rounded-full bg-white text-dark-900 flex items-center justify-center font-bold text-lg">
                    <FaBolt />
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="px-4 py-2 text-sm font-medium text-white/80">Login</Link>
                    <Link to="/register" className="px-5 py-2 rounded-full bg-white text-dark-900 font-bold">Start Now</Link>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="relative z-10 w-full lg:pl-32 pb-20">
                
                 {/* Top Left Logo (Desktop) */}
                 <div className="hidden lg:flex absolute top-8 left-8 z-50 items-center gap-2">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-[#fcb900] text-dark-900 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(252,185,0,0.3)]">
                            <FaBolt />
                        </div>
                        <span className="text-2xl font-black tracking-tighter text-white mix-blend-difference">PULSE</span>
                    </Link>
                 </div>

                 {/* Top Right Buttons (Desktop) */}
                 <div className="hidden lg:flex absolute top-8 right-8 z-50 gap-6 items-center mix-blend-difference text-white">
                    <Link to="/login" className="text-sm font-bold tracking-wider hover:opacity-70 transition-opacity">LOGIN</Link>
                    <Link to="/register" className="px-6 py-2 rounded-full bg-white text-dark-900 text-sm font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        START NOW
                    </Link>
                 </div>

                {/* Hero Section */}
                {/* Hero Section */}
                <section id="home" className="min-h-screen flex flex-col items-center justify-center px-6 relative pt-20 lg:pt-0">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                         <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[#fcb900]/20 rounded-full blur-[150px] animate-pulse"></div>
                         <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[150px]"></div>
                    </div>

                    <Reveal>
                        <div className="text-center mb-12">
                            <span className="inline-block px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold tracking-[0.2em] text-[#fcb900] mb-6 bg-white/5 backdrop-blur-sm uppercase">
                                Make your content safe
                            </span>
                            <h1 className="text-5xl md:text-7xl lg:text-8xl leading-[0.9] font-heading font-black uppercase tracking-tighter mix-blend-lighten">
                                The Modern Way <br/>
                                <span className="bg-gradient-to-r from-[#fcb900] via-[#fde047] to-white bg-clip-text text-transparent">To Stream</span>
                            </h1>
                        </div>
                    </Reveal>

                    <Reveal delay={200}>
                        <Link to="/register" className="inline-flex items-center gap-2 bg-[#fcb900] px-8 py-4 rounded-full text-lg font-bold text-dark-900 hover:scale-105 transition-transform shadow-[0_10px_40px_rgba(252,185,0,0.4)] group">
                            Start Streaming
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </Reveal>
                    
                   
                </section>

                {/* App Mockup Section with Scattered Elements */}
                <section className="relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden">
                    {/* Background Elements */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#fcb900]/10 rounded-full blur-[200px]"></div>
                        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[200px]"></div>
                    </div>

                    <div className="relative z-10 max-w-7xl mx-auto w-full">
                        {/* Scattered Feature Cards */}
                        
                        {/* Left Card - Upload Feature */}
                        <Reveal delay={100} className="absolute left-0 top-[15%] lg:left-4 lg:top-[20%] w-[240px] md:w-[280px] z-20 hidden md:block">
                            <div className="bg-gradient-to-br from-dark-800/90 to-dark-900/90 backdrop-blur-md rounded-3xl p-6 border border-white/10 shadow-2xl hover:border-[#fcb900]/50 transition-all transform hover:scale-105">
                                <div className="aspect-video rounded-2xl overflow-hidden mb-4 bg-gradient-to-br from-[#fcb900]/20 to-transparent border border-white/5">
                                    <div className="h-full flex items-center justify-center">
                                        <FaCloudUploadAlt className="text-4xl text-[#fcb900]" />
                                    </div>
                                </div>
                                <p className="text-sm text-gray-400 mb-3">Quickly upload and process</p>
                                <Link to="/register" className="inline-block px-4 py-2 rounded-full bg-white text-dark-900 text-xs font-bold hover:scale-105 transition-transform">
                                    Upload Video
                                </Link>
                            </div>
                        </Reveal>

                        {/* Top Right - Start Now Button */}
                        <Reveal delay={200} className="absolute right-[5%] top-[10%] lg:right-[15%] lg:top-[15%] z-30 hidden md:block">
                            <Link to="/register" className="inline-block px-6 py-3 md:px-8 md:py-4 rounded-full bg-[#fcb900] text-dark-900 font-black text-xs md:text-sm hover:scale-110 transition-transform shadow-[0_10px_40px_rgba(252,185,0,0.5)]">
                                START NOW
                            </Link>
                        </Reveal>

                        {/* QR Code - Top Right */}
                        <Reveal delay={300} className="absolute right-[2%] top-[5%] lg:right-[8%] lg:top-[8%] z-20 hidden lg:block">
                            <div className="w-20 h-20 lg:w-24 lg:h-24 bg-white rounded-2xl p-3 shadow-2xl rotate-6 hover:rotate-0 transition-transform">
                                <div className="w-full h-full bg-gradient-to-br from-dark-900 to-dark-800 rounded-lg flex items-center justify-center">
                                    <FaQrcode className="text-3xl lg:text-4xl text-white" />
                                </div>
                            </div>
                        </Reveal>

                        {/* Main App Mockup - Tilted */}
                        <Reveal delay={400} className="relative mx-auto max-w-4xl mt-20 md:mt-0">
                            <div className="relative transform rotate-[-4deg] md:rotate-[-6deg] lg:rotate-[-5deg] hover:rotate-[-3deg] transition-transform duration-500">
                                {/* App Interface */}
                                <div className="relative bg-[#0f0f0f] rounded-[2rem] p-4 md:p-6 border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden aspect-[16/10] flex flex-col">
                                    {/* App Header */}
                                    <div className="flex items-center justify-between mb-6 px-2">
                                        <div className="flex items-center gap-8">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-[#fcb900] flex items-center justify-center text-dark-900 font-bold">
                                                    <FaBolt />
                                                </div>
                                                <span className="font-bold text-white tracking-tight hidden md:block">Pulse</span>
                                            </div>
                                            {/* Search Bar Mockup */}
                                            <div className="hidden md:flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 w-64 text-xs text-gray-500 gap-2">
                                                <div className="w-4 h-4 rounded-full border border-white/20"></div>
                                                <span>Search videos...</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center">
                                                <FaBell className="text-gray-400 text-xs" />
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fcb900] to-[#fde047]"></div>
                                        </div>
                                    </div>

                                    {/* Dashboard Content Mockup */}
                                    <div className="flex-1 flex gap-6 overflow-hidden">
                                        {/* Main Content */}
                                        <div className="flex-1 flex flex-col gap-6 overflow-hidden">
                                            {/* Hero Banner Mockup */}
                                            <div className="w-full h-40 md:h-56 rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border border-white/5 relative overflow-hidden group flex-shrink-0">
                                                 <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent z-10"></div>
                                                 {/* Abstract Video BG */}
                                                 <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-60"></div>
                                                 
                                                 <div className="absolute bottom-4 left-6 z-20 max-w-md">
                                                     <div className="px-2 py-0.5 rounded-md bg-white/10 backdrop-blur w-fit mb-2 text-[8px] font-bold text-[#fcb900] border border-white/10">TRENDING</div>
                                                     <h3 className="text-lg md:text-2xl font-black text-white mb-2 leading-tight">Cyberpunk: <br/>The New Era</h3>
                                                     <div className="flex items-center gap-3">
                                                         <div className="w-8 h-8 rounded-xl bg-[#fcb900] flex items-center justify-center text-dark-900 text-xs pl-0.5 hover:scale-105 transition-transform"><FaPlay /></div>
                                                         <span className="text-xs font-bold text-white">Watch Now</span>
                                                     </div>
                                                 </div>
                                            </div>

                                            {/* "For You" Video Row Mockup */}
                                            <div className="flex-1 flex flex-col gap-3 min-h-0">
                                                <div className="flex items-center justify-between px-1">
                                                    <h4 className="text-xs font-bold text-white">For You</h4>
                                                    <div className="text-[10px] text-[#fcb900]">See All</div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4">
                                                    {[
                                                        { title: "AI Revolution", views: "12K", color: "bg-blue-500/20" },
                                                        { title: "Space X Launch", views: "8.5K", color: "bg-purple-500/20" },
                                                        { title: "Minimal Setup", views: "42K", color: "bg-green-500/20" }
                                                    ].map((vid, i) => (
                                                        <div key={i} className="flex flex-col gap-2 group">
                                                            <div className="aspect-[4/3] rounded-xl bg-dark-800 border border-white/5 relative overflow-hidden">
                                                                <div className={`absolute inset-0 ${vid.color} opacity-20`}></div>
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                                                <div className="absolute bottom-2 left-2 right-2">
                                                                    <div className="h-1.5 w-3/4 bg-white/20 rounded-full mb-1"></div>
                                                                </div>
                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><FaPlay className="text-[8px] text-white"/></div>
                                                                </div>
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h5 className="text-[10px] font-bold text-white truncate">{vid.title}</h5>
                                                                <div className="text-[8px] text-gray-500">{vid.views} views</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Sidebar Mockup (Top This Week) */}
                                        <div className="w-48 hidden lg:flex flex-col gap-4 border-l border-white/5 pl-6">
                                            <div className="text-xs font-bold text-white mb-1">Top This Week</div>
                                            <div className="flex flex-col gap-3">
                                                {[1, 2, 3].map((i) => (
                                                     <div key={i} className="flex items-center gap-3 group">
                                                        <div className="w-8 h-8 rounded-lg bg-dark-800 border border-white/5 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-gray-600 relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                            {i}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="h-2 w-full bg-dark-700 rounded-full mb-1.5 group-hover:bg-[#fcb900] transition-colors"></div>
                                                            <div className="h-1.5 w-2/3 bg-dark-800 rounded-full"></div>
                                                        </div>
                                                     </div>
                                                ))}
                                            </div>
                                            
                                            <div className="mt-auto p-3 rounded-xl bg-gradient-to-br from-[#fcb900]/10 to-transparent border border-[#fcb900]/20">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <FaChartLine className="text-[#fcb900] text-xs" />
                                                    <span className="text-[10px] font-bold text-[#fcb900]">Trending</span>
                                                </div>
                                                <div className="text-[10px] text-gray-400 leading-tight">
                                                    "Future of AI" is trending #1 today!
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>

                                {/* Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#fcb900]/20 to-transparent rounded-[3rem] blur-2xl -z-10"></div>
                            </div>
                        </Reveal>

                        {/* Scattered Icons */}
                        <Reveal delay={500} className="absolute left-[5%] bottom-[20%] lg:left-[12%] lg:bottom-[25%] z-20 hidden md:block">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-[#fcb900] hover:border-[#fcb900] transition-all cursor-pointer group">
                                <FaVideo className="text-white text-sm md:text-base group-hover:text-dark-900 transition-colors" />
                            </div>
                        </Reveal>

                        <Reveal delay={600} className="absolute left-[2%] bottom-[10%] lg:left-[8%] lg:bottom-[15%] z-20 hidden md:block">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white hover:border-white transition-all cursor-pointer group">
                                <FaShieldAlt className="text-white text-xs md:text-sm group-hover:text-dark-900 transition-colors" />
                            </div>
                        </Reveal>

                        <Reveal delay={700} className="absolute right-[5%] bottom-[15%] lg:right-[12%] lg:bottom-[20%] z-20 hidden md:block">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white hover:border-white transition-all cursor-pointer group relative">
                                <FaBell className="text-white text-sm md:text-base group-hover:text-dark-900 transition-colors" />
                                <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 w-2 h-2 md:w-3 md:h-3 rounded-full bg-red-500 border-2 border-dark-900"></div>
                            </div>
                        </Reveal>

                        <Reveal delay={800} className="absolute right-[2%] bottom-[5%] lg:right-[8%] lg:bottom-[10%] z-20 hidden md:block">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-[#fcb900] to-[#fde047] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer shadow-lg shadow-[#fcb900]/30">
                                <FaPlay className="text-dark-900 text-xs md:text-sm" />
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* Feature 1: AI Moderation */}
                <section id="moderation" className="min-h-[80vh] flex flex-col justify-center px-6 py-20">
                    <Reveal>
                         <h2 className="text-4xl md:text-6xl font-black uppercase text-center mb-20 max-w-4xl mx-auto">
                            All Features You<br/>Need in <span className="text-gray-500">One Place</span>
                         </h2>
                    </Reveal>

                    <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto items-center">
                        <Reveal className="relative">
                            <div className="aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl relative bg-dark-800 group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#fcb900]/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
                                {/* Mock UI - Video Player */}
                                <div className="absolute inset-4 bg-dark-900 rounded-3xl border border-white/5 flex items-center justify-center overflow-hidden">
                                     <div className="absolute bottom-6 left-6 right-6 h-1 bg-white/20 rounded-full overflow-hidden">
                                        <div className="h-full w-2/3 bg-[#fcb900]"></div>
                                     </div>
                                     <FaPlay className="text-4xl text-white opacity-80" />
                                     
                                     {/* AI Alert Overlay */}
                                     <div className="absolute top-6 right-6 bg-red-500/90 backdrop-blur px-4 py-2 rounded-xl border border-red-400/50 flex items-center gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                        <FaShieldAlt className="text-white" />
                                        <span className="text-xs font-bold text-white">Content Flagged</span>
                                     </div>
                                </div>
                            </div>
                        </Reveal>
                        <Reveal delay={200}>
                            <div className="lg:pl-10">
                                <div className="w-16 h-16 rounded-2xl bg-white text-dark-900 flex items-center justify-center text-3xl mb-8 -rotate-3">
                                    <FaFingerprint />
                                </div>
                                <h3 className="text-3xl md:text-5xl font-bold font-heading mb-6">Personal AI <br/>Moderator</h3>
                                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                                    Upload, process, and let Gemini 1.5 Pro handle the rest. 
                                    We detect policy violations in real-time so you don't have to.
                                </p>
                                <Link to="/register" className="inline-block px-8 py-3 rounded-full bg-dark-800 text-white font-bold border border-white/20 hover:bg-white hover:text-dark-900 transition-all">
                                    Try Demo
                                </Link>
                            </div>
                        </Reveal>
                    </div>
                </section>

                {/* Feature 2: Real-time Analytics (Reversed) */}
                {/* Feature 2: Real-time Analytics (Reversed) */}
                <section id="analytics" className="min-h-[80vh] flex flex-col justify-center px-6 py-20 bg-white/5 rounded-[3rem] mx-4 my-20">
                    <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto items-center">
                        <Reveal delay={200} className="order-2 lg:order-1 lg:pr-10">
                            <div>
                                <div className="w-16 h-16 rounded-2xl bg-[#fcb900] text-dark-900 flex items-center justify-center text-3xl mb-8 rotate-3">
                                    <FaChartLine />
                                </div>
                                <h3 className="text-3xl md:text-5xl font-bold font-heading mb-6">Real-Time <br/>Processing</h3>
                                <p className="text-xl text-gray-400 leading-relaxed mb-8">
                                    Watch your video move through our pipeline with live Socket.io updates. 
                                    From upload to encoded stream in seconds.
                                </p>
                                <Link to="/register" className="inline-block px-8 py-3 rounded-full bg-white text-dark-900 font-bold hover:bg-opacity-90 transition-all">
                                    Start Now
                                </Link>
                            </div>
                        </Reveal>
                        <Reveal className="order-1 lg:order-2">
                             <div className="relative rounded-[2.5rem] bg-dark-900 p-8 border border-white/10 shadow-2xl">
                                <div className="flex justify-between items-center mb-8">
                                    <h4 className="text-xl font-bold">Processing Status</h4>
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                </div>
                                <div className="space-y-6">
                                    {['Upload Complete', 'Analyzing Content', 'Encoding Video', 'Ready to Stream'].map((step, i) => (
                                        <div key={i} className="flex items-center gap-4 group">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${i < 3 ? 'bg-[#fcb900] text-dark-900' : 'bg-dark-800 text-gray-500 group-hover:text-white transition-colors'}`}>
                                                {i + 1}
                                            </div>
                                            <div className="flex-1 h-12 bg-dark-800 rounded-xl flex items-center px-4 border border-white/5 group-hover:border-[#fcb900]/30 transition-colors">
                                                <span className="text-sm font-medium text-gray-300">{step}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </Reveal>
                    </div>
                </section>

                {/* Footer / CTA Frame */}
                <section className="min-h-[50vh] flex flex-col items-center justify-center px-6 pb-20 pt-10">
                     <Reveal>
                        <div className="max-w-4xl mx-auto text-center p-12 md:p-24 rounded-[3rem] bg-gradient-to-b from-dark-800 to-dark-900 border border-white/10 relative overflow-hidden">
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-[#fcb900] to-transparent opacity-50"></div>
                             
                             <h2 className="text-5xl md:text-7xl font-black uppercase mb-8">
                                Ready to <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#fcb900] to-white">Transform?</span>
                             </h2>
                             <p className="text-gray-400 text-lg mb-12 max-w-xl mx-auto">
                                Join the next generation of video platforms with built-in safety and performance.
                             </p>
                             <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                                 <Link to="/register" className="px-10 py-5 rounded-full bg-white text-dark-900 font-bold text-lg hover:scale-110 transition-transform">
                                    Get Started Free
                                 </Link>
                                 <Link to="/login" className="px-10 py-5 rounded-full border border-white/20 hover:bg-white/10 font-bold text-lg transition-colors">
                                    Contact Sales
                                 </Link>
                             </div>
                        </div>
                     </Reveal>
                     <footer className="mt-20 text-center text-gray-600 text-sm font-medium uppercase tracking-widest">
                        © 2025 Pulse Video • Built for the Future
                     </footer>
                </section>

            </main>
        </div>
    );
};

export default Landing;
