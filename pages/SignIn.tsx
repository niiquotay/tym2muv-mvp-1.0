import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginWithGoogle, loginWithEmail, signupWithEmail } from '../services/firebaseService';
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
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [authMethod, setAuthMethod] = React.useState<'email' | 'phone'>('email');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [verificationCode, setVerificationCode] = React.useState('');
  const [confirmationResult, setConfirmationResult] = React.useState<any>(null);
  const [name, setName] = React.useState('');
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
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        // User closed the popup, don't show an ugly error, maybe just leave it blank or a subtle log
        console.log('User closed popup.');
      } else if (err?.code === 'auth/unauthorized-domain' || (err?.message && err.message.includes('auth/unauthorized-domain')) || (err?.message && err.message.includes('Cross-Origin-Opener-Policy')) || (err?.message && err.message.includes('Origin not allowed'))) {
        setError(`Origin not allowed. To fix this, go to your Firebase Console > Authentication > Settings > Authorized domains and add the current URL domain. Or open this app in a new tab to sign in.`);
      } else {
        setError('An unexpected error occurred during Google Sign-In. Please try again.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      if (user && user.uid && !user.providerData?.length) {
        // Mock user fallback
        setMockUser({
          id: user.uid,
          name: user.displayName || name || 'Mock User',
          avatar: user.photoURL,
          socials: { email: user.email },
          role: selectedRole,
          verified: true
        });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Please sign in instead.');
      } else if (err?.code === 'auth/wrong-password' || err?.code === 'auth/user-not-found' || err?.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err?.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter your phone number.');
      return;
    }
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const { setupRecaptcha, requestPhoneCode } = await import('../services/firebaseService');
      const appVerifier = setupRecaptcha('recaptcha-container');
      const result = await requestPhoneCode(phoneNumber, appVerifier);
      setConfirmationResult(result);
      setMessage('Verification code sent. Please check your messages.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) {
      setError('Please enter the verification code.');
      return;
    }
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const result = await confirmationResult.confirm(verificationCode);
      const { handlePhoneUserCreation } = await import('../services/firebaseService');
      
      const user = await handlePhoneUserCreation(result.user, name, selectedRole);

      if (user && user.uid && !user.providerData?.length) {
        setMockUser({
          id: user.uid,
          name: user.displayName || name || 'Mock User',
          avatar: user.photoURL,
          socials: { phone: user.phoneNumber },
          role: selectedRole,
          verified: true
        });
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error(err);
      setError('Invalid verification code. Please try again.');
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

                <div className="flex justify-center gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('email');
                      setError(null);
                      setMessage(null);
                    }}
                    className={`text-sm font-semibold transition-all ${
                      authMethod === 'email' ? 'text-brand-600 border-b-2 border-brand-600 pb-1' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Email address
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('phone');
                      setError(null);
                      setMessage(null);
                    }}
                    className={`text-sm font-semibold transition-all ${
                      authMethod === 'phone' ? 'text-brand-600 border-b-2 border-brand-600 pb-1' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    Phone number
                  </button>
                </div>

                {authMethod === 'email' ? (
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
                ) : (
                  <form onSubmit={confirmationResult ? handleVerifyPhoneCode : handleSendPhoneCode} className="space-y-4">
                    {isSignUp && !confirmationResult && (
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
                    {!confirmationResult ? (
                      <div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Phone Number (e.g. +1234567890)"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all"
                          required
                        />
                         <div id="recaptcha-container" className="mt-2 text-center flex justify-center"></div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          placeholder="6-digit Verification Code"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all text-center tracking-widest text-lg font-mono"
                          required
                          maxLength={6}
                        />
                      </div>
                    )}
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : (confirmationResult ? 'Verify & Sign In' : 'Send Code')}
                    </button>
                    {confirmationResult && (
                      <button
                        type="button"
                        onClick={() => {
                           setConfirmationResult(null);
                           setVerificationCode('');
                           setMessage(null);
                        }}
                        className="w-full text-slate-500 hover:text-slate-800 text-sm font-medium pt-2 text-center"
                      >
                         Change phone number
                      </button>
                    )}
                  </form>
                )}

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white/50 text-slate-500 font-medium font-display">Or continue with</span>
                  </div>
                </div>

                <button 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  type="button"
                  className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md group disabled:opacity-50"
                >
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" referrerPolicy="no-referrer" className="w-6 h-6" />
                  <span>Google</span>
                </button>

                <div className="mt-6 text-center space-y-4">
                  <button 
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-sm text-slate-600 hover:text-brand-600 font-medium transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                  
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
