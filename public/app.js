// ── DOM refs ──────────────────────────────────────────────────────
const form = document.getElementById('run-form');
const submitBtn = document.getElementById('submit-btn');
const resultsSection = document.getElementById('results-section');
const emptyState = document.getElementById('empty-state');
const statusBar = document.getElementById('status-bar');
const statusMessage = document.getElementById('status-message');
const progressBar = document.getElementById('progress-bar');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

// ── Status helpers ────────────────────────────────────────────────
const setStatus = (state, message) => {
  statusBar.classList.remove('hidden');
  progressBar.classList.add('hidden');
  statusMessage.textContent = message;
  statusDot.className = 'w-2 h-2 rounded-full';
  statusText.textContent = state;

  switch (state) {
    case 'Running':
      statusDot.classList.add('bg-primary-container', 'animate-pulse');
      progressBar.classList.remove('hidden');
      break;
    case 'Complete':
      statusDot.classList.add('bg-green-500');
      break;
    case 'Error':
      statusDot.classList.add('bg-error');
      break;
    default:
      statusDot.classList.add('bg-outline-variant');
  }
};

// ── Star rating ───────────────────────────────────────────────────
const renderStars = (rating) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    Array(full).fill('<span class="material-symbols-outlined text-primary" style="font-variation-settings: \'FILL\' 1;">star</span>').join('') +
    (half ? '<span class="material-symbols-outlined text-primary">star_half</span>' : '') +
    Array(empty).fill('<span class="material-symbols-outlined text-primary">star_outline</span>').join('')
  );
};

// ── Generate pitch text ───────────────────────────────────────────
const generatePitch = (business, typeLabel) => {
  const name = business.name || 'there';
  const address = business.address || 'your area';
  const phone = business.phone || '';
  const label = (typeLabel || 'business').toLowerCase();

  const lines = [
    `Hi ${name},`,
    ``,
    `I came across ${name} on Google Maps and noticed your ${label} at ${address} doesn't have a website yet.`,
    ``,
    `I used Rake AI to generate a modern, responsive website for ${name} — it's already built and ready to go. It includes your location, hours, services, and a contact section, all styled professionally for ${label}s.`,
    ``,
    `I'd love to send it over for you to review. No cost, no strings — just thought it might be useful since every great ${label} deserves a strong online presence.`,
  ];

  if (phone) {
    lines.push(``);
    lines.push(`If you're interested, reply here or give me a call. I'd be happy to walk you through it.`);
  }

  lines.push(``);
  lines.push(`Best,`);
  lines.push(`[Your Name]`);

  return lines.join('\n');
};

// ── Pitch modal ───────────────────────────────────────────────────
const pitchOverlay = document.getElementById('pitch-overlay');
const pitchCard = document.getElementById('pitch-card');
const pitchBusinessName = document.getElementById('pitch-business-name');
const pitchText = document.getElementById('pitch-text');
const pitchClose = document.getElementById('pitch-close');
const pitchCopy = document.getElementById('pitch-copy');

let currentPitchBusiness = null;

const openPitch = (business) => {
  pitchBusinessName.textContent = business.name || 'Business';
  pitchText.textContent = generatePitch(business, business.typeLabel);
  pitchOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

const closePitch = () => {
  pitchOverlay.classList.add('hidden');
  document.body.style.overflow = '';
};

pitchClose.addEventListener('click', closePitch);
pitchOverlay.addEventListener('click', (e) => {
  if (e.target === pitchOverlay) closePitch();
});

pitchCopy.addEventListener('click', async () => {
  const showCopied = () => {
    const originalHTML = pitchCopy.innerHTML;
    pitchCopy.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">check</span> Copied!';
    pitchCopy.classList.add('bg-primary-container', 'text-on-primary-fixed');
    setTimeout(() => {
      pitchCopy.innerHTML = originalHTML;
      pitchCopy.classList.remove('bg-primary-container', 'text-on-primary-fixed');
    }, 2000);
  };

  try {
    await navigator.clipboard.writeText(pitchText.textContent);
    showCopied();
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = pitchText.textContent;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showCopied();
    } catch {
      console.error('Copy to clipboard failed');
    }
  }
});

// ── Escape HTML ───────────────────────────────────────────────────
const escapeHtml = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
};

// ── Deterministic hash for pseudo-ratings ─────────────────────────
const hash = (s) => [...(s || '')].reduce((a, c) => a + c.charCodeAt(0), 0);

