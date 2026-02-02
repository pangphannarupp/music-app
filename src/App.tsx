import React from 'react';
import { Layout } from './components/Layout';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { PlayerProvider } from './context/PlayerContext';
import { SetupProvider, useSetup } from './context/SetupContext';

import { RecommendationScreen } from './components/RecommendationScreen';

const MusicApp: React.FC = () => {
  const { setupCompleted, setSetupCompleted } = useSetup();

  if (!setupCompleted) {
    return <RecommendationScreen onComplete={() => setSetupCompleted(true)} />;
  }

  return (
    <Layout>
      {/* FullScreenPlayer is global overlay */}
      <FullScreenPlayer />
      {/* View content is handled by Layout now */}
    </Layout>
  );
};

import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// ...

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SetupProvider>
          <PlayerProvider>
            <MusicApp />
          </PlayerProvider>
        </SetupProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
