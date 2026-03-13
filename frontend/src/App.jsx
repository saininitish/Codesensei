import React, { useState } from 'react';
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
      );
    }

    if (authView === 'signup') {
      return <SignupView onSignupSuccess={handleSignupSuccess} onGoToLogin={() => setAuthView('login')} />;
    }

    // Default: login view
    return (
      <LoginView
        onLoginSuccess={handleLoginSuccess}
        onGoToSignup={() => setAuthView('signup')}
        prefillEmail={prefillEmail}
      />
    );
  }

  // --- Main App ---
  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 font-sans overflow-hidden">
      <Sidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      <main className="flex-1 overflow-y-auto">
        {currentView === 'dashboard' && <DashboardView setCurrentView={setCurrentView} setReviewResult={setReviewResult} />}
        {currentView === 'submit'    && <SubmitView    setCurrentView={setCurrentView} setReviewResult={setReviewResult} />}
        {currentView === 'result'    && <ResultView    result={reviewResult} />}
        {currentView === 'history'   && <HistoryView   setCurrentView={setCurrentView} setReviewResult={setReviewResult} />}
        {currentView === 'settings'  && <SettingsView  />}
      </main>
    </div>
  );
}
