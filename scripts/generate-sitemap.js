/**
 * Generates client/public/sitemap.xml from the database.
 *
 * Usage: npm run sitemap   (reads server/.env when present; needs MONGO_URI and CLIENT_URL)
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const envFile = path.join(root, 'server', '.env');
if (existsSync(envFile)) process.loadEnvFile(envFile);

// Imported after the env file is loaded: server config validates env at import time.
const { connectDatabase, disconnectDatabase } = await import('../server/src/config/db.js');
const { buildSitemapXml } = await import('../server/src/services/seo.service.js');

const outDir = path.join(root, 'client', 'public');
const outFile = path.join(outDir, 'sitemap.xml');

try {
  await connectDatabase();
  const xml = await buildSitemapXml();
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, xml, 'utf8');
  const count = (xml.match(/<url>/g) ?? []).length;
  console.log(`Sitemap written to ${path.relative(root, outFile)} (${count} URLs)`);
} catch (err) {
  console.error('Failed to generate sitemap:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase().catch(() => {});
}