// ── Render one business card ──────────────────────────────────────
const renderBusinessCard = (business) => {
  // Deterministic pseudo-rating from placeId
  const seed = hash(business.placeId || business.name);
  const rating = (3 + (seed % 20) / 10).toFixed(1);

  // Type badge from first type
  const typeLabel = business.types?.[0]
    ? business.types[0].replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Business';

  const addressLine = business.address || 'Address not available';

  // Build the "View Website" action — shows output path + download + pitch buttons
  let viewLink = '';
  if (business.outputFolder) {
    const folderName = business.outputFolder.split(/[/\\]/).pop();
    const safeFolder = escapeHtml(business.outputFolder);
    const pitchData = escapeHtml(JSON.stringify({ name: business.name, address: business.address, phone: business.phone || '', typeLabel }));
    viewLink = `<div class="flex flex-col gap-2">
        <span class="font-mono-code text-label-sm text-primary truncate" title="${safeFolder}">${escapeHtml(folderName)}</span>
        <div class="flex gap-2 flex-wrap">
          <button class="download-btn flex items-center justify-center gap-2 border border-primary-container text-primary font-label-sm text-label-sm py-2 px-3 uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-fixed transition-colors active:scale-95 flex-1" data-folder="${safeFolder}" type="button">
            <span class="material-symbols-outlined" style="font-size: 16px;">download</span>
            Download
          </button>
          <button class="pitch-btn flex items-center justify-center gap-2 border border-primary-container text-primary font-label-sm text-label-sm py-2 px-3 uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-fixed transition-colors active:scale-95 flex-1" data-pitch="${pitchData}" type="button">
            <span class="material-symbols-outlined" style="font-size: 16px;">campaign</span>
            Pitch
          </button>
          <button class="preview-btn flex items-center justify-center gap-2 border border-primary-container text-primary font-label-sm text-label-sm py-2 px-3 uppercase tracking-widest hover:bg-primary-container hover:text-on-primary-fixed transition-colors active:scale-95 flex-1" data-folder="${safeFolder}" data-name="${escapeHtml(business.name)}" type="button">
            <span class="material-symbols-outlined" style="font-size: 16px;">visibility</span>
            Preview
          </button>
        </div>
      </div>`;
  } else {
    viewLink = `<span class="flex-1 border border-outline-variant text-on-surface-variant font-label-sm text-label-sm py-3 uppercase tracking-tighter text-center opacity-50 cursor-not-allowed">
          Pending
        </span>`;
  }

  return `
    <div class="border border-outline-variant p-6 hover:border-primary-container transition-all group relative bg-surface-container-low">
      <div class="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-100 transition-opacity">
        <span class="material-symbols-outlined text-primary">sensors</span>
      </div>

      <h3 class="font-headline-lg text-headline-lg-mobile text-primary mb-1 uppercase tracking-tight truncate" title="${escapeHtml(business.name)}">
        ${escapeHtml(business.name)}
      </h3>

      <span class="inline-block font-label-sm text-label-sm text-on-surface-variant border border-outline-variant px-2 py-0.5 mb-3 uppercase">
        ${escapeHtml(typeLabel)}
      </span>

      <div class="flex items-center gap-2 mb-4">
        <div class="flex text-primary">${renderStars(parseFloat(rating))}</div>
        <span class="font-mono-code text-label-sm text-on-surface-variant">${rating}</span>
      </div>

      <div class="space-y-3 mb-6">
        <div class="flex justify-between border-b border-outline-variant pb-2">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Location</span>
          <span class="font-mono-code text-label-sm text-primary truncate max-w-[180px]" title="${escapeHtml(addressLine)}">${escapeHtml(addressLine)}</span>
        </div>
        ${business.phone ? `
        <div class="flex justify-between border-b border-outline-variant pb-2">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase">Phone</span>
          <span class="font-mono-code text-label-sm text-primary">${escapeHtml(business.phone)}</span>
        </div>` : ''}

      </div>

      <div>
        ${viewLink}
      </div>
    </div>`;
};

// ── Render all results ────────────────────────────────────────────
const renderResults = (data) => {
  const { businesses = [], totalFound, totalGenerated, outputDir } = data;

  if (businesses.length === 0) {
    resultsSection.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.querySelector('h2').textContent = 'No businesses found';
    emptyState.querySelector('p').textContent =
      'Try a different location, broader keyword, or larger radius. Only businesses without existing websites are shown.';
    return;
  }

  emptyState.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  resultsSection.innerHTML = businesses.map(renderBusinessCard).join('');

  setStatus('Complete',
    `${totalGenerated || businesses.length} websites generated · ${totalFound || businesses.length} businesses found · Output: ${outputDir || 'output/'}`);
};

// ── Form submission ───────────────────────────────────────────────
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  // Coerce numbers
  payload.maxResults = Number(payload.maxResults) || 20;
  payload.rangeMiles = Number(payload.rangeMiles) || 5;

  // Remove empty outputDir so backend uses default
  if (!payload.outputDir?.trim()) delete payload.outputDir;

  // UI: loading state
  submitBtn.textContent = 'Searching...';
  submitBtn.classList.add('animate-pulse');
  submitBtn.disabled = true;
  setStatus('Running', `Scanning for "${payload.keyword || 'all'}" near ${payload.location}...`);

  try {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.errors?.join(', ') || `HTTP ${response.status}`);
    }

    renderResults(data);
  } catch (error) {
    setStatus('Error', error.message || 'Request failed');
    resultsSection.classList.add('hidden');
    emptyState.classList.remove('hidden');
    emptyState.querySelector('h2').textContent = 'Request failed';
    emptyState.querySelector('p').textContent = error.message || 'An unknown error occurred. Check the console for details.';
    console.error('Run request failed:', error);
  } finally {
    submitBtn.textContent = 'Start Search';
    submitBtn.classList.remove('animate-pulse');
    submitBtn.disabled = false;
  }
});

