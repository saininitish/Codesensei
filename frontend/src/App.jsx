import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, authStorage } from './api.js';
import { MOCK_REVIEW_RESULT } from './data/mockData.js';

// Layout
import Sidebar from './components/Sidebar.jsx';

// Auth
import LoginView    from './components/auth/LoginView.jsx';
import SignupView   from './components/auth/SignupView.jsx';
import UserChooser  from './components/auth/UserChooser.jsx';

// Views
import DashboardView from './views/DashboardView.jsx';
import SubmitView    from './views/SubmitView.jsx';
import ResultView    from './views/ResultView.jsx';
import HistoryView   from './views/HistoryView.jsx';
import SettingsView  from './views/SettingsView.jsx';

const pageVariants = {
  initial: { opacity: 0, y: 15, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, y: -15, filter: 'blur(4px)', transition: { duration: 0.2, ease: 'easeIn' } }
};

const PageWrapper = ({ children, viewKey }) => (
  <motion.div
    key={viewKey}
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    className="min-h-full"
  >
    {children}
  </motion.div>
);

export default function App() {
  const [currentView, setCurrentView]   = useState('dashboard');
  const [reviewResult, setReviewResult] = useState(MOCK_REVIEW_RESULT);
  const [currentUser, setCurrentUser]   = useState(() => authStorage.getUser());

  // Auth view: 'chooser' | 'login' | 'signup'
  const [authView, setAuthView]         = useState('chooser');
  const [prefillEmail, setPrefillEmail]  = useState('');
  const [forceRender, setForceRender]   = useState(0); // to re-render when accounts change

  const handleLoginSuccess  = (user) => setCurrentUser(user);
  const handleSignupSuccess = (user) => { setCurrentUser(user); };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setAuthView('chooser');
    setCurrentView('dashboard');
    setPrefillEmail('');
  };

  // --- Auth Gate ---
  if (!currentUser) {
    const savedAccounts = authStorage.getSavedAccounts();

    // Show user chooser if there are saved accounts and we're on chooser view
    if (authView === 'chooser' && savedAccounts.length > 0) {
      return (
        <AnimatePresence mode="wait">
          <motion.div key="chooser" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
            <UserChooser
              key={forceRender}
              onSelectUser={(acc) => {
                if (!acc) { setForceRender(v => v + 1); return; } // re-render after remove
                setPrefillEmail(acc.email);
                setAuthView('login');
              }}
              onAddUser={() => setAuthView('signup')}
              onLoginDirect={() => { setPrefillEmail(''); setAuthView('login'); }}
            />
          </motion.div>
        </AnimatePresence>
      );
    }

    if (authView === 'signup') {
      return (
        <AnimatePresence mode="wait">
           <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full w-full">
             <SignupView onSignupSuccess={handleSignupSuccess} onGoToLogin={() => setAuthView('login')} />
           </motion.div>
        </AnimatePresence>
      );
    }

    // Default: login view
    return (
      <AnimatePresence mode="wait">
        <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full w-full">
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            onGoToSignup={() => setAuthView('signup')}
            prefillEmail={prefillEmail}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // --- Main App ---
  return (
    <div className="flex h-screen bg-dark-bg text-slate-50 font-sans overflow-hidden">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <main className="flex-1 overflow-y-auto relative scroll-smooth">
        <AnimatePresence mode="wait">
           {currentView === 'dashboard' && <PageWrapper viewKey="dashboard"><DashboardView setCurrentView={setCurrentView} setReviewResult={setReviewResult} /></PageWrapper>}
           {currentView === 'submit'    && <PageWrapper viewKey="submit"   ><SubmitView    setCurrentView={setCurrentView} setReviewResult={setReviewResult} /></PageWrapper>}
           {currentView === 'result'    && <PageWrapper viewKey="result"   ><ResultView    result={reviewResult} /></PageWrapper>}
           {currentView === 'history'   && <PageWrapper viewKey="history"  ><HistoryView   setCurrentView={setCurrentView} setReviewResult={setReviewResult} /></PageWrapper>}
           {currentView === 'settings'  && <PageWrapper viewKey="settings" ><SettingsView  /></PageWrapper>}
        </AnimatePresence>
      </main>
    </div>
  );
}
