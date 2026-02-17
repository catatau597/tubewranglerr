"use client";
import React from 'react';
import CookiesUpload from './CookiesUpload';
import UserAgentSection from './UserAgentSection';

export default function ApiSettingsClientBlocks() {
  return (
    <>
      <CookiesUpload />
      <UserAgentSection />
    </>
  );
}