// ── Input focus effects ───────────────────────────────────────────
const inputs = document.querySelectorAll('input');
inputs.forEach((input) => {
  input.addEventListener('focus', () => {
    input.parentElement?.classList.add('digital-chrome-border-active');
  });
  input.addEventListener('blur', () => {
    input.parentElement?.classList.remove('digital-chrome-border-active');
  });
});

// ── Preview modal ─────────────────────────────────────────────────
const previewOverlay = document.getElementById('preview-overlay');
const previewBusinessName = document.getElementById('preview-business-name');
const previewIframe = document.getElementById('preview-iframe');
const previewLoading = document.getElementById('preview-loading');
const previewClose = document.getElementById('preview-close');

const openPreview = async (folder, businessName) => {
  previewBusinessName.textContent = businessName || 'Business';
  previewOverlay.classList.remove('hidden');
  previewIframe.classList.add('hidden');
  previewLoading.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  try {
    const response = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputFolder: folder }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    const { html, css } = await response.json();

    // Inject CSS into the HTML head so the preview renders properly
    let combined = html;
    if (css) {
      const styleTag = `<style>${css}</style>`;
      if (combined.includes('</head>')) {
        combined = combined.replace('</head>', `${styleTag}</head>`);
      } else if (combined.includes('<body')) {
        combined = combined.replace('<body', `${styleTag}<body`);
      } else {
        combined = styleTag + combined;
      }
    }

    previewIframe.srcdoc = combined;
    previewLoading.classList.add('hidden');
    previewIframe.classList.remove('hidden');
  } catch (err) {
    console.error('Preview load failed:', err);
    previewLoading.innerHTML = `
      <div class="flex flex-col items-center gap-4">
        <span class="material-symbols-outlined text-error" style="font-size: 48px;">error</span>
        <span class="font-mono-code text-label-sm text-error uppercase tracking-widest">Failed to load preview</span>
      </div>`;
  }
};

const closePreview = () => {
  previewOverlay.classList.add('hidden');
  previewIframe.srcdoc = '';
  document.body.style.overflow = '';
  // Reset loading state for next open
  previewLoading.innerHTML = `
    <div class="flex flex-col items-center gap-4">
      <span class="material-symbols-outlined text-primary animate-pulse" style="font-size: 48px;">hourglass_top</span>
      <span class="font-mono-code text-label-sm text-on-surface-variant uppercase tracking-widest">Loading preview...</span>
    </div>`;
};

previewClose.addEventListener('click', closePreview);
previewOverlay.addEventListener('click', (e) => {
  if (e.target === previewOverlay) closePreview();
});
// Escape key already handled below with pitch; extend it for preview too
const escapeHandler = (e) => {
  if (e.key === 'Escape') {
    if (!previewOverlay.classList.contains('hidden')) {
      closePreview();
    } else if (!pitchOverlay.classList.contains('hidden')) {
      closePitch();
    }
  }
};
document.removeEventListener('keydown', escapeHandler);
document.addEventListener('keydown', escapeHandler);

// ── Download / Pitch / Preview handler (delegated from results section) ────
resultsSection.addEventListener('click', async (e) => {
  // ── Download button ──
  const downloadBtn = e.target.closest('.download-btn');
  if (downloadBtn) {
    const folder = downloadBtn.dataset.folder;
    if (!folder) return;

    const originalHTML = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">hourglass_top</span> Zipping...';
    downloadBtn.disabled = true;

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputFolder: folder }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      downloadBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 16px;">error</span> Failed';
      setTimeout(() => {
        downloadBtn.innerHTML = originalHTML;
        downloadBtn.disabled = false;
      }, 2000);
      return;
    }

    downloadBtn.innerHTML = originalHTML;
    downloadBtn.disabled = false;
    return;
  }

  // ── Pitch button ──
  const pitchBtn = e.target.closest('.pitch-btn');
  if (pitchBtn) {
    try {
      const business = JSON.parse(pitchBtn.dataset.pitch);
      openPitch(business);
    } catch (err) {
      console.error('Failed to parse pitch data:', err);
    }
    return;
  }

  // ── Preview button ──
  const previewBtn = e.target.closest('.preview-btn');
  if (previewBtn) {
    const folder = previewBtn.dataset.folder;
    const businessName = previewBtn.dataset.name || 'Business';
    if (folder) openPreview(folder, businessName);
    return;
  }
});

// ── Copyright year auto-update ────────────────────────────────────
const footerYear = document.getElementById('footer-copyright');
if (footerYear) {
  footerYear.textContent = footerYear.textContent.replace(/\d{4}/, new Date().getFullYear());
}

// ── Keyboard shortcut: Ctrl+Enter to submit ───────────────────────
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    form.dispatchEvent(new Event('submit', { cancelable: true }));
  }
});

console.log('Rake AI Precision Engine — ready.');