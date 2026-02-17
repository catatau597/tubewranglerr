"use client";
import React from 'react';
import CookiesUpload from './CookiesUpload';
import UserAgentSection from './UserAgentSection';

export default function SettingsClientBlocks() {
  return (
    <>
      <CookiesUpload />
      <UserAgentSection />
    </>
  );
}
