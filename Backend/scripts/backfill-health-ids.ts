/**
 * Backfill permanent Patient/Health IDs for existing users.
 * Usage: npx tsx scripts/backfill-health-ids.ts
 */
import { backfillMissingHealthIds } from "../src/services/healthId.service";

async function main() {
  const n = await backfillMissingHealthIds();
  console.log(`Backfilled ${n} profiles with Patient/Health IDs`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
