// @ts-check
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const lum1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const lum2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)];
}

async function runAudit() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:3000/en/');
  await page.waitForLoadState('networkidle');

  // Activate Light Mode
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('portfolio-theme', 'light');
  });
  await page.waitForTimeout(600);

  // Run DOM extraction in browser context
  const auditResults = await page.evaluate(() => {
    const findings = [];

    // Helper to get effective background
    function getEffectiveBg(el) {
      let cur = el;
      while (cur && cur !== document.documentElement) {
        const bg = window.getComputedStyle(cur).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          return { bg, el: cur.tagName + (cur.className ? '.' + cur.className.split(' ').slice(0, 2).join('.') : '') };
        }
        cur = cur.parentElement;
      }
      return { bg: 'rgb(246, 241, 235)', el: 'page-fallback' };
    }

    // Inspect all text elements in #public-root
    const textNodes = document.querySelectorAll(
      '#public-root h1, #public-root h2, #public-root h3, #public-root h4, #public-root h5, #public-root h6, #public-root p, #public-root span, #public-root a, #public-root button, #public-root label, #public-root input, #public-root textarea, #public-root select'
    );

    textNodes.forEach((node) => {
      const text = (node.textContent || '').trim();
      if (!text || text.length < 2) return;
      // Skip hidden
      const style = window.getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) return;

      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const color = style.color;
      const effectiveBg = getEffectiveBg(node);
      const fontSize = parseFloat(style.fontSize);
      const isBold = parseInt(style.fontWeight, 10) >= 600;

      // Find closest section
      const section = node.closest('section, header, footer, main, [role="dialog"]') || node.parentElement;
      const sectionId = section?.id || section?.tagName?.toLowerCase() || 'general';

      findings.push({
        section: sectionId,
        tag: node.tagName.toLowerCase(),
        classes: node.className ? String(node.className).slice(0, 80) : '',
        text: text.slice(0, 45),
        color,
        bg: effectiveBg.bg,
        bgFrom: effectiveBg.el,
        fontSize,
        isBold,
      });
    });

    // Inspect all SVG fills and paths in #public-root
    const svgPaths = document.querySelectorAll('#public-root svg path');
    const svgIssues = [];
    svgPaths.forEach((p) => {
      const fill = p.getAttribute('fill') || window.getComputedStyle(p).fill;
      if (fill === '#09070c' || fill === 'rgb(9, 7, 12)') {
        svgIssues.push({
          type: 'svg-dark-fill',
          fill,
          parent: p.parentElement?.className || '',
        });
      }
    });

    return { findings, svgIssues };
  });

  // Calculate contrast and flag issues
  const defects = [];
  auditResults.findings.forEach((item) => {
    const textColor = parseRgb(item.color);
    const bgColor = parseRgb(item.bg);
    const contrast = getContrastRatio(textColor, bgColor);
    const isLargeText = item.fontSize >= 24 || (item.fontSize >= 18.5 && item.isBold);
    const minContrast = isLargeText ? 3.0 : 4.5;

    // Check defect conditions:
    // 1. Text is white or near-white on light bg (contrast < minContrast)
    // 2. Text has low contrast (< minContrast)
    // 3. Gray/faded text that falls below 4.5:1
    if (contrast < minContrast) {
      defects.push({
        section: item.section,
        element: `<${item.tag}> "${item.text}"`,
        classes: item.classes,
        textColor: item.color,
        bgColor: item.bg,
        bgSource: item.bgFrom,
        contrast: contrast.toFixed(2),
        required: minContrast,
        isLargeText,
        fontSize: item.fontSize,
      });
    }
  });

  console.log(`Total text elements inspected: ${auditResults.findings.length}`);
  console.log(`Low-contrast / illegible text defects found: ${defects.length}`);
  console.log(`SVG dark fill issues: ${auditResults.svgIssues.length}`);

  fs.writeFileSync(
    path.join(__dirname, 'audit-results.json'),
    JSON.stringify({ total: auditResults.findings.length, defectCount: defects.length, defects, svgIssues: auditResults.svgIssues }, null, 2)
  );

  await browser.close();
}

runAudit().catch(console.error);
