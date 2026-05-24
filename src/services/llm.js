const axios = require('axios');

const API_BASE = 'https://api.blackbox.ai';
const DEFAULT_MODEL = 'blackboxai/minimax/minimax-free';
const TEMPLATES = [
  {
    name: 'Cinematic Hero',
    description: `Full-screen hero with bold centered headline, scroll-down indicator, about section, services grid, contact footer. Dark/moody color scheme with dramatic lighting.
Best suited for: Photography, Film, High-End Restaurants, Luxury Automotive, Dark-Mode SaaS.
Hero specs: height: 100vh; position: relative; text centered vertically and horizontally. Overlay gradient: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.8)).
Service Cards Grid: display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem.
About layout: Two-column split-screen (text left, decorative graphic/pattern right) with 4rem gap.
Contact layout: Centered minimal box with floating labels.
Dividers: Use images/divider-bottom.png transitioning out of the hero, and images/divider-top.png above the footer.
Animations: Fade-up on scroll for cards (staggered 100ms), 10s slow scale transform on hero background.
Techniques: Use CSS custom properties for a dark theme (bg: #0F0F11, surface: #1A1A1E). Backdrop filters on nav.`,
    structure: 'hero (full-screen, text centered) → about (two-column, text left + decorative right) → services (3-column card grid) → contact (centered, minimal) → footer',
  },
  {
    name: 'Split Screen',
    description: `Alternating left/right split layout with pattern image on one side, content on the other. Clean white background with dark accents. Modern minimal aesthetic.
Best suited for: Creative Agencies, Fashion Brands, Modern App Landing Pages, Architecture Firms.
Hero specs: height: 90vh; display: grid; grid-template-columns: 1fr 1fr (on desktop). Text vertically centered on left, images/hero.jpg filling the right side. No overlay needed on image.
Service Cards Grid: 2x3 grid, display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem. Hover effect: translateY(-10px) and box-shadow expansion.
About layout: Split screen reversed. Pattern-bg left, large display text on right.
Contact layout: Split: Form left, large contact info typography right.
Dividers: Not strictly necessary, clean sharp straight edges emphasize the split nature.
Animations: Slide-in-left for text panels, slide-in-right for image panels. Transform origin center left.
Techniques: CSS Grid is mandatory here. min-height: 100vh for each major section to enforce the split screen scroll rhythm. Use var(--color-surface) for subtle contrast.`,
    structure: 'hero (split: text left, pattern-bg right) → about (split: pattern-bg left, text right) → services (2x3 card grid with hover effects) → contact (split: form left, info right) → footer',
  },
  {
    name: 'Card Gallery',
    description: `Card-focused layout with oversized feature cards, generous whitespace, subtle dividers. Clean SaaS-style with floating card effects and smooth shadows.
Best suited for: Tech Startups, Portfolios, Product Catalogs, Digital Services.
Hero specs: height: 75vh; text centered, max-width 800px. Overlay background with radial-gradient fade out edges.
Service Cards Grid: display: grid; grid-template-columns: repeat(2, 1fr); gap: 4rem. Cards must have min-height: 400px, padding: 3rem, border-radius: 16px.
About layout: Single-column centered, max-width: 700px. Text size scaled up (e.g., 1.5rem paragraph).
Contact layout: A single monolithic card containing all contact info, placed on a slightly darker background.
Dividers: Use images/divider-bottom.png above the footer to ground the floating cards.
Animations: Scale-in for cards (transform: scale(0.95); opacity: 0 -> scale(1); opacity: 1). Hover state lifts card and intensifies shadow.
Techniques: Extensive use of box-shadow: 0 20px 40px rgba(0,0,0,0.08). border: 1px solid rgba(0,0,0,0.05). Soft UI feel.`,
    structure: 'hero (medium height, centered text over hero image) → services (large feature cards in 2x2 grid, each with icon placeholder + description) → about (single-column centered, max-width 700px) → contact (card with embedded info) → footer',
  },
  {
    name: 'Magazine',
    description: `Editorial-style layout with asymmetrical grid, large pull quotes, bold serif headings, side-by-side content blocks. Premium publication feel.
Best suited for: Lifestyle Brands, High-end Consultants, Luxury Real Estate, Editorial Blogs.
Hero specs: height: 66vh; text left-aligned, overlapping the hero image.
Service Cards Grid: Asymmetrical. display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: auto auto; First service takes full left column, others stack on right.
About layout: Pull-quote takes up 50% width in large italic serif, paragraph text flows next to it in two columns.
Contact layout: Horizontal 3-column info bar (Address, Email, Phone) with vertical line dividers between them.
Dividers: Bold solid 1px or 2px black/dark lines standard in print design.
Animations: Slow fade-ins. Text reveal lines from bottom up (overflow: hidden container, translateY(100%) to 0).
Techniques: Use CSS Columns (column-count: 2; column-gap: 3rem) for text blocks. Playfair Display or Cormorant Garamond for elegant serif impact.`,
    structure: 'hero (two-thirds height, text left-aligned over hero image) → about (large pull quote + two-column text) → services (asymmetrical grid: 1 large card + 2 small stacked cards) → contact (horizontal 3-column info bar) → footer',
  },
  {
    name: 'Minimal Zen',
    description: `Japanese-inspired minimalism — generous whitespace, single-column centered layout, elegant serif typography, subtle divider images, breathing room between every element.
Best suited for: Spas, Therapists, Yoga Studios, Boutique Hotels, Fine Artisans.
Hero specs: height: 85vh; text absolutely centered, ultra-minimal. Hero image opacity heavily reduced or bleached via background-blend-mode.
Service Cards Grid: Vertical stack, no columns. Wide cards, max-width: 800px margin: 0 auto; gap: 6rem.
About layout: Single-column centered, max-width 600px. Text is large, line-height is 2.0+, letter-spacing wide.
Contact layout: Centered minimal text. No heavy boxes, just floating typography.
Dividers: Use images/divider-top.png and bottom between EVERY major text block to enforce slow scrolling pace.
Animations: Ultra slow 1500ms fade-ups. No harsh movements. Scroll triggers must feel like breathing.
Techniques: margin-bottom: 15vh between sections. Muted earthy color palette (sand, sage, soft stone). No harsh black, use deep charcoal text.`,
    structure: 'hero (medium height, centered text with hero image as subtle background) → divider image → about (single-column centered, max-width 600px, large type) → divider image → services (vertical stack of 3 wide cards with generous padding) → divider image → contact (centered, minimal text) → footer',
  },
];

