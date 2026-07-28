import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, ArrowRight, PhoneCall } from 'lucide-react';
import { useState } from 'react';
import api from '@services/axios.js';
import { setAuth } from '@store/slices/authSlice.js';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().min(1, 'Enter your email or 10-digit mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const loginMutation = useMutation({
    mutationFn: (data) => api.post('/auth/login', { identifier: data.email, email: data.email, password: data.password }),
    onSuccess: (res) => {
      const { user, accessToken, refreshToken } = res.data;
      dispatch(setAuth({ user, accessToken, refreshToken }));
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate('/dashboard');
    },
    onError: () => {},
  });

  const onSubmit = (data) => loginMutation.mutate(data);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500 text-sm mt-1">Sign in with Mobile Number or Email</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {loginMutation.isError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-danger text-sm font-medium animate-fade-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{loginMutation.error?.response?.data?.message || loginMutation.error?.message || 'Invalid credentials. Please try again.'}</span>
          </div>
        )}
        {/* Email or Phone */}
        <div className="form-group">
          <label className="input-label">Mobile Number or Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User size={16} className="text-gray-400" />
            </div>
            <input
              {...register('email')}
              type="text"
              placeholder="9443434343 or admin@inventory.com"
              className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
              autoFocus
            />
          </div>
          {errors.email && <p className="input-error-msg">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="form-group">
          <div className="flex items-center justify-between mb-1.5">
            <label className="input-label mb-0">Password</label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock size={16} className="text-gray-400" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="input-error-msg">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="btn-primary w-full py-2.5 text-base"
        >
          {loginMutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              Sign in
              <ArrowRight size={16} />
            </div>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        New staff member?{' '}
        <Link to="/register" className="text-brand-600 font-semibold hover:text-brand-700">
          Register account request
        </Link>
      </p>

      {/* Inventory Management Admin Credentials */}
      <div className="mt-8 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
        <p className="text-xs font-extrabold text-indigo-800 mb-1">Inventory Management Admin Login</p>
        <p className="text-2xs text-indigo-700">Mobile / Email: <code className="font-mono bg-white px-1 py-0.5 rounded border">9443434343</code> or <code className="font-mono bg-white px-1 py-0.5 rounded border">admin@inventory.com</code></p>
        <p className="text-2xs text-indigo-700 mt-1">Password: <code className="font-mono bg-white px-1 py-0.5 rounded border">Admin@123</code></p>
      </div>
    </motion.div>
  );
}
