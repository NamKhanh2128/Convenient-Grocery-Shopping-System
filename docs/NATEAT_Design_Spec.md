

**NATEAT**

Food Delivery — Design & Dev Spec

v1.0  ·  Landing Page  ·  March 2025

| Product | Version | Status | Owner |
| :---- | :---- | :---- | :---- |
| NATEAT Landing Page | v1.0 | **In Development** | Design Lead |
| **Tech Stack** | **Framework** | **Icons** | **Date** |
| HTML / CSS / Vanilla JS | None (pure CSS) | Inline SVG | March 2025 |

© 2025 NATEAT Team. Confidential — Internal use only.

**1\. Design Overview**

The NATEAT landing page is a food delivery dashboard UI built as a single-page HTML artifact. The design philosophy is warm-luxury: a dark charcoal shell (#16171d / #1e1f26) wrapping a pure white card interior, with amber/gold accents providing energy and contrast. All components are responsive to hover/active states and provide immediate visual feedback.

**▌ Design Principles**

| Principle | Application |
| :---- | :---- |
| **Warm Luxury** | Charcoal (#16171d) background contrasted by white card surfaces and gold accents |
| **Immediate Feedback** | Every interactive element responds within 0.2s via CSS transitions |
| **Visual Hierarchy** | Nunito 900 Black for prices/headings, DM Sans for body — clear weight contrast |
| **Spatial Rhythm** | 22px base radius, 16px card gap, 24px internal padding — consistent throughout |
| **Data-First** | Key numbers (price, rating, points) are always the largest element in their group |

**2\. Color System**

|    \#f59e0b Gold / Primary |    \#FFD166 Gold Light |    \#16171d Charcoal BG |    \#1e1f26 Charcoal Deep |    \#FFFFFF Card BG |    \#FFFFFF White |
| :---- | :---- | :---- | :---- | :---- | :---- |
|    \#111111 **Text Dark** |    \#4b5563 **Text Muted** |    \#22c55e **Success** |    \#E74C3C **Danger** |  |  |

| CSS Variable | Hex | Role |
| :---- | :---- | :---- |
| **\--gold** | \#f59e0b | Primary CTA, active states, sparklines, border accents |
| **\--gold-light** | \#FFD166 | Avatar border, cover subtitle, lighter gold highlights |
| **\--charcoal-bg** | \#16171d | App shell outer background |
| **\--charcoal-deep** | \#1e1f26 | App shell gradient, header cells, sidebar active line bg |
| **\--white** | \#FFFFFF | Sidebar bg, right panel bg, card surfaces, search input |
| **\--card-bg** | \#ffffff | Main content background, card surfaces |
| **\--text-dark** | \#111111 | Primary text, headings, category numbers |
| **\--text-muted** | \#4b5563 | Captions, metadata, inactive nav icons, edit links |
| **\--success** | \#22c55e | Success states, progress bars, checkmarks |
| **\--danger** | \#E74C3C | Error states (reserved) |
| **\--shadow-card** | 0 2px 12px rgba(0,0,0,0.15) | Default card elevation |
| **\--shadow-btn** | 0 4px 18px rgba(245,166,35,0.45) | Checkout / CTA button shadow |

**3\. Typography**

| Role | Font Family | Weight | Size | Use Case |
| :---- | :---- | :---- | :---- | :---- |
| **Display / Brand** | Nunito | 900 Black | 30px–44px | Headings, logo, prices |
| **Sub-headings** | Nunito | 800 ExtraBold | 14px–20px | Section titles, nav labels |
| **Body / UI** | DM Sans | 400 Regular | 12px–14px | Descriptions, metadata |
| **Code / Tokens** | Courier New | 400 Regular | 11px–14px | CSS vars, hex codes |

**▌ Font Loading**

Google Fonts are loaded via a single \<link\> in \<head\>. Both Nunito and DM Sans are loaded together to minimise round-trips.

 \<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900\&family=DM+Sans:wght@400;500;600\&display=swap" rel="stylesheet"\> 

ℹ  Always use font-display: swap (handled by Google Fonts) to prevent invisible text during load.

**4\. Layout & Grid**

| Zone | Width | CSS | Contents |
| :---- | :---- | :---- | :---- |
| **Sidebar** | 64px | fixed width, flex col | Logo, nav icons, logout |
| **Main Content** | 1fr (flex) | grid-template-columns: 64px 1fr 320px | Search, stats, categories, recommendations |
| **Right Panel** | 320px | fixed width | User, delivery, order summary, checkout |
| **Shell radius** | 28px | border-radius: 28px | Outer container |
| **Min height** | 600px | min-height: 600px | App shell |
| **Max width** | 1200px | max-width: 1200px | App shell |

The three-column CSS Grid is defined on .app-shell with grid-template-columns: 64px 1fr 320px. All three zones sit at min-height: 600px. Overflow in the main column is handled by overflow-y: auto with a custom scrollbar (4px wide, \#D0CCE8 thumb).

**5\. Spacing & Radius Tokens**

| Token | Value | CSS Variable / Usage | Applied To |
| :---- | :---- | :---- | :---- |
| **\--radius** | 22px | var(--radius) | Cards, promo boxes, reco section |
| **\--radius-sm** | 12px | var(--radius-sm) | Buttons, input, order items |
| **\--gap-card** | 16px | gap in grid | Stats row, reco cards |
| **\--gap-list** | 12px | gap in flex col | Order list items |
| **Padding (card)** | 18–24px | padding: 18px 20px / 24px 22px | Points card, promo card, panel |
| **Icon size (nav)** | 20px | svg width/height | Sidebar nav icons |
| **Avatar** | 44×44px | width/height | User avatar, logo box |

**6\. Component Spec**

| Component | Variant / State | Key CSS | Notes |
| :---- | :---- | :---- | :---- |
| **Checkout Button** | Default | bg:\#F5A623, border-radius:14px, font:Nunito 900 | box-shadow: 0 4px 18px rgba(245,166,35,0.45) |
| **Checkout Button** | :hover | translateY(-2px), box-shadow 0 8px 28px | No background change on hover |
| **Add Order Button** | Default | border: 2px solid \#F5A623, bg: none, color: \#F5A623 | Becomes filled gold on :hover |
| **Qty Button (−/+)** | Default | width:20px, border: 1px \#e5e7eb, radius: 6px | Turns gold on :hover |
| **Category Circle** | Default | width:76px, border-radius:50%, shadow-card | translateY(-3px) on active/hover |
| **Category Circle** | Active | border: 2.5px solid \#F5A623 | Class: .active-ring |
| **Reco Card** | Default | bg: rgba(255,255,255,0.15), radius: 12px | On gold (\#F5A623) background section |
| **Reco Card** | :hover | translateY(-3px), bg rgba(255,255,255,0.25) | Smooth 0.2s ease |
| **Nav Item (Sidebar)** | Active | bg: #f3f4f6, left accent bar 4px gold | Class: .nav-item.active |
| **Search Input** | :focus | box-shadow: 0 0 0 3px rgba(245,166,35,0.25) | No visible border change |

**▌ Right Panel — Order Summary**

The panel uses display: flex, flex-direction: column with gap: 20px between zones. The total section is pushed to the bottom via margin-top: auto on .total-section, ensuring the checkout button always anchors to the foot of the panel regardless of order item count.

**▌ Sidebar Navigation**

The sidebar is 64px wide with no labels — icon-only design. Each nav-item is 44×44px with a 12px border-radius. The active item shows a 4px left bar in \--gold positioned absolutely at left: \-4px. A badge-dot (7px circle, gold border 2px white) indicates unread notifications on the mail icon.

**7\. Motion & Animation**

| Animation | Definition | Trigger | Element |
| :---- | :---- | :---- | :---- |
| **slideUp** | opacity 0→1, translateY 30px→0, 0.6s cubic-bezier(0.22,1,0.36,1) | Page load | .app-shell |
| **hover lift** | translateY(-3px), box-shadow amplify, 0.2s ease | mouseover | .cat-circle, .reco-card |
| **btn press** | translateY(0), 0.15s ease | :active | .checkout-btn |
| **input focus ring** | box-shadow 0 0 0 3px rgba(245,166,35,0.25) | :focus | search input |
| **heart toggle** | text swap 🤍↔❤️ via JS | click | .heart-btn |
| **qty update** | textContent change, 0→99 clamp | click | .qty-btn |

ℹ  All transitions are CSS-only (transition property). No external animation library is used in v1. If upgrading to React, consider Framer Motion for the page-load slideUp.

**8\. Assets & Icons**

| Asset | Format | Size | Notes |
| :---- | :---- | :---- | :---- |
| **Logo icon (fork/knife)** | Inline SVG | 24×24 viewBox | Fill: white, bg: \#F5A623 |
| **Nav icons** | Inline SVG | 20×20 viewBox | Stroke: \#f59e0b (active) / \#9ca3af |
| **Action icons (search, bell, etc.)** | Inline SVG | 18×20 viewBox | Stroke-width: 2, no fill |
| **Sparkline chart** | Inline SVG | 160×40 viewBox | CSS gradient fill, Courier labels |
| **Category / food imagery** | Emoji (placeholder) | 34–40px font-size | Replace with optimized WebP in production |

All icons are inline SVG with stroke-based rendering (fill: none). This allows direct color control via CSS (stroke property or currentColor). Nav icons use color: #f59e0b for active and #9ca3af for inactive — override via CSS only, no icon swapping required.

ℹ  Production: replace emoji food placeholders with 90px WebP images (optimised to \<15KB each). Use width/height attributes on img tags to avoid layout shift.

**9\. Handoff Checklist**

| ☐ | Export color tokens to CSS variables file (tokens.css) | Frontend lead |
| :---: | :---- | :---- |
| ☐ | Upload Nunito \+ DM Sans fonts to CDN (fallback if GFonts blocked) | DevOps |
| ☐ | Replace emoji placeholders with production WebP images | Designer |
| ☐ | Connect qty \+/− to real cart state / API endpoint | Backend dev |
| ☐ | Wire up checkout button to payment flow | Backend dev |
| ☐ | Add search input debounce \+ filter logic (300ms) | Frontend dev |
| ☐ | Implement responsive breakpoint for tablet (\< 900px) | Frontend dev |
| ☐ | Implement responsive breakpoint for mobile (\< 600px) | Frontend dev |
| ☐ | Accessibility audit: add aria-labels to icon-only buttons | Frontend dev |
| ☐ | Test across Chrome, Firefox, Safari, Edge | QA |
| ☐ | Figma frame created and linked in project Notion | Designer |
| ☐ | Lighthouse performance score \> 90 | Frontend dev |

**10\. Figma / Collaboration Notes**

**▌ Figma Setup Recommendations**

| Setting | Value |
| :---- | :---- |
| **Frame size** | 1440 × 900px (desktop default) |
| **Grid** | 12-column, 24px gutter, 80px margin |
| **Color styles** | Create styles from Section 2 tokens — name them gold/primary, charcoal/bg, neutral/text etc. |
| **Text styles** | Display/H1 (Nunito 900 36px), H2 (Nunito 800 24px), Body (DM Sans 400 14px) |
| **Component naming** | Use / notation: Button/Checkout, Button/AddOrder, Card/Reco, Card/Category |
| **Variants** | All interactive components need Default \+ Hover \+ Active variant states |
| **Auto Layout** | Use Auto Layout for sidebar (vertical) and categories row (horizontal) |
| **Constraints** | Right panel: right+top, Sidebar: left+top, Main: scale |

**▌ Sharing & Handoff**

When sharing the Figma file with developers, enable Dev Mode (Figma Professional/Org required). This exposes CSS values, spacing, and asset exports directly in the inspector. Share link with "can view" permissions only — no edit access for developers.

For this HTML prototype: share the .html file directly. All styles are self-contained in a single \<style\> block — no build step, no dependencies. Open in any modern browser.

ℹ  Recommended: paste this spec into your team Notion as the source of truth. Link to it from the Figma description and the GitHub/GitLab repo README.

NATEAT Design System v1.0  —  Generated March 2025  —  Internal Use Only