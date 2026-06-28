# Responsive Design Checklist

## Breakpoints

| Breakpoint | Width | Target |
|------------|-------|--------|
| xs | < 640px | Mobile portrait |
| sm | 640px | Mobile landscape |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |

## Mobile First Approach

### Layout
- [ ] Use `flex-col` on mobile, `flex-row` on desktop
- [ ] Use `grid-cols-1` on mobile, `md:grid-cols-2+` on desktop
- [ ] Padding/margins scale with screen size
- [ ] Content doesn't overflow horizontally

### Navigation
- [ ] Mobile: Hamburger menu or bottom nav
- [ ] Desktop: Sidebar or top nav
- [ ] Touch targets are 44x44px minimum
- [ ] Menu items are easily tappable

### Typography
- [ ] Font sizes scale: `text-sm` → `md:text-base` → `lg:text-lg`
- [ ] Line height appropriate for mobile
- [ ] Text doesn't require horizontal scroll

## Component-Specific

### Tables
- [ ] Mobile: Card layout or horizontal scroll
- [ ] Desktop: Full table view
- [ ] Sort/filter controls accessible on mobile

### Forms
- [ ] Inputs are full-width on mobile
- [ ] Labels above inputs on mobile
- [ ] Date pickers work on touch
- [ ] Dropdowns are touch-friendly

### Modals
- [ ] Full-screen on mobile
- [ ] Centered on desktop
- [ ] Close button easily tappable
- [ ] Content scrollable if needed

### POS Page
- [ ] Grid layout adapts: 2 cols mobile, 4+ desktop
- [ ] Cart sidebar: bottom sheet on mobile, side panel on desktop
- [ ] Product cards are tappable
- [ ] Quantity controls are touch-friendly

### Dashboard
- [ ] KPI cards stack on mobile
- [ ] Charts are scrollable on mobile
- [ ] Tables have horizontal scroll

## Testing

### Devices
- [ ] iPhone SE (375px)
- [ ] iPhone 14 (390px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1280px+)

### Tools
- [ ] Chrome DevTools device mode
- [ ] Firefox responsive design mode
- [ ] Real device testing

### Common Issues
- [ ] No horizontal scroll on any page
- [ ] Images scale properly
- [ ] Buttons are thumb-reachable on mobile
- [ ] Text is readable without zoom
- [ ] Forms work with virtual keyboard

## Tailwind Classes Reference

### Display
```tsx
<div className="block md:hidden">Mobile only</div>
<div className="hidden md:block">Desktop only</div>
<div className="flex flex-col md:flex-row">Stack on mobile, row on desktop</div>
```

### Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Spacing
```tsx
<div className="p-2 md:p-4 lg:p-6">Responsive padding</div>
<div className="m-2 md:m-4 lg:m-6">Responsive margin</div>
```

### Typography
```tsx
<h1 className="text-lg md:text-xl lg:text-2xl">Responsive heading</h1>
<p className="text-sm md:text-base">Responsive text</p>
```
