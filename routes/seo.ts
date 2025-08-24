import { Router } from 'express';
import File from '../models/File';

const router = Router();

// robots.txt
router.get('/robots.txt', (req, res) => {
  const base = (res.locals.siteUrl as string) || `${req.protocol}://${req.get('host')}`;
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
});

// Common typo: robot.txt -> redirect to robots.txt
router.get('/robot.txt', (req, res) => {
  res.redirect(301, '/robots.txt');
});

// sitemap.xml (basic: home, files list, recent public file details/slug)
router.get('/sitemap.xml', async (req, res) => {
  const base = (res.locals.siteUrl as string) || `${req.protocol}://${req.get('host')}`;
  const urls: string[] = [
    `${base}/`,
    `${base}/files`
  ];
  // Add some recent public file detail pages
  const recent = await File.find({ access: 'public' }).sort({ createdAt: -1 }).limit(50).lean();
  for (const f of recent) {
    if (f.slug) urls.push(`${base}/files/slug/${f.slug}/details`);
    else urls.push(`${base}/files/${f._id}`);
  }
  const lastmod = new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urls.map(u => `<url><loc>${u}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`).join('') +
    `</urlset>`;
  res.type('application/xml');
  res.send(xml);
});

// Convenience alias: /sitemap -> /sitemap.xml
router.get('/sitemap', (req, res) => {
  res.redirect(301, '/sitemap.xml');
});

export default router;
