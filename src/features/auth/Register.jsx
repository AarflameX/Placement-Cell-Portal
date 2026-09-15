import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { COLLECTIONS } from '../../types/schema';
import { useAuth } from '../../context/AuthContext';
import { getAuthErrorMessage } from './authErrors';
import { signInWithGoogle } from './googleAuth';
import GoogleSignInButton from './GoogleSignInButton';
import { NoiseBackground } from '../../components/ui/noise-background';
import { SmoothCaretInput } from '../../components/ui/smooth-caret-input';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'tpo', label: 'TPO' },
];

const MIN_PASSWORD_LENGTH = 6;

export default function Register() {
  const navigate = useNavigate();
  const { currentUser, userRole, loading: authLoading, refreshUserProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'student',
  });
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
    const { fullName, email, password } = formData;

    if (!fullName.trim() || !email.trim() || !password) {
      return 'Please fill in all fields.';
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    }
    // Lightweight email shape check; Firebase will do the authoritative validation.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address.';
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
      const { fullName, email, password, role } = formData;

      // 1. Create the Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { uid } = userCredential.user;

      // 2. Initialize the Firestore profile document at users/{uid}
      await setDoc(doc(db, COLLECTIONS.USERS, uid), {
        uid,
        name: fullName.trim(),
        email,
        role,
        usn: '',
        branch: '',
        cgpa: 0,
        createdAt: new Date(),
      });

      // 3. Sync profile into AuthContext before routing
      await refreshUserProfile(uid);

      // 4. Auto-sign-in redirect
      if (role === 'tpo') {
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

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      // Register with the selected role
      const result = await signInWithGoogle('register', formData.role);
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
          Create an account
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Join the Placement Cell Portal
        </p>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 text-sm px-4 py-3"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Full Name
            </label>
            <SmoothCaretInput
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={formData.fullName}
              onChange={handleChange}
              disabled={loading}
              placeholder="Jane Doe"
            />
          </div>

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
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Password
            </label>
            <SmoothCaretInput
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              placeholder="At least 6 characters"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              I am a
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={loading}
              className="w-full rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3.5 py-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 disabled:opacity-50 transition-all"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value} className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black text-sm font-medium py-2.5 shadow-xs hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer mt-2"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          <span className="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">OR</span>
          <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>

        <GoogleSignInButton onClick={handleGoogleSignIn} disabled={loading} />
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 text-center">
          Signs you up as <span className="font-semibold text-neutral-700 dark:text-neutral-300">{formData.role === 'tpo' ? 'TPO' : 'Student'}</span> — change the dropdown above if needed.
        </p>

        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </NoiseBackground>
    </div>
  );
}
