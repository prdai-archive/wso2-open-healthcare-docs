const fs = require('fs');
const path = require('path');
const { processMarkdownFile } = require('./mdxProcessor');

module.exports = function pluginMarkdownExport(context, options = {}) {
  const { siteDir } = context;
  let docSources = null;

  // Recursively find all .md and .mdx files
  function findMarkdownFiles(dir, baseDir = dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip excluded content directories
        if (entry.name === 'old-content') continue;
        files.push(...findMarkdownFiles(fullPath, baseDir));
      } else if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
        // Skip hidden files and category files
        if (entry.name.startsWith('.') || entry.name.startsWith('_') || entry.name === 'category.json') continue;

        const relativePath = path.relative(baseDir, fullPath);
        // Convert to slug (remove extension, use forward slashes)
        const slug = relativePath.replace(/\.(md|mdx)$/, '').split(path.sep).join('/');
        files.push({ fullPath, slug });
      }
    }
    return files;
  }

  function routeToOutputSegments(routePath) {
    const relativePath = routePath.startsWith(context.baseUrl)
      ? routePath.slice(context.baseUrl.length)
      : routePath.replace(/^\//, '');
    return relativePath.split('/').filter(Boolean);
  }

  async function exportDocs(docsDir, outputDir) {
    if (!fs.existsSync(docsDir)) {
      console.warn(`[markdown-export] docs directory not found: ${docsDir}`);
      return 0;
    }

    const files = findMarkdownFiles(docsDir);
    console.log(`[markdown-export] Processing ${files.length} docs from ${docsDir}`);

    let totalExported = 0;
    for (const { fullPath, slug } of files) {
      const outputPath = path.join(outputDir, slug + '.md');

      try {
        const sourceContent = fs.readFileSync(fullPath, 'utf-8');
        const cleanMarkdown = await processMarkdownFile(
          sourceContent,
          {}, // No constants for now
          path.dirname(fullPath)
        );

        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, cleanMarkdown);
        totalExported++;
      } catch (error) {
        console.error(`[markdown-export] Error processing ${fullPath}:`, error.message);
      }
    }

    return totalExported;
  }

  async function exportAllDocs(outputBaseDir) {
    if (!docSources) {
      console.warn('[markdown-export] docs versions are not loaded');
      return 0;
    }

    let totalExported = 0;
    for (const { docsDir, routePath } of docSources) {
      const outputDir = path.join(outputBaseDir, ...routeToOutputSegments(routePath));
      totalExported += await exportDocs(docsDir, outputDir);
    }

    return totalExported;
  }

  return {
    name: 'docusaurus-plugin-markdown-export',

    async contentLoaded({ allContent }) {
      const loadedVersions =
        allContent['docusaurus-plugin-content-docs']?.default?.loadedVersions ?? [];

      docSources = loadedVersions.map((version) => ({
        docsDir: version.contentPath,
        routePath: version.path,
      }));

      if (process.env.NODE_ENV !== 'development' || docSources.length === 0) {
        return;
      }

      console.log('[markdown-export] Generating markdown files for development...');
      const totalExported = await exportAllDocs(path.join(siteDir, 'static'));
      console.log(`[markdown-export] Exported ${totalExported} markdown files`);
    },

    // Generate during build
    async postBuild({ outDir }) {
      console.log('[markdown-export] Generating markdown files for build...');
      const totalExported = await exportAllDocs(outDir);
      console.log(`[markdown-export] Exported ${totalExported} markdown files`);
    },
  };
};
