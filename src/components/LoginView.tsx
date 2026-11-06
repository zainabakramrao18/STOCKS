import React, { useState } from 'react';
import { 
  Store, 
  CheckCircle2, 
  ShieldCheck, 
  FileSpreadsheet, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Boxes,
  Sparkles
} from 'lucide-react';

interface LoginViewProps {
  onSignIn: () => Promise<void>;
  isSigningIn: boolean;
  error?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSignIn,
  isSigningIn,
  error
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 flex flex-col justify-between">
      
      {/* Top Brand Bar */}
      <nav className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 ring-4 ring-emerald-50">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-slate-900">
              Stock<span className="text-emerald-600">Wise</span>
            </span>
            <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
              For Small Shop Owners
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Cloud Secured by Google Firebase</span>
        </div>
      </nav>

      {/* Main Hero & Sign-In Card */}
      <main className="max-w-5xl mx-auto px-4 py-8 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Column: Value Proposition for Shopkeepers */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-900 text-xs font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Built Specifically For Busy Corner Shops & Retailers</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Smart inventory, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-green-600">
              zero complicated tech.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
            Never run out of bestsellers or sell expired goods again. Track wholesale costs, customer selling prices, gross profit, and restock shipments all in one clean place.
          </p>

          {/* Key Features Bullet Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            
            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Low-Stock in Red</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instant visual alerts when items hit reorder levels.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">30-Day Expiry Radar</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Prevent spoilage before food or goods expire.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Quick 1-Tap Sales</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record sales at the counter and calculate profit instantly.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">CSV Import & Export</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bulk upload spreadsheets and export accounting backups.
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Google Sign-In Card */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl relative overflow-hidden space-y-6">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2 border border-emerald-200">
                <Store className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome to StockWise
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Sign in with your Google account to access your store's cloud database.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Official Google Sign-In Button */}
            <div className="space-y-3">
              <button
                onClick={onSignIn}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 border-2 border-slate-200 hover:border-slate-300 font-bold text-base shadow-sm active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
              >
                {/* Official Google G Logo SVG */}
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
              </button>

              <div className="flex items-center space-x-2 text-center justify-center text-[11px] text-slate-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Private store database linked directly to your UID</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-400">
                StockWise ensures your inventory, purchase prices, and customer transactions remain strictly confidential.
              </p>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-400 border-t border-slate-100">
        <p>StockWise • Designed for small business shop owners • White & Green Theme</p>
      </footer>

    </div>
  );
};
