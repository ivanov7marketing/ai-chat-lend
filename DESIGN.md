# DESIGN SYSTEM

## 1. Design Philosophy

The design language is modern, approachable, and conversion-focused, leveraging soft geometry and generous whitespace to create a frictionless B2B user experience. It uses a bright, optimistic color palette anchored by a vibrant primary green, combined with highly rounded corners (pill shapes) and subtle drop shadows to make interfaces feel lightweight, intuitive, and friendly.

---

## 2. Color Palette

Defined as CSS variables for the root layer and corresponding Tailwind configuration tokens.

### Primary Brand (Green)
- `--color-primary-50: #f0fdf4` — Light backgrounds, highlights
- `--color-primary-100: #dcfce7` — Subtle tinted backgrounds
- `--color-primary-200: #bbf7d0` — Badge backgrounds, hover fills
- `--color-primary-300: #86efac` — Decorative accents
- `--color-primary-400: #4ade80` — Hover states (green family)
- `--color-primary-500: #22c55e` — Main actions, branding
- `--color-primary-600: #16a34a` — Active states
- `--color-primary-700: #15803d` — Dark pressed states

### Secondary Color (Blue)
- `--color-secondary-50: #eff6ff` — Light info backgrounds
- `--color-secondary-500: #3b82f6` — Alternate actions (e.g., Google login)
- `--color-secondary-600: #2563eb` — Active secondary state

### Backgrounds
- `--color-bg-page: #f9fafb` — Overall app background
- `--color-bg-card: #ffffff` — White panels, cards
- `--color-bg-sidebar: #ffffff` — Navigation panels

### Text
- `--color-text-primary: #111827` — Headings, strong emphasis
- `--color-text-secondary: #4b5563` — Body copy, descriptions
- `--color-text-muted: #9ca3af` — Placeholders, tertiary info

### Border
- `--color-border-light: #f3f4f6` — Subtle dividers
- `--color-border-default: #e5e7eb` — Inputs, standard borders

### Feedback
- `--color-success: #10b981`
- `--color-warning: #f59e0b`
- `--color-error: #ef4444`
- `--color-info: #3b82f6`

---

## 3. Typography

**Font Family:** Inter, sans-serif
System fallback: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`

| Element | Class | Size | Weight | Line Height |
|---------|-------|------|--------|-------------|
| h1 | `text-5xl` | 48px | `font-bold` | `leading-tight tracking-tight` |
| h2 | `text-4xl` | 36px | `font-semibold` | `leading-tight tracking-tight` |
| h3 | `text-2xl` | 24px | `font-semibold` | `leading-snug` |
| h4 | `text-xl` | 20px | `font-medium` | `leading-snug` |
| body | `text-base` | 16px | `font-normal` | `leading-relaxed` |
| small | `text-sm` | 14px | `font-normal` | `leading-5` |
| caption | `text-xs` | 12px | `font-medium` | `leading-4 text-muted` |

---

## 4. Spacing System

Based on a predictable 4px grid. Named tokens are registered in `tailwind.config.js`.

| Token | Tailwind key | Value |
|-------|-------------|-------|
| xs | `spacing-xs` | 4px |
| sm | `spacing-sm` | 8px |
| md | `spacing-md` | 16px |
| lg | `spacing-lg` | 24px |
| xl | `spacing-xl` | 32px |
| 2xl | `spacing-2xl` | 48px |
| 3xl | `spacing-3xl` | 64px |
| 4xl | `spacing-4xl` | 96px |

---

## 5. Border Radius

The design heavily relies on rounded corners, specifically pill-shapes for interactive elements.

| Token | Value | Usage |
|-------|-------|-------|
| none | 0px | — |
| sm | 4px | Small badges |
| md | 8px | Tooltips, minor UI elements |
| lg | 12px | Standard inputs |
| xl | 16px | Small cards, dropdowns |
| 2xl | 24px | Main cards, large feature blocks |
| 3xl | 32px | Hero background blocks |
| full | 9999px | Primary buttons, avatars, pills |

---

## 6. Shadows & Elevation

Soft, diffused shadows to lift elements off the light gray background without feeling heavy.

| Token | Value | Usage |
|-------|-------|-------|
| none | none | Flat elements |
| sm | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Subtle cards |
| md | `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)` | Standard cards, focused inputs |
| lg | `0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)` | Dropdowns, floating elements |
| xl | `0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)` | Modals, floating mockups |

---

## 7. Component Styles

### Button — Primary
```

inline-flex items-center justify-center px-6 py-3
bg-primary-500 text-white font-medium rounded-full shadow-sm
transition-all duration-200
hover:bg-primary-600 hover:shadow-md hover:-translate-y-0.5
active:bg-primary-700 active:translate-y-0
disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none

```

### Button — Secondary / Social
```

inline-flex items-center justify-center px-6 py-3
bg-white border border-gray-200 text-gray-700 font-medium rounded-full shadow-sm
transition-all duration-200
hover:bg-gray-50 hover:border-gray-300
disabled:opacity-50 disabled:cursor-not-allowed

```

### Button — Ghost
```

