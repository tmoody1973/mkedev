# Tailwind Color Usage Guide

MKE.dev uses Tailwind CSS v4 with three color palettes from the built-in color system.

## Color Palettes

### Primary: `sky`
Used for buttons, links, and key interactive accents.

| Class | Usage |
|-------|-------|
| `bg-sky-500` | Primary button background |
| `bg-sky-600` | Primary button hover |
| `text-sky-500` | Links, accent text |
| `text-sky-600` | Link hover |
| `border-sky-500` | Primary borders |
| `ring-sky-500` | Focus rings |

**Common patterns:**
```html
<!-- Primary Button -->
<button class="bg-sky-500 hover:bg-sky-600 text-white border-2 border-black shadow-[4px_4px_0_black]">
  Click me
</button>

<!-- Link -->
<a class="text-sky-500 hover:text-sky-600 underline">Learn more</a>
```

### Secondary: `amber`
Used for tags, highlights, and secondary elements.

| Class | Usage |
|-------|-------|
| `bg-amber-100` | Tag/badge background |
| `bg-amber-500` | Secondary button background |
| `text-amber-700` | Tag text |
| `border-amber-400` | Highlight borders |

**Common patterns:**
```html
<!-- Tag/Badge -->
<span class="bg-amber-100 text-amber-700 px-2 py-1 text-sm border-2 border-black">
  TIF District
</span>

<!-- Highlight Card -->
<div class="bg-amber-50 border-2 border-amber-400 p-4">
  Important information
</div>
```

### Neutral: `stone`
Used for backgrounds, text, and borders throughout the UI.

| Class | Usage |
|-------|-------|
| `bg-stone-50` | Light mode background |
| `bg-stone-900` | Dark mode background |
| `text-stone-900` | Primary text (light mode) |
| `text-stone-100` | Primary text (dark mode) |
| `text-stone-500` | Secondary/muted text |
| `border-stone-200` | Light borders |
| `border-stone-700` | Dark mode borders |

**Common patterns:**
```html
<!-- Page Background -->
<div class="bg-stone-50 dark:bg-stone-900 min-h-screen">

<!-- Card -->
<div class="bg-white dark:bg-stone-800 border-2 border-black dark:border-white">

<!-- Muted Text -->
<p class="text-stone-500 dark:text-stone-400">Last updated 2 days ago</p>
```

## Neobrutalist Style

All interactive elements use the neobrutalist style:

```html
<!-- Standard brutalist card -->
<div class="bg-white border-2 border-black shadow-[4px_4px_0_black] dark:bg-stone-800 dark:border-white dark:shadow-[4px_4px_0_white]">
  Content
</div>

<!-- Button with hover effect -->
<button class="bg-sky-500 text-white border-2 border-black shadow-[4px_4px_0_black] hover:shadow-[2px_2px_0_black] hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
  Click
</button>
```

## Dark Mode

All components support dark mode using Tailwind's `dark:` variant:

```html
<div class="bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100">
  <h1 class="text-sky-600 dark:text-sky-400">Title</h1>
  <p class="text-stone-600 dark:text-stone-400">Description</p>
</div>
```

## Color Accessibility

- Ensure sufficient contrast ratios (WCAG AA minimum)
- Use `sky-600` or darker for text on light backgrounds
- Use `sky-400` or lighter for text on dark backgrounds
- Test all color combinations in both light and dark modes
