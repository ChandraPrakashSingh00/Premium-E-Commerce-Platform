/**
 * Loads the demo store into the database configured by MONGO_URI.
 * WARNING: wipes every collection first.
 *
 * Usage: npm run seed            (refuses to run with NODE_ENV=production)
 *        npm run seed -- --force (override the production guard)
 */
const force = process.argv.includes('--force');
if (process.env.NODE_ENV === 'production' && !force) {
  console.error('Refusing to seed: NODE_ENV=production wipes live data. Re-run with --force if you really mean it.');
  process.exit(1);
}

const { connectDatabase, disconnectDatabase } = await import('../src/config/db.js');
const { runSeed } = await import('./seed-runner.js');

const started = Date.now();
try {
  await connectDatabase();
  const { counts, credentials } = await runSeed({ log: (msg) => console.log(`• ${msg}`) });
  console.log(`\nSeed completed in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.table(counts);
  console.log('Credentials');
  console.log(`  Admin:    ${credentials.admin.email} / ${credentials.admin.password}`);
  console.log(`  Customer: ${credentials.customer.email} / ${credentials.customer.password}`);
  console.log('  Coupons:  WELCOME10, FLAT500, FESTIVE20 (EXPIRED15 is expired)');
} catch (err) {
  console.error('Seed failed:', err);
  process.exitCode = 1;
} finally {
  await disconnectDatabase().catch(() => {});
}
