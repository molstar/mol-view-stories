import { assertEquals } from '@std/assert';
import { createRebuildScheduler } from '../src/utils/rebuild-scheduler.ts';

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const fail = (error: unknown) => { throw error; };

Deno.test('file-event bursts trigger one rebuild; closing cancels a pending rebuild', async () => {
  let calls = 0;
  const scheduler = createRebuildScheduler(async () => { calls++; }, fail, 10);
  try {
    for (let i = 0; i < 20; i++) scheduler.schedule();
    await pause(40);
    assertEquals(calls, 1);
    scheduler.schedule();
  } finally {
    await scheduler.close();
  }
  await pause(30);
  assertEquals(calls, 1);
});

Deno.test('edits during a rebuild produce one follow-up without concurrent builds', async () => {
  const firstStarted = Promise.withResolvers<void>();
  const secondStarted = Promise.withResolvers<void>();
  const releaseFirst = Promise.withResolvers<void>();
  let calls = 0, active = 0, maxActive = 0;
  const scheduler = createRebuildScheduler(async () => {
    calls++;
    active++;
    maxActive = Math.max(maxActive, active);
    if (calls === 1) {
      firstStarted.resolve();
      await releaseFirst.promise;
    } else {
      secondStarted.resolve();
    }
    active--;
  }, fail, 10);
  try {
    scheduler.schedule();
    await firstStarted.promise;
    for (let i = 0; i < 20; i++) scheduler.schedule();
    await pause(40);
    assertEquals(calls, 1);
    releaseFirst.resolve();
    await secondStarted.promise;
    assertEquals(calls, 2);
    assertEquals(maxActive, 1);
  } finally {
    releaseFirst.resolve();
    await scheduler.close();
  }
});
