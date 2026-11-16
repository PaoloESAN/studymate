import React from 'react';
import VoiceWebMcpAssistant from '@/components/VoiceWebMcpAssistant';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <VoiceWebMcpAssistant />
    </>
  );
}
