const fs = require('fs');
const path = require('path');

const domain = 'https://mohammed-design.vercel.app';
const lastmod = new Date().toISOString().split('T')[0];

const slugs = [
  'noya-skincare',
  'luma-skin',
  'gd-branding',
  'luma-cafe',
  'solstice-magazine',
  'flora-app',
  'aurelia-horlogerie',
  'velvet-reverie',
  'zenith-social'
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Homepage Default -->
  <url>
    <loc>${domain}/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${domain}/en/" />
    <xhtml:link rel="alternate" hreflang="ar" href="${domain}/ar/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}/" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Homepage English -->
  <url>
    <loc>${domain}/en/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${domain}/en/" />
    <xhtml:link rel="alternate" hreflang="ar" href="${domain}/ar/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}/" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Homepage Arabic -->
  <url>
    <loc>${domain}/ar/</loc>
    <xhtml:link rel="alternate" hreflang="ar" href="${domain}/ar/" />
    <xhtml:link rel="alternate" hreflang="en" href="${domain}/en/" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}/" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

  <!-- Projects Gallery English -->
  <url>
    <loc>${domain}/en/projects</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${domain}/en/projects" />
    <xhtml:link rel="alternate" hreflang="ar" href="${domain}/ar/projects" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}/en/projects" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>

  <!-- Projects Gallery Arabic -->
  <url>
    <loc>${domain}/ar/projects</loc>
    <xhtml:link rel="alternate" hreflang="ar" href="${domain}/ar/projects" />
    <xhtml:link rel="alternate" hreflang="en" href="${domain}/en/projects" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}/en/projects" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;

for (const slug of slugs) {
  xml += `
  <!-- Project: ${slug} (EN & AR) -->
  <url>
    <loc>${domain}/en/projects/${slug}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${domain}/en/projects/${slug}" />
    <xhtml:link rel="alternate" hreflang="ar" href="${domain}/ar/projects/${slug}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}/en/projects/${slug}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${domain}/ar/projects/${slug}</loc>
    <xhtml:link rel="alternate" hreflang="ar" href="${domain}/ar/projects/${slug}" />
    <xhtml:link rel="alternate" hreflang="en" href="${domain}/en/projects/${slug}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${domain}/en/projects/${slug}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
}

xml += `\n</urlset>\n`;

const outPath = path.resolve(__dirname, '../frontend/public/sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf-8');
console.log('✅ Generated sitemap.xml at', outPath);
