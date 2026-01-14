# Typography Guide

MKE.dev uses three Google Fonts for a distinctive, professional look.

## Font Families

### Space Grotesk — Headings
A bold, geometric sans-serif with a technical feel. Perfect for headlines and important UI labels.

**Usage:** `font-heading` or `font-['Space_Grotesk']`

```html
<h1 class="font-['Space_Grotesk'] text-4xl font-bold">MKE.dev</h1>
<h2 class="font-['Space_Grotesk'] text-2xl font-semibold">Section Title</h2>
```

**Google Fonts import:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### DM Sans — Body Text
A clean, highly readable sans-serif for body copy and general UI text.

**Usage:** `font-body` or `font-['DM_Sans']`

```html
<p class="font-['DM_Sans'] text-base">Body text goes here...</p>
<span class="font-['DM_Sans'] text-sm text-stone-500">Secondary text</span>
```

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### IBM Plex Mono — Code & Data
A monospace font for code snippets, data values, and technical information.

**Usage:** `font-mono` or `font-['IBM_Plex_Mono']`

```html
<code class="font-['IBM_Plex_Mono'] text-sm bg-stone-100 px-1">taxKey: 1234567</code>
<pre class="font-['IBM_Plex_Mono'] text-xs">{ "zoning": "RS6" }</pre>
```

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

## Combined Import

Add this to your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## Tailwind Configuration

For Tailwind CSS v4, add to your CSS:

```css
@theme {
  --font-heading: 'Space Grotesk', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
```

Then use in your components:

```html
<h1 class="font-heading">Heading</h1>
<p class="font-body">Body text</p>
<code class="font-mono">Code</code>
```

## Font Weights

| Weight | Class | Usage |
|--------|-------|-------|
| 400 | `font-normal` | Body text, descriptions |
| 500 | `font-medium` | Labels, subtle emphasis |
| 600 | `font-semibold` | Subheadings, buttons |
| 700 | `font-bold` | Main headings, strong emphasis |

## Type Scale

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Captions, timestamps |
| `text-sm` | 14px | Secondary text, labels |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Lead paragraphs |
| `text-xl` | 20px | Card titles |
| `text-2xl` | 24px | Section headers |
| `text-3xl` | 30px | Page titles |
| `text-4xl` | 36px | Hero headlines |
