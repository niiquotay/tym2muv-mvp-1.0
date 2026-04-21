import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginWithGoogle } from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import { Logo } from '../components/Logo';

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setMockUser } = useAuth() as any;

  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [selectedRole, setSelectedRole] = React.useState<'Tenant' | 'Agent'>('Tenant');

  // Where to send them after login (default to home)
  // @ts-ignore
  const from = location.state?.from?.pathname || "/";

  const handleGoogleLogin = async () => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const user = await loginWithGoogle(selectedRole);
      if (user && user.uid && !user.providerData?.length) {
        // Mock user
        setMockUser({
          id: user.uid,
          name: user.displayName,
          avatar: user.photoURL,
          socials: { email: user.email },
          role: selectedRole,
          verified: true
        });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain' || (err?.message && err.message.includes('auth/unauthorized-domain')) || (err?.message && err.message.includes('Cross-Origin-Opener-Policy')) || (err?.message && err.message.includes('Origin not allowed'))) {
        setError(`Origin not allowed. To fix this, go to your Firebase Console > Authentication > Settings > Authorized domains and add the current URL domain. Or open this app in a new tab to sign in.`);
      } else {
        setError('An unexpected error occurred during Google Sign-In. Please try again.');
      }
      console.error(err);
    } finally {
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
      const { sendPasswordResetEmail } = await import('../services/firebaseService');
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
            {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 mb-8">
            {isForgotPassword 
              ? 'Enter your email address and we will send you a link to reset your password.' 
              : 'Sign in to manage your listings, chat with sellers, and access your profile.'}
          </p>

          <div className="space-y-4 w-full">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium animate-shake">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm font-medium">
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
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6 shadow-inner">
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

                <p className="text-sm text-slate-500 mb-6 px-2">
                  {selectedRole === 'Tenant' 
                    ? "Welcome! Sign in or create an account to start exploring properties and chatting with agents." 
                    : "Join our network of professionals. Manage listings, close deals, and build your reputation."}
                </p>

                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md group disabled:opacity-50"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" referrerPolicy="no-referrer" className="w-6 h-6" />
                  <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white/50 text-slate-400">Secure Authentication</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  By signing in, you agree to our Terms of Service and Privacy Policy. 
                  We use Google to securely authenticate your account.
                </p>
                
                <div className="mt-4 text-center">
                  <button 
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError(null);
                      setMessage(null);
                    }}
                    className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                  >
                    Forgot your password?
                  </button>
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
