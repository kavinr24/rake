---
name: Digital Chrome
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dbe7'
  primary: '#e1fdff'
  on-primary: '#00363a'
  primary-container: '#00f2ff'
  on-primary-container: '#006a71'
  inverse-primary: '#00696f'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#fff6e4'
  on-tertiary: '#3b2f00'
  tertiary-container: '#fed83a'
  on-tertiary-container: '#725e00'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#74f5ff'
  primary-fixed-dim: '#00dbe7'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#ffe173'
  tertiary-fixed-dim: '#e8c423'
  on-tertiary-fixed: '#221b00'
  on-tertiary-fixed-variant: '#554500'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.1em
  mono-code:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  container-max: 1440px
---

## Brand & Style

The design system is engineered for high-performance AI interfaces where precision and speed are paramount. The brand personality is "Cold Tech"—an aesthetic that favors mathematical accuracy over organic warmth. It targets power users, developers, and researchers who require a low-latency visual experience that eliminates cognitive load through extreme contrast.

The style is a synthesis of **Minimalism** and **High-Contrast Digitalism**. It rejects the soft depth of traditional UI, opting instead for a "flat-mechanical" look. Visual hierarchy is established through radical shifts in typography weight and the strategic application of vibrant, emissive colors against a void-like background. The atmosphere is clinical, authoritative, and unapologetically digital.

## Colors

The palette is anchored by "Void Charcoal" (#0A0A0A), providing a pure dark foundation that allows "Electric Cyan" (#00F2FF) and "Cyber Violet" (#8B5CF6) to function as light sources within the UI.

- **Primary (Electric Cyan):** Used for primary actions, success states, and active data streams.
- **Secondary (Cyber Violet):** Used for secondary interactions, AI-generated content indicators, and premium features.
- **Surface:** A slightly lifted #141414 is used for container backgrounds to provide subtle definition against the true-black base.
- **Typography:** Stark white (#FFFFFF) for maximum legibility on headers, with a muted zinc (#A1A1AA) for metadata and inactive states.

## Typography

Typography is the primary structural element. We utilize **Space Grotesk** for headlines to inject a geometric, futuristic character. **Inter** handles the heavy lifting for body text due to its exceptional legibility at small sizes. **Geist** is reserved for labels and mono-spaced data, reinforcing the technical nature of the tool.

Key principles:
- **Tight Kerning:** High-density headlines should use negative letter spacing.
- **Weight Contrast:** Pair Bold (700) headlines directly with Regular (400) body text.
- **All-Caps Labels:** Use Geist in uppercase with wide tracking (0.1em) for all utility labels and small metadata.

## Layout & Spacing

This design system employs a **Fixed Grid** philosophy within a fluid container. We use a strict 4px baseline grid to ensure all elements align to a technical cadence.

- **Desktop:** 12-column grid, 16px gutters, 24px side margins. 
- **Mobile:** 4-column grid, 12px gutters, 16px side margins.
- **Rhythm:** Spacing between sections should be aggressive (80px+) to maintain the minimalist aesthetic, while internal component padding remains tight and efficient (8px - 16px).

## Elevation & Depth

Depth is conveyed through **High-Contrast Outlines** rather than shadows. In the "Digital Chrome" environment, every element exists on a single logical plane.

- **Zero Shadows:** No box-shadows or drop-shadows are permitted.
- **Borders:** Define surfaces using 1px solid borders. Use `#262626` for standard containers and the Primary color (#00F2FF) for focused or active elements.
- **Tonal Layering:** Use the #141414 surface color for hover states or nested panels to create a sense of "stacking" without using blur or transparency.

## Shapes

The shape language is strictly **Sharp (0px)**. All buttons, inputs, cards, and containers must have 90-degree corners. This reinforces the "Chrome" and "Mechanical" nature of the design system, evoking the feeling of a professional precision instrument. 

Rounded corners are strictly forbidden except for specific circular icons or avatars.

## Components

- **Buttons:** High-contrast blocks. Primary buttons are solid #00F2FF with #0A0A0A text. Secondary buttons are 1px white borders with no fill.
- **Inputs:** Simple bottom-border or 1px stroke. Use #00F2FF for the focus state. No background fill.
- **Cards:** Defined solely by 1px borders (#262626). No background color unless it's a nested utility section.
- **Status Chips:** Small, rectangular tags with monochromatic fills. Use the Primary or Secondary color only for "Live" or "Active" AI processes.
- **Data Tables:** High-density rows separated by 1px horizontal lines. No vertical lines. Header cells use the `label-sm` typographic style.
- **Icons:** Use thin-stroke (1.5px) linear icons. Icons should never be filled; they should appear as "wireframes" to match the technical aesthetic.