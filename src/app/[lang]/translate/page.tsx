import React from 'react';
import TranslateClient from './TranslateClient';

export default function TranslatePage() {
  return (
    <div className="flex flex-col bg-background p-4 lg:p-8 pb-16 w-full">
      <h1 className="text-2xl font-bold text-primary mb-6">Dịch</h1>
      <TranslateClient />
    </div>
  );
}