inline-flex items-center justify-center px-4 py-2
bg-transparent text-gray-600 font-medium rounded-full
transition-colors duration-200
hover:bg-gray-100 hover:text-gray-900
disabled:opacity-50 disabled:cursor-not-allowed

```

### Button — Destructive
```

inline-flex items-center justify-center px-6 py-3
bg-red-500 text-white font-medium rounded-full shadow-sm
transition-all duration-200
hover:bg-red-600 hover:shadow-md
active:bg-red-700
disabled:opacity-50 disabled:cursor-not-allowed

```

### Input Field
```

w-full px-4 py-3 bg-white border border-gray-200 rounded-xl
text-gray-900 placeholder-gray-400
transition-all duration-200 outline-none
focus:border-primary-500 focus:ring-4 focus:ring-primary-50

```
- Label: `block text-sm font-medium text-gray-700 mb-1.5`
- Error state: `border-red-500 focus:border-red-500 focus:ring-red-50`
- Error message: `mt-1.5 text-sm text-red-500`

### Card / Panel
```

bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden

```
- Interactive card: add `hover:shadow-md transition-shadow duration-300 cursor-pointer`

### Badge / Tag
```

inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
bg-primary-50 text-primary-600

```
- Success variant: `bg-green-50 text-green-700`
- Warning variant: `bg-amber-50 text-amber-700`
- Error variant: `bg-red-50 text-red-600`
- Neutral variant: `bg-gray-100 text-gray-600`

### Navigation — Top Nav
```

flex items-center justify-between px-8 py-4
bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100

```

### Navigation — Sidebar
```

w-64 h-screen bg-white border-r border-gray-100 flex flex-col py-6 px-4

```
- Nav item default: `flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 font-medium text-sm transition-colors duration-200 hover:bg-gray-50 hover:text-gray-900`
- Nav item active: `bg-primary-50 text-primary-600`

### Table
```

w-full text-sm text-left

```
- Header row: `border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide`
- Header cell: `px-4 py-3`
- Body row: `border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150`
- Body cell: `px-4 py-3.5 text-gray-700`
- Wrapper: `bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden`

### Modal
- Overlay: `fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40`
- Dialog: `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 z-50`
- Title: `text-xl font-semibold text-gray-900 mb-1`
- Subtitle: `text-sm text-gray-500 mb-6`

### Drawer
- Overlay: `fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40`
- Panel: `fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col`
- Header: `flex items-center justify-between px-6 py-4 border-b border-gray-100`
- Body: `flex-1 overflow-y-auto px-6 py-6`
- Footer: `px-6 py-4 border-t border-gray-100 flex gap-3`

---

## 8. Layout & Grid

- **Max content width:** `max-w-7xl` (1280px) for standard pages; `max-w-5xl` (1024px) for forms and focused reading
- **Sidebar width:** `w-64` (256px)
- **Column grid:** 12-column (`grid-cols-12`), gap `gap-6` (24px) or `gap-8` (32px)
- **Responsive breakpoints:**

| Name | Width |
|------|-------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |

---

## 9. Icons

- **Library:** Lucide React
- **Default size:** `w-5 h-5` (20px) for controls; `w-6 h-6` (24px) for headers or large buttons
- **Stroke width:** `1.5` for UI controls; `2` for emphasis icons
- **Color:** inherits text color via `currentColor`

---

## 10. Interaction & Animation

- **Micro-interactions** (hover, focus): `duration-200 ease-out`
- **Layout transitions** (modals, accordions): `duration-300 ease-in-out`
- **Spinner:** `animate-spin rounded-full border-2 border-gray-200 border-t-primary-500 w-5 h-5`
- **Skeleton:** `animate-pulse bg-gray-200 rounded-xl`
- **Focus ring:** `focus:outline-none focus:ring-4 focus:ring-primary-50 focus:border-primary-500`

---

## 11. Tailwind Config

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        secondary: {
          50:  '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'xs':  '4px',
        'sm':  '8px',
        'md':  '16px',
        'lg':  '24px',
        'xl':  '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
      },
      borderRadius: {
        'xl':   '16px',
        '2xl':  '24px',
        '3xl':  '32px',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)',
      },
    },
  },
  plugins: [],
}
```


---

## 12. Do's and Don'ts

**DO:**

- Use `rounded-full` for all primary and secondary CTA buttons
- Use `p-6` or `p-8` inside cards; maintain wide gaps between sections
- Use soft drop shadows (`shadow-md` / `shadow-lg` with low opacity) on floating elements
- Use named color tokens (`bg-primary-500`, `text-gray-600`) — never hardcode hex values
- Use `transition-all duration-200` on every interactive element

**DON'T:**

- Use dark borders for structure — rely on `border-gray-100` / `border-gray-200` or background contrast
- Mix sharp corners (`rounded-none`, `rounded-sm`) on major UI components — default to `rounded-xl` or `rounded-2xl`
- Use arbitrary Tailwind values (e.g., `bg-[#22c55e]`, `p-[13px]`) — always use tokens
- Use `primary-400` (green-400) from a different color family — the entire primary palette is from the `green` family
- Hardcode pixel widths for layout — use the grid system and spacing tokens

```
```

