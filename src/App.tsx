import React from 'react';
import { Layout } from './components/Layout';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { PlayerProvider } from './context/PlayerContext';

const MusicApp: React.FC = () => {
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
        <PlayerProvider>
          <MusicApp />
        </PlayerProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