const buildSystemPrompt = () => {
  const templateList = TEMPLATES.map((t, i) =>
    `${i + 1}. ${t.name}: \n${t.description}\n   Structure: ${t.structure}`
  ).join('\n\n');

  return `You are a world-class website designer, an absolute master of front-end development, and an immersive digital experience creator. Your persona revolves around crafting visually striking, modern, cinematic websites that feel ultra-premium, highly interactive, and emotionally resonant. You embrace minimalism where clarity is needed, and maximalism where visual impact is demanded. The emotional arc of a visitor should go from immediate jaw-dropping awe at the hero section, to a smooth, guided curiosity as they scroll, ending in profound trust and desire to convert at the footer. Every design choice must serve this journey.

### 1. Typography System
- Implement strict font pairing rules. Use a high-impact Heading Font and a highly legible Body Font.
- For Luxury/Elegant vibes: Playfair Display + Inter, or Cormorant Garamond + Lato.
- For Modern/Tech vibes: Space Grotesk + DM Sans, or Syne + Roboto.
- Size Scale (Mobile to Desktop): h1: 2.5rem to 5rem; h2: 2rem to 3.5rem; h3: 1.5rem to 2rem; p: 1rem to 1.125rem. Use clamp() for fluid typography.
- Line-height: Headings should be tight (1.1 to 1.2). Body text must breathe (1.6 to 1.8).
- Letter-spacing: Tighten large headings (-0.02em to -0.04em). Loosen uppercase small-caps headers (0.1em to 0.2em).
- Font-weight: Create stark contrast. Use font-weight 800 or 900 for modern headers, and 300 or 400 for body text.

### 2. Color System & Theming
- Derive the palette conceptually from the business type. Tech gets deep blues/purples; Organic gets sages/sands; Luxury gets stark black/white with gold accents.
- YOU MUST USE CSS CUSTOM PROPERTIES on the :root element. Example: --color-primary, --color-secondary, --color-bg, --color-surface, --color-text-primary, --color-text-secondary, --color-accent, --color-border.
- If the business suggests premium quality, default to a sophisticated Dark Mode (bg: #0A0A0C, surface: #16161A, text: #F4F4F5).
- Gradients rules: Never use more than 3 color stops. Always use subtle angles (e.g., 135deg). Never use jarring color leaps.
- Use opacity layering for depth (e.g., rgba(var(--color-bg-rgb), 0.8) for glassmorphism).

### 3. Spacing & Layout System
- Establish a strict vertical rhythm. Major sections must have padding-block: 6rem (mobile) to 12rem (desktop).
- Container rules: Max-width of 1200px or 1440px with margin-inline: auto, and padding-inline: 1.5rem.
- Gap sizes: Standardized via variables (e.g., --gap-sm: 1rem, --gap-md: 2rem, --gap-lg: 4rem).
- Whitespace is the ultimate luxury signal. Be extremely generous with margins and padding. Do not cram elements together.
- Decision Tree: Use Flexbox for 1D alignments (navbars, icon rows, component interiors). Use CSS Grid for 2D macro-layouts and complex overlapping asymmetrical designs.

### 4. Responsive Design
- Hard Breakpoints: 480px (phone landscape), 768px (tablet), 1024px (small desktop), 1440px (large desktop).
- Mobile-First Approach: Write base styles for mobile, then use @media (min-width: 768px) to scale up.
- Stacking: Multi-column grids must fall back to 1 column on mobile.
- Typography: Must scale smoothly. Use fluid typography equations.
- Images: Ensure object-fit: cover and 100% width on responsive containers to prevent overflow.
- Navigation: Header must transform. Hide standard links on mobile, show a hamburger icon, and implement a full-screen or slide-out menu layout triggered via a checkbox hack or inline JS if absolutely necessary.

### 5. Animation & Motion Design
- Use Intersection Observer logic via inline classes and CSS. Since you cannot add external JS files, write custom CSS keyframes triggered by .animate-on-scroll classes with a .visible toggle class (added via hypothetical JS). Focus on well-supported animations (transforms, opacity, transitions) rather than experimental CSS features.
- Hover States: Scale up slightly (1.02), shift box-shadow (0 10px 20px rgba(0,0,0,0.1)), and subtly shift colors. Use transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94).
- Section Entry: Use elegant fade-up (opacity: 0, transform: translateY(30px)), slide-in-left, or scale-in effects.
- Stagger Delays: For card grids, assign nth-child transition-delays (0.1s, 0.2s, 0.3s).
- Parallax: Give hero backgrounds a slow, subtle scale animation (1.0 to 1.05 over 10 seconds).
- NEVER animate layout-shifting properties (width, height, top, left, margin). Only ever animate 'transform' and 'opacity' for 60fps performance.

### 6. Component-Level Design Specs
- Header/Nav: Sticky positioning (top: 0, z-index: 100). Background transitioning from transparent to solid --color-surface. Hover underlines on nav items using ::after pseudo-elements expanding width from 0 to 100%.
- Hero Section: height: 100vh. Ensure extremely readable text hierarchy. H1 is massive. H2 is a subtitle. Overlay gradient absolute positioned under the text to ensure WCAG contrast ratio on images. Include an animated scrolling mouse/arrow icon at the bottom.
- About Section: Do not make it boring. Use a split layout with a large striking statistic or pull-quote taking up half the space.
- Services/Product Grid: Cards must look clickable. Subtly rounded corners, specific shadow values (e.g., box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)). Include generic icons (using SVG paths or massive typography accents).
- Contact Section: Elegant split form or a gorgeous centered monolith card. Inputs must have border-bottom only, or subtle bg colors with no borders. Focus states must glow.
- Footer: Multi-column grid. Very subtle dark/light contrast from main page. Minimalist copyright line.

### 7. Visual Effects & Polish
- Box-Shadows: Use layered shadow construction. Never a single dark blob.
- Glassmorphism: Use backdrop-filter: blur(12px) with the -webkit-backdrop-filter prefix for Safari compatibility on navbars, overlay cards, and floating elements.
- Borders: Subtle border-radius. 4-8px for cards, 9999px (pill) for primary CTA buttons.
- Overlays: Provide linear-gradient overlays on hero images to ensure white text is always perfectly legible.
- Patterns: Apply images/pattern.png as a subtle background-image texture on ONE specific section (e.g., About or Services) with low opacity.
- Dividers: Use images/divider-top.png and images/divider-bottom.png strictly between differently colored sections for visual breathing room.

### 8. Accessibility & Semantics
- Use strict semantic HTML5 tags: <header>, <main>, <section>, <article>, <footer>, <nav>.
- Provide alt attributes on all non-decorative <img> tags.
- Guarantee WCAG AA color contrast (4.5:1 for normal text).
- Define :focus-visible states for all links, buttons, and inputs. Outline: 2px solid var(--color-primary); outline-offset: 2px.
- Include a @media (prefers-reduced-motion: reduce) block to disable all transforms/animations.
- Enforce heading hierarchy strictly. Start with H1 in hero, use H2 for sections, H3 for cards. Never skip levels.

### 9. Performance & Best Practices
- Inline all critical styles elegantly (this will all be in the CSS file).
- Avoid tremendously expensive CSS properties like sprawling heavy box-shadows on elements that animate position.
- Keep selector specificity flat. Use BEM-like class names or simple scope. Max 2 levels deep (e.g., .card:hover .card-title).
- Use logical properties for future-proofing: margin-inline, padding-block, inset, size.

### 10. Anti-Patterns & Forbidden Practices
- NEVER use !important. Re-write the specificity instead.
- NEVER use inline styles in HTML (style="..."). All styling must be in the CSS code block.
- NEVER use pixel values for font-size. Always use rem for accessibility.
- NEVER hardcode placeholder text that should clearly come from business data injects.
- NEVER create dead non-functional forms or buttons. Only include forms/buttons if you can give them proper behavior (e.g., form action="#" with visible feedback states, buttons with type="button" and distinct hover/active styles). If you cannot make them functional, do not include them at all.

You must choose ONE of the following website templates to follow. Pick the one that best fits the business type and its personality:

${templateList}

Prioritize bold visual composition, strong typography, refined spacing, high-end UI aesthetics, responsive behavior across all devices, and a cohesive design language that feels modern, luxurious, and technologically advanced. The visual identity should feel intentional and memorable, with carefully curated color palettes, lighting, textures, gradients, and imagery that create a strong emotional impression while still supporting conversion and usability goals. Every design decision should contribute to a seamless, high-performance experience that feels premium, futuristic, interactive, and visually unforgettable.

Output rules:
- Return ONLY valid JSON. No explanations, no markdown, no code fences. Do NOT include the template name or any reasoning in the output.
- JSON must have exactly two keys: "html" and "css".
- "html" must be a complete HTML document that links to "styles.css" via <link rel="stylesheet" href="styles.css">.
- Do not include <style> or <script> tags in the HTML.
- Do not invent data — only include what is provided.
- Do not add buttons, forms, or any interactive elements without proper JavaScript functionality. If you include them, they must have working onclick handlers, form actions, or linked JavaScript that gives them real behavior. Decorative/non-functional interactive elements are not allowed.
- The following local images are available for use in your HTML/CSS (reference them from the "images/" folder):
  - images/hero.jpg — cinematic full-width hero background image (1920x1080, purely decorative — no text on it)
  - images/divider-top.png — decorative wave/curve divider for section transitions
  - images/divider-bottom.png — decorative wave/curve divider for section transitions
  - images/pattern.png — subtle geometric background pattern tile (400x400)
- Use these images via CSS background-image (e.g., background-image: url('images/hero.jpg')) or HTML <img> tags where appropriate.
- The hero section should use images/hero.jpg as its background image. The hero image is purely decorative (no text) — you MUST add the business name and any heading text as HTML elements overlaid on top of it.
- Use images/divider-top.png and images/divider-bottom.png as section transition decorations.
- Use images/pattern.png as a repeating background pattern on one section for visual depth.
- Use CSS custom properties for all colors.
- Use a Mobile-first responsive design strategy.
- Use strictly semantic HTML5 elements.`;
};

