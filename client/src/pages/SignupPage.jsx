import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';
import { Truck, Lock, Mail, User, Shield, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FLEET_MANAGER'
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(formData.name, formData.email, formData.password, formData.role);
      showToast({
        type: 'success',
        title: 'Registration Successful',
        message: `Welcome, ${formData.name}! Your workspace account has been created.`
      });
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Registration failed. Check your input.';
      showToast({
        type: 'error',
        title: 'Registration Failed',
        message: errMsg
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background-page p-4">
      <div className="max-w-md w-full bg-background-panel border border-border rounded-sm shadow-xl p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-primary text-white mb-3 shadow-sm">
            <Truck className="w-6 h-6 text-yellow-300" />
          </div>
          <h1 className="text-xl font-bold text-text-primary">Create TransitOps Account</h1>
          <p className="text-xs text-text-secondary mt-1">Join the Transport Operations ERP platform workspace.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                required
                placeholder="e.g. Vikram Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-sm text-xs focus:outline-none focus:border-primary text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="e.g. vikram@transitops.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-sm text-xs focus:outline-none focus:border-primary text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-sm text-xs focus:outline-none focus:border-primary text-text-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Assigned Workspace Role
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full pl-9 pr-3 py-2 border border-border rounded-sm text-xs focus:outline-none focus:border-primary bg-white text-text-primary"
              >
                <option value="FLEET_MANAGER">Fleet Manager (Full Admin access)</option>
                <option value="DRIVER">Driver (Assigned trips & vehicle updates)</option>
                <option value="SAFETY_OFFICER">Safety Officer (Compliance & shop logs)</option>
                <option value="FINANCIAL_ANALYST">Financial Analyst (Expenses & reports)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary-hover text-white text-xs font-medium py-2.5 rounded-sm shadow-sm transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Creating Workspace Account...' : 'Register Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-border text-center text-xs text-text-secondary">
          Already have a workspace account?{' '}
          <Link to="/auth/login" className="text-primary font-semibold hover:underline">
            Log In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
