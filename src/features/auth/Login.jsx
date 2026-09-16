import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { COLLECTIONS } from '../../types/schema';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage } from './authErrors';
import { signInWithGoogle } from './googleAuth';
import GoogleSignInButton from './GoogleSignInButton';
import { NoiseBackground } from '../../components/ui/noise-background';
import { SmoothCaretInput } from '../../components/ui/smooth-caret-input';

export default function Login() {
  const navigate = useNavigate();
  const { currentUser, userRole, loading: authLoading, refreshUserProfile } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in with a valid role
  useEffect(() => {
    if (!authLoading && currentUser && userRole) {
      if (userRole === 'tpo') {
        navigate('/tpo/dashboard', { replace: true });
      } else {
        navigate('/drives', { replace: true });
      }
    }
  }, [currentUser, userRole, authLoading, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const { email, password } = formData;
    if (!email.trim() || !password) {
      return 'Please enter both email and password.';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const { email, password } = formData;

      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      // 2. Fetch the user's role and refresh context
      const profileData = await refreshUserProfile(uid);
      const role = profileData?.role;

      if (!role) {
        // Fallback check directly in Firestore if context refresh hasn't synced
        const userDocRef = doc(db, COLLECTIONS.USERS, uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          setError('No profile found for this account. Please register first.');
          setLoading(false);
          return;
        }
        const snapRole = userSnap.data().role;
        if (snapRole === 'tpo') {
          navigate('/tpo/dashboard');
        } else {
          navigate('/drives');
        }
        return;
      }

      if (role === 'tpo') {
        navigate('/tpo/dashboard');
      } else if (role === 'student') {
        navigate('/drives');
      } else {
        setError('Your account role is not set correctly. Please contact support.');
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithGoogle('login');
      await refreshUserProfile(result.uid);

      if (result.role === 'tpo') {
        navigate('/tpo/dashboard');
      } else {
        navigate('/drives');
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-neutral-50 dark:bg-[#09090b] px-4 py-12">
      <NoiseBackground
        borderWidth="p-[6px]"
        containerClassName="w-full max-w-md shadow-xs"
        innerClassName="bg-white dark:bg-[#121215] p-8 sm:p-9"
      >
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 mb-1">
          Welcome back
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Log in to the Placement Cell Portal
        </p>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm px-4 py-3 flex flex-col gap-1.5"
          >
            <span>{error}</span>
            {error.includes('sign-up page') || error.includes('register') || error.includes('create an account') ? (
              <Link
                to="/register"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Go to Sign Up page &rarr;
              </Link>
            ) : null}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Email
            </label>
            <SmoothCaretInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Password
              </label>
            </div>
            <SmoothCaretInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black text-sm font-medium py-2.5 shadow-xs hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer mt-2"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">OR</span>
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <GoogleSignInButton onClick={handleGoogleSignIn} disabled={loading} />

        <p className="mt-6 text-sm text-neutral-500 dark:text-neutral-400 text-center">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </NoiseBackground>
    </div>
  );
}
