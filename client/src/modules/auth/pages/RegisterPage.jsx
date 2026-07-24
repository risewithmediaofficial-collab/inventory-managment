import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import api from '@services/axios.js';
import toast from 'react-hot-toast';

const schema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName:  z.string().min(2, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/auth/register', data),
    onSuccess: (res) => {
      setIsSubmitted(true);
      toast.success('Registration submitted! Awaiting Admin Approval.');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Registration failed.';
      toast.error(msg);
    },
  });

  if (isSubmitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6 space-y-5">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100 shadow-sm">
          <Clock className="w-8 h-8 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900">Registration Submitted!</h2>
          <p className="text-sm font-semibold text-amber-700 mt-1 bg-amber-50 py-1.5 px-3 rounded-full inline-block">
            Status: Waiting for Admin Approval
          </p>
        </div>
        <p className="text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
          Your account request has been received. A Super Admin will review your account, approve access, and assign your system role & warehouse position.
        </p>
        <div className="pt-4">
          <button
            onClick={() => navigate('/login')}
            className="btn-primary px-6 py-2.5 text-sm font-bold shadow-md"
          >
            Return to Sign In
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="text-gray-500 mt-1 text-sm">Register for ERP access. Administrator approval is required.</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
        {mutation.isError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-danger text-sm font-medium animate-fade-in space-y-1">
            <p>{mutation.error?.response?.data?.message || mutation.error?.message || 'Registration failed.'}</p>
            {mutation.error?.response?.status === 409 && (
              <Link to="/login" className="inline-block text-xs text-indigo-700 hover:underline font-bold mt-1">
                → Click here to Sign In with this email
              </Link>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="input-label">First Name</label>
            <input {...register('firstName')} placeholder="John" className={`input ${errors.firstName ? 'input-error' : ''}`} />
            {errors.firstName && <p className="input-error-msg">{errors.firstName.message}</p>}
          </div>
          <div className="form-group">
            <label className="input-label">Last Name</label>
            <input {...register('lastName')} placeholder="Doe" className={`input ${errors.lastName ? 'input-error' : ''}`} />
            {errors.lastName && <p className="input-error-msg">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="form-group">
          <label className="input-label">Email Address</label>
          <input {...register('email')} type="email" placeholder="you@company.com" className={`input ${errors.email ? 'input-error' : ''}`} />
          {errors.email && <p className="input-error-msg">{errors.email.message}</p>}
        </div>

        <div className="form-group">
          <label className="input-label">Phone Number (Optional)</label>
          <input {...register('phone')} type="text" placeholder="+91 9876543210" className="input" />
        </div>

        <div className="form-group">
          <label className="input-label">Password</label>
          <div className="relative">
            <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters" className={`input pr-10 ${errors.password ? 'input-error' : ''}`} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="input-error-msg">{errors.password.message}</p>}
        </div>

        <div className="form-group">
          <label className="input-label">Confirm Password</label>
          <input {...register('confirmPassword')} type="password" placeholder="Repeat password" className={`input ${errors.confirmPassword ? 'input-error' : ''}`} />
          {errors.confirmPassword && <p className="input-error-msg">{errors.confirmPassword.message}</p>}
        </div>

        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full py-2.5 text-base mt-2">
          {mutation.isPending ? (
            <div className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</div>
          ) : (
            <div className="flex items-center justify-center gap-2">Submit Account Registration <ArrowRight size={16} /></div>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700">Sign in</Link>
      </p>
    </motion.div>
  );
}
