'use client';

import Link from 'next/link';
import { MessageSquare, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Authentication Error
        </h1>
        
        <p className="text-slate-600 mb-8">
          The authentication link is invalid or has expired. 
          Please try signing in again.
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="btn-primary w-full justify-center inline-flex"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
          
          <Link
            href="/signup"
            className="block text-sm text-slate-500 hover:text-slate-700"
          >
            Don't have an account? Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

