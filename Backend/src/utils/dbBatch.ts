/**
 * Run async DB tasks in small batches so Prisma/Neon connection pools
 * are not exhausted by large Promise.all fan-outs.
 */
export async function runInBatches(
  tasks: Array<() => Promise<unknown>>,
  batchSize = 4
): Promise<unknown[]> {
  const results: unknown[] = [];
  for (let i = 0; i < tasks.length; i += batchSize) {
    const slice = tasks.slice(i, i + batchSize);
    const batch = await Promise.all(slice.map((fn) => fn()));
    results.push(...batch);
  }
  return results;
}
