import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaBolt } from 'react-icons/fa';

const AuthLayout = ({ children, title, subtitle }) => (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 relative overflow-hidden font-sans text-white">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[#fcb900]/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-md p-8 bg-dark-800/80 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl">
            <div className="text-center mb-8">
                <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
                   <div className="w-10 h-10 rounded-xl bg-[#fcb900] text-dark-900 flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(252,185,0,0.3)]">
                        <FaBolt />
                    </div>
                    <span className="text-2xl font-black tracking-tighter text-white mix-blend-difference font-heading">PULSE</span>
                </Link>
                <h2 className="text-2xl font-bold text-white mb-2 font-heading">{title}</h2>
                <p className="text-gray-400 text-sm">{subtitle}</p>
            </div>
            {children}
        </div>
    </div>
);

const InputField = ({ type, placeholder, value, onChange }) => (
    <div className="relative group">
        <input 
            type={type} 
            placeholder={placeholder} 
            value={value} 
            onChange={onChange} 
            className="w-full bg-dark-900/50 border border-white/10 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#fcb900] focus:ring-1 focus:ring-[#fcb900] transition-all duration-300 placeholder-gray-600 font-medium"
            required 
        />
    </div>
);

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Welcome Back" subtitle="Please sign in to continue">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-6 text-sm flex items-center gap-2 font-bold">⚠️ {error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                <InputField type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                
                <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-[#fcb900] hover:bg-[#e5a800] text-dark-900 py-3.5 rounded-xl font-bold shadow-lg shadow-[#fcb900]/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>
            <div className="mt-8 text-center text-sm text-gray-400">
                Don't have an account? <Link to="/register" className="text-[#fcb900] hover:text-white font-bold transition-colors">Create account</Link>
            </div>
        </AuthLayout>
    );
};

export const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [organization, setOrganization] = useState('');
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMsg('');
        setIsLoading(true);
        try {
            const user = await register(username, email, password, organization);
            if (user?.status === 'pending') {
                setSuccessMsg('Request sent! Waiting for admin approval.');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.toString());
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout title="Create Account" subtitle="Join the future of video streaming">
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl mb-6 text-sm flex items-center gap-2 font-bold">⚠️ {error}</div>}
            {successMsg && <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-xl mb-6 text-sm flex items-center gap-2 font-bold">✅ {successMsg}</div>}
            
            {!successMsg && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
                    <InputField type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                    <InputField type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                    <InputField type="text" placeholder="Organization / Workspace Name" value={organization} onChange={e => setOrganization(e.target.value)} />
                    
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-[#fcb900] hover:bg-[#e5a800] text-dark-900 py-3.5 rounded-xl font-bold shadow-lg shadow-[#fcb900]/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {isLoading ? 'Creating Account...' : 'Get Started'}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                        If the organization doesn't exist, you'll become its Admin.
                    </p>
                </form>
            )}


            <div className="mt-8 text-center text-sm text-gray-400">
                Already have an account? <Link to="/login" className="text-[#fcb900] hover:text-white font-bold transition-colors">Sign in</Link>
            </div>
        </AuthLayout>
    );
};
