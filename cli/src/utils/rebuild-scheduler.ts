/** Coalesce file-event bursts and serialize rebuilds, including edits during a build. */
export function createRebuildScheduler(
  rebuild: () => Promise<void>,
  onError: (error: unknown) => void,
  delayMs = 100,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> | undefined;
  let pending = false;
  let closed = false;

  async function run() {
    if (running || closed) return;
    running = (async () => {
      while (pending && !closed) {
        pending = false;
        await rebuild();
      }
    })();
    try {
      await running;
    } catch (error) {
      onError(error);
    } finally {
      running = undefined;
    }
  }

  return {
    schedule() {
      if (closed) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        pending = true;
        void run();
      }, delayMs);
    },
    async close() {
      closed = true;
      pending = false;
      clearTimeout(timer);
      await running?.catch(() => {});
    },
  };
}
