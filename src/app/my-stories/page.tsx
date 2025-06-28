'use client';

import { Header, Main } from '@/components/common';

export default function StoryBuilder() {
  return (
    <div className='flex flex-col h-screen'>
      <Header>My Stories</Header>
      <Main>
        <h1>Shared Stories</h1>
        <div>TODO: list of publicly shared stories. Actions: Open in MVS Stories (external link), Delete</div>
        <h1>Sessions</h1>
        <div>TODO: list of sessions stored in S3 store. Actions: Open, Delete</div>
        <div>TODO: include sessions stored in local IndexedDB</div>
        <h1>Storage Statistics</h1>
        <div>TODO: show storage statistics for the user (used/available space)</div>
      </Main>
    </div>
  );
}
