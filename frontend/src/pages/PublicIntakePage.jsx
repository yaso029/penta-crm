import { useState } from 'react';
import IntroPage from '../components/intake/IntroPage';
import ClientIntakeTab from '../components/ClientIntakeTab';

export default function PublicIntakePage() {
  const [started, setStarted] = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      {!started && <IntroPage onStart={() => setStarted(true)} />}
      {started && <ClientIntakeTab />}
    </div>
  );
}