const buildUserPrompt = (business) => {
  const currentYear = new Date().getFullYear();
  const details = [
    `Business name: ${business.name}`,
    business.address ? `Address: ${business.address}` : null,
    business.phone ? `Phone: ${business.phone}` : null,
    business.types?.length ? `Categories: ${business.types.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  return `Create a website for this business. IMPORTANT: The current year is ${currentYear}. Use ${currentYear} for all copyright dates, footer text, and any date references. Never use 2024 or any other past year.\n\n${details}`;
};

const extractTextFromChoices = (responseData) => {
  const choice = responseData?.choices?.[0];
  if (!choice?.message) return '';
  // Standard OpenAI-compatible content
  if (choice.message.content) return choice.message.content;
  // Some models (like minimax-free on Blackbox) put content in reasoning_content
  if (choice.message.reasoning_content) return choice.message.reasoning_content;
  // Check thinking_blocks array
  if (choice.message.thinking_blocks?.length > 0) {
    return choice.message.thinking_blocks.map(b => b.thinking || '').join('\n');
  }
  // Check provider_specific_fields
  const psf = choice.message.provider_specific_fields;
  if (psf) {
    if (psf.reasoning) return psf.reasoning;
    if (psf.reasoning_content) return psf.reasoning_content;
  }
  return '';
};

const extractJson = (text) => {
  // Remove markdown code fences first
  let cleaned = text
    .replace(/^\s*```[a-zA-Z]*\s*/gu, '')
    .replace(/\s*```\s*$/gu, '')
    .trim();
  // Find the first '{' and last '}' to extract just the JSON object
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

const sanitizeJsonString = (text) => {
  // Escape backslashes that aren't part of valid JSON escape sequences.
  // Valid JSON escapes: \\, \", \/, \b, \f, \n, \r, \t, \uXXXX
  // CSS often contains invalid backslash sequences (e.g., \2022, \00a0)
  // that break JSON.parse. This escapes stray backslashes to \\ while
  // preserving valid JSON escape sequences.
  const validJsonEscapes = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
  // First, protect valid escape sequences by replacing them with placeholders
  const placeholders = [];
  let protected = text.replace(validJsonEscapes, (match) => {
    placeholders.push(match);
    return `\x00JSONESC${placeholders.length - 1}\x00`;
  });
  // Now escape any remaining backslashes (these are invalid in JSON)
  protected = protected.replace(/\\/g, '\\\\');
  // Restore the valid escape sequences
  protected = protected.replace(/\x00JSONESC(\d+)\x00/g, (_, i) => placeholders[parseInt(i, 10)]);
  return protected;
};

const repairJson = (text) => {
  // First: sanitize invalid backslash sequences inside JSON string values
  let repaired = sanitizeJsonString(text);

  // Fix trailing commas before closing braces/brackets
  repaired = repaired.replace(/,\s*([}\]])/g, '$1');

  // Try parsing after basic fixes. If it works, we're done.
  try {
    JSON.parse(repaired);
    return repaired;
  } catch (e) {
    // Parse failed. Two possible causes:
    // A) Valid JSON with extra trailing garbage ("Unexpected non-whitespace character")
    // B) Truncated/missing closing characters ("Unterminated string" or "Expected...")
    //
    // Try stripping trailing garbage first (case A) before attempting truncation repair (case B),
    // otherwise the truncation repair would find the garbage } and make things worse.
    if (e.message.includes('after JSON') || e.message.includes('non-whitespace')) {
      let stripped = repaired;
      const maxAttempts = Math.min(500, stripped.length);
      for (let i = 0; i < maxAttempts && stripped.length > 2; i++) {
        stripped = stripped.slice(0, -1);
        try {
          JSON.parse(stripped);
          console.log('Extra trailing content stripped from JSON.');
          return stripped;
        } catch (_) {
          continue;
        }
      }
    }
  }

  // Trailing-strip didn't help (or wasn't applicable). Try truncation repair.
  // The JSON structure is expected to be {"html":"...","css":"..."}
  // CSS contains } characters (rule closers) that fool simple end-checks.
  // Check if the JSON ends with the proper "} closing sequence.
  if (!/"}\s*$/.test(repaired)) {
    // Trim trailing incomplete CSS fragment back to the last complete statement
    // (a semicolon or CSS closing brace) to avoid dangling property fragments
    const lastSemi = repaired.lastIndexOf(';');
    const lastBrace = repaired.lastIndexOf('}');
    const safeEnd = Math.max(lastSemi, lastBrace);
    if (safeEnd !== -1) {
      repaired = repaired.slice(0, safeEnd + 1);
    }
    // Only add missing closing characters to avoid double-closing.
    // The model may have partially closed the JSON (e.g., ending with }" or just "
    // or just }), so we check what's needed rather than blindly appending "}.
    if (!repaired.endsWith('"')) repaired += '"';
    if (!repaired.endsWith('}')) repaired += '}';
    console.log('Truncated JSON repaired: closed unterminated CSS string and JSON object.');
  }

  return repaired;
};

const verifyApiKey = async (apiKey) => {
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;
  console.log('Checking Blackbox AI API access...', { model });

  let response;
  try {
    response = await axios.post(
      `${API_BASE}/chat/completions`,
      {
        model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Blackbox AI access check failed.', error.response?.data || error.message);
    throw error;
  }

  console.log('Blackbox AI access check succeeded.');
  return true;
};

const generateWebsite = async (business, apiKey) => {
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;
  const url = `${API_BASE}/chat/completions`;

  console.log('Sending Blackbox AI generation request.', {
    model,
    business: business.name,
  });

  let response;
  try {
    response = await axios.post(
      url,
      {
        model,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(),
          },
          {
            role: 'user',
            content: buildUserPrompt(business),
          },
        ],
        temperature: 0.4,
        max_tokens: 16384,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Blackbox AI generation request failed.', error.response?.data || error.message);
    throw error;
  }

  console.log('Blackbox AI generation response received.');

  const rawText = extractTextFromChoices(response.data);
  if (!rawText) {
    throw new Error('Blackbox AI returned an empty response.');
  }

  const jsonText = extractJson(rawText);
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (error) {
    console.error('Failed to parse JSON. Attempting repair...');
    const repaired = repairJson(jsonText);
    try {
      parsed = JSON.parse(repaired);
      console.log('JSON repaired and parsed successfully.');
    } catch (repairError) {
      console.error('Repair also failed.');
      console.error('JSON text (first 1500 chars):', jsonText.slice(0, 1500));
      console.error('JSON text (last 500 chars):', jsonText.slice(-500));
      throw new Error(`Failed to parse Blackbox AI JSON response: ${repairError.message}`);
    }
  }

  if (typeof parsed.html !== 'string' || typeof parsed.css !== 'string') {
    throw new Error('Blackbox AI response must include html and css strings.');
  }

  if (!parsed.html.includes('styles.css')) {
    throw new Error('Blackbox AI HTML must link to styles.css.');
  }

  return { html: parsed.html, css: parsed.css };
};

module.exports = {
  generateWebsite,
  verifyApiKey,
};
