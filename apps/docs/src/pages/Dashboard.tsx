import { useEffect } from 'react';
import Hero from '../components/Hero';
import Configurator from '../components/Configurator';
import InstallGuide from '../components/InstallGuide';

export default function Dashboard() {
  useEffect(() => {
    document.title = 'asmallcinema — Stremio Addon Setup Guide';
  }, []);

  return (
    <>
      <Hero />
      <Configurator />
      <InstallGuide />
    </>
  );
}
