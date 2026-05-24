import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginWithEmail, signupWithEmail, loginWithGoogle } from '../services/supabaseService';
import { useAuth } from '../context/AuthContext';
import { checkRateLimit } from '../services/security';
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
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  const [isSignUp, setIsSignUp] = React.useState(defaultTab === 'signup' || location.pathname === '/signup');
  
  React.useEffect(() => {
    setIsSignUp(defaultTab === 'signup' || location.pathname === '/signup');
  }, [location.pathname, defaultTab]);
  const [authMethod, setAuthMethod] = React.useState<'email' | 'phone'>('email');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<'Tenant' | 'Agent'>('Tenant');

  // Where to send them after login (default to home)
  // @ts-ignore
  const from = location.state?.from?.pathname || "/";


  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkRateLimit('login_attempt', 5, 300000)) {
      setError('Too many login attempts. Please try again in 5 minutes.');
      return;
    }

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      let user;
      if (isSignUp) {
        user = await signupWithEmail(email, password, name, selectedRole);
      } else {
        user = await loginWithEmail(email, password, selectedRole);
      }
      
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.message === 'User already registered') {
        setError('This email is already in use. Please sign in instead.');
      } else if (err?.message === 'Invalid login credentials') {
        setError('Invalid email or password.');
      } else if (err?.message?.includes('Password should be')) {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      console.error(err);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setMessage(null);
    setIsLoading(true);
    try {
      const { sendPasswordResetEmail } = await import('../services/supabaseService');
      await sendPasswordResetEmail(email);
      setMessage('Password reset email sent. Please check your inbox.');
      setIsForgotPassword(false);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-card rounded-3xl shadow-[0_20px_50px_-12px_rgba(147,51,234,0.15)] p-8 md:p-10 relative overflow-hidden animate-slide-up">
        
        {/* Decorative background elements inside card */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-200 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-fuchsia-200 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <Logo className="mb-6 scale-110" />
          
          <h2 className="text-3xl font-bold text-slate-800 mb-2 font-display">
            {isForgotPassword ? 'Reset Password' : (isSignUp ? 'Create an Account' : 'Welcome Back')}
          </h2>
          <p className="text-slate-500 mb-8">
            {isForgotPassword 
              ? 'Enter your email address and we will send you a link to reset your password.' 
              : (isSignUp ? 'Join our platform to manage your property journey.' : 'Sign in to manage your listings, chat with sellers, and access your profile.')}
          </p>

          <div className="space-y-4 w-full">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-shake text-left">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm font-medium text-left">
                {message}
              </div>
            )}

            {isForgotPassword ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError(null);
                    setMessage(null);
                  }}
                  className="w-full text-slate-500 hover:text-slate-800 text-sm font-medium py-2 transition-colors"
                >
                  Back to Sign In
                </button>
              </form>
            ) : (
              <>
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('Tenant')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      selectedRole === 'Tenant'
                        ? 'bg-white text-brand-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    I'm a Renter / Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('Agent')}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                      selectedRole === 'Agent'
                        ? 'bg-white text-brand-600 shadow-sm border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    I'm an Agent / Seller
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl transition-all shadow-sm mb-4"
                >
                  <Icon name="search" size={20} />
                  Continue with Google
                </button>
                
                <div className="relative flex items-center mb-6">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">or</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  {isSignUp && (
                    <div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                        required={isSignUp}
                      />
                    </div>
                  )}
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                      required
                      minLength={6}
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                  </button>
                </form>

                <div className="mt-6 text-center space-y-4">
                  <Link 
                    to={isSignUp ? '/signin' : '/signup'}
                    className="inline-block text-sm text-slate-600 hover:text-brand-600 font-medium transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </Link>
                  
                  {!isSignUp && (
                    <div className="block pt-2 border-t border-slate-100">
                      <button 
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setError(null);
                          setMessage(null);
                        }}
                        className="text-xs text-slate-500 hover:text-brand-600 font-medium transition-colors"
                      >
                        Forgot your password?
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 w-full flex items-center justify-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <div className="flex items-center gap-1">
              <Icon name="shield" size={12} className="text-brand-500" />
              <span>Secure Session</span>
            </div>
            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
            <div className="flex items-center gap-1">
              <Icon name="lock" size={12} className="text-brand-500" />
              <span>Encrypted Storage</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
