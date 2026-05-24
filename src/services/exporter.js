const fs = require('fs-extra');
const path = require('path');
const slugify = require('slugify');
const { generateAllImages } = require('./image-generator');

const buildFolderName = (business) => {
  const base = slugify(business.name || 'business', { lower: true, strict: true });
  const suffix = business.placeId
    ? business.placeId.slice(-6).toLowerCase()
    : Date.now().toString(36);
  return `${base}-${suffix}`;
};

const exportWebsite = async (outputRoot, business, website) => {
  await fs.ensureDir(outputRoot);

  const folderName = buildFolderName(business);
  const businessDir = path.join(outputRoot, folderName);
  await fs.ensureDir(businessDir);

  // Safety net: replace stale copyright years with the current year
  const currentYear = new Date().getFullYear();
  const sanitizedHtml = website.html
    .replace(/©\s*2024/g, `© ${currentYear}`)
    .replace(/Copyright\s+2024/gi, `Copyright ${currentYear}`)
    .replace(/&copy;\s*2024/gi, `&copy; ${currentYear}`);

  await fs.writeFile(path.join(businessDir, 'index.html'), sanitizedHtml, 'utf8');
  await fs.writeFile(path.join(businessDir, 'styles.css'), website.css, 'utf8');
  await fs.writeJson(path.join(businessDir, 'business.json'), business, {
    spaces: 2,
  });

  // Generate programmatic images (hero, dividers, patterns) using Sharp
  await generateAllImages(business, businessDir);

  return businessDir;
};

module.exports = {
  exportWebsite,
};
