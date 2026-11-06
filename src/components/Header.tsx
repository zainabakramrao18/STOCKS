import React from 'react';
import { User } from 'firebase/auth';
import { StoreSettings } from '../types/inventory';
import { 
  Store, 
  LogOut, 
  SlidersHorizontal, 
  Layers, 
  History,
  TrendingUp,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  user: User;
  settings: StoreSettings;
  onOpenSettings: () => void;
  onOpenTransactions: () => void;
  onSignOut: () => void;
  onSeedDemo: () => void;
  isSeeding: boolean;
  productCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  settings,
  onOpenSettings,
  onOpenTransactions,
  onSignOut,
  onSeedDemo,
  isSeeding,
  productCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Shop Brand */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 ring-4 ring-emerald-50">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Stock<span className="text-emerald-600">Wise</span>
                </span>
                <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  Shop Owner POS
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                {settings.shopName}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Seed Sample Data (shown if store has 0 items or for quick testing) */}
            {productCount === 0 && (
              <button
                onClick={onSeedDemo}
                disabled={isSeeding}
                className="hidden md:inline-flex items-center space-x-2 px-3.5 py-2 text-sm font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                title="Add 8 common shop items to test all features"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{isSeeding ? 'Loading items...' : 'Load Sample Items'}</span>
              </button>
            )}

            {/* Sales & Restock Ledger */}
            <button
              onClick={onOpenTransactions}
              className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2.5 text-sm font-semibold rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="View sales and restock log"
            >
              <History className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Activity Ledger</span>
            </button>

            {/* Shop Settings */}
            <button
              onClick={onOpenSettings}
              className="p-2.5 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 transition-colors"
              title="Store name & currency settings"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>

            {/* User Profile & Sign Out */}
            <div className="flex items-center pl-2 sm:pl-3 border-l border-slate-200 space-x-2 sm:space-x-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Owner'}
                  className="w-10 h-10 rounded-full border-2 border-emerald-500 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}

              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[130px]">
                  {user.displayName || 'Shop Owner'}
                </p>
                <p className="text-[11px] text-slate-400 truncate max-w-[130px]">
                  {user.email}
                </p>
              </div>

              <button
                onClick={onSignOut}
                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Sign out of StockWise"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
