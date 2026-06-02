import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginWithGoogle, loginWithLinkedIn } from '../services/supabaseService';
import Icon from '../components/Icon';
import { Logo } from '../components/Logo';

interface SignInProps {
  defaultTab?: 'signin' | 'signup';
}

const SignIn: React.FC<SignInProps> = ({ defaultTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(defaultTab === 'signup' || location.pathname === '/signup');
  const [selectedRole, setSelectedRole] = React.useState<'Tenant' | 'Agent'>('Tenant');

  React.useEffect(() => {
    setIsSignUp(defaultTab === 'signup' || location.pathname === '/signup');
  }, [location.pathname, defaultTab]);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      localStorage.setItem('oauth_selected_role', selectedRole);
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleLinkedInAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      localStorage.setItem('oauth_selected_role', selectedRole);
      await loginWithLinkedIn();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with LinkedIn.');
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div id="signin-root-container" className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-tr from-purple-100/80 via-fuchsia-50/60 to-indigo-100/80">
      {/* Dynamic Futuristic Glow Backdrops */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-purple-400/30 to-indigo-300/30 rounded-full blur-[110px] pointer-events-none"></div>
      <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-fuchsia-400/20 rounded-full blur-[90px] pointer-events-none"></div>

      <div id="signin-container-card" className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] shadow-[0_30px_70px_rgba(147,51,234,0.1),inset_0_1px_2px_0_rgba(255,255,255,0.6)] p-8 md:p-10 relative overflow-hidden animate-slide-up">
        
        {/* Futuristic Laser Light Accents */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"></div>
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent"></div>

        <div className="relative z-10 flex flex-col items-center">
          
          <Link to="/">
            <Logo className="mb-8 scale-110 transition-all duration-300" />
          </Link>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight font-display mb-1.5">
              {isSignUp ? 'Initialize Account' : 'Access Core'}
            </h2>
            <p className="text-brand-600 text-xs font-mono uppercase tracking-widest font-bold">
              {isSignUp ? 'Identity Sync Required' : 'Decentralized Gateway'}
            </p>
          </div>

          <div className="space-y-6 w-full">
            {error && (
              <div id="auth-error-display" className="bg-red-500/10 border border-red-500/20 text-red-700 px-4 py-3.5 rounded-2xl text-xs font-mono animate-shake flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>{error}</span>
              </div>
            )}
            
            {message && (
              <div id="auth-success-display" className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 px-4 py-3.5 rounded-2xl text-xs font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{message}</span>
              </div>
            )}

            {/* Futuristic Role Switcher */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-950/5 rounded-2xl border border-purple-100 shadow-inner">
              <button
                id="role-tenant-btn"
                type="button"
                onClick={() => setSelectedRole('Tenant')}
                className={`py-3.5 text-xs font-mono font-bold rounded-xl transition-all duration-350 relative overflow-hidden ${
                  selectedRole === 'Tenant'
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(139,92,246,0.25)] border border-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                RENTER_BUYER
              </button>
              <button
                id="role-agent-btn"
                type="button"
                onClick={() => setSelectedRole('Agent')}
                className={`py-3.5 text-xs font-mono font-bold rounded-xl transition-all duration-350 relative overflow-hidden ${
                  selectedRole === 'Agent'
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-[0_4px_12px_rgba(139,92,246,0.25)] border border-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                AGENT_SELLER
              </button>
            </div>

            {/* Futuristic Larger Social Authentication Buttons with logos only */}
            <div className="flex justify-center items-center gap-6 pt-2 pb-1">
              {/* Google Authentication Port */}
              <button
                id="auth-google-btn"
                type="button"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                title={isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
                className="w-20 h-20 flex items-center justify-center bg-white border border-purple-100 hover:border-brand-500/40 rounded-3xl transition-all duration-300 shadow-[0_8px_30px_rgba(147,51,234,0.06)] hover:shadow-[0_12px_40px_rgba(147,51,234,0.15)] hover:scale-105 active:scale-95 disabled:opacity-50 group"
              >
                <svg className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.66l3.15-3.15C17.43 1.74 14.93 1 12 1 7.22 1 3.19 3.73 1.25 7.73l3.8 2.95C5.97 7.15 8.73 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58l3.7 2.87c2.16-2 3.43-4.94 3.43-8.58z" />
                  <path fill="#FBBC05" d="M5.05 14.68c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.25 7.17C.45 8.78 0 10.59 0 12.5s.45 3.72 1.25 5.33l3.8-3.15z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.03.69-2.34 1.1-4.23 1.1-3.27 0-6.03-2.11-7.02-5.18l-3.8 2.95C3.19 20.27 7.22 23 12 23z" />
                </svg>
              </button>

              {/* LinkedIn Authentication Port */}
              <button
                id="auth-linkedin-btn"
                type="button"
                onClick={handleLinkedInAuth}
                disabled={isLoading}
                title={isSignUp ? 'Sign up with LinkedIn' : 'Sign in with LinkedIn'}
                className="w-20 h-20 flex items-center justify-center bg-[#0A66C2] hover:bg-[#004182] border border-transparent rounded-3xl transition-all duration-300 shadow-[0_8px_30px_rgba(10,102,194,0.18)] hover:shadow-[0_12px_40px_rgba(10,102,194,0.3)] hover:scale-105 active:scale-95 disabled:opacity-50 group"
              >
                <svg className="w-10 h-10 fill-current text-white transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </button>
            </div>

            {/* Elegant Mode Toggle */}
            <div className="pt-4 text-center">
              <Link 
                id="auth-mode-toggle"
                to={isSignUp ? '/signin' : '/signup'}
                className="inline-block text-[11px] font-mono tracking-widest text-slate-500 hover:text-brand-600 font-bold uppercase transition-colors"
              >
                {isSignUp ? '// Already registered? Sync authentication' : "// Initialize registration token"}
              </Link>
            </div>
          </div>
        </div>

        {/* Futuristic Status Footer Bar */}
        <div className="mt-8 pt-5 border-t border-purple-100 w-full flex items-center justify-between text-[9px] font-mono text-slate-450 tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
            <span>HYPER_SECURE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Icon name="lock" size={10} className="text-indigo-500" />
            <span>ECDSA_256</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
