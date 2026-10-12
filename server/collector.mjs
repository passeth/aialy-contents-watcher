import { createInstagramClient, ProviderError } from "./instagram.mjs";
export function createCollector(
  store,
  credentials,
  { clientFactory = createInstagramClient } = {},
) {
  const running = new Set();
  let timer;
  return {
    running,
    async run(id) {
      if (running.has(id))
        throw new ProviderError("이 계정은 이미 수집 중입니다.", false, 409);
      const source = store.sources().find((s) => s.id === id);
      if (!source)
        throw new ProviderError("수집 계정을 찾을 수 없습니다.", false, 404);
      const config = credentials.read();
      if (!config)
        throw new ProviderError("Instagram을 먼저 연결해 주세요.", false, 400);
      running.add(id);
      const run = store.beginRun(id);
      try {
        const result = await clientFactory(config).collect(source.username);
        store.finishRun(source, run, result);
        return { run, count: result.items.length };
      } catch (e) {
        const message =
          e instanceof ProviderError
            ? e.message
            : "응답을 저장하지 못했습니다. 기존 데이터는 유지됩니다.";
        store.failRun(source, run, message);
        throw new ProviderError(message, false, e.status || 502);
      } finally {
        running.delete(id);
      }
    },
    start() {
      // Only sources explicitly enabled by the user are scheduled. One at a time.
      timer = setInterval(async () => {
        if (running.size || !credentials.read()) return;
        const source = store
          .sources()
          .find(
            (s) =>
              s.enabled && (!s.nextRun || Date.parse(s.nextRun) <= Date.now()),
          );
        if (source) await this.run(source.id).catch(() => {});
      }, 60000);
      timer.unref();
    },
    stop() {
      clearInterval(timer);
    },
  };
}
