# Accessibility Audit Checklist (WCAG 2.1 AA)

## Keyboard Navigation

### Forms
- [ ] All form inputs have associated labels
- [ ] Tab order is logical and follows visual flow
- [ ] Focus indicators are visible
- [ ] Error messages are announced to screen readers
- [ ] Required fields are indicated with `aria-required`

### Navigation
- [ ] Skip to main content link
- [ ] All nav items are keyboard accessible
- [ ] Modal dialogs trap focus correctly
- [ ] ESC key closes modals/dropdowns
- [ ] Arrow keys navigate through menus

### Tables
- [ ] Tables have proper headers (`<th>`)
- [ ] Tables use `scope` attribute for headers
- [ ] Sortable columns have `aria-sort`
- [ ] Pagination controls are accessible

## Screen Reader Support

### Semantic HTML
- [ ] Use `<main>`, `<nav>`, `<header>`, `<footer>`
- [ ] Use `<h1>` - `<h6>` in order
- [ ] Use `<button>` not `<div onClick>`
- [ ] Use `<a href>` for navigation links

### ARIA Labels
- [ ] Icon-only buttons have `aria-label`
- [ ] Images have descriptive `alt` text
- [ ] Dynamic content uses `aria-live`
- [ ] Loading states use `aria-busy`
- [ ] Form errors use `aria-describedby`

### Landmarks
- [ ] Main content area marked with `role="main"`
- [ ] Navigation marked with `role="navigation"`
- [ ] Search marked with `role="search"`
- [ ] Alerts use `role="alert"`

## Color & Contrast

### Text
- [ ] Normal text has 4.5:1 contrast ratio
- [ ] Large text has 3:1 contrast ratio
- [ ] Information not conveyed by color alone
- [ ] Focus indicators have sufficient contrast

### Interactive Elements
- [ ] Buttons have sufficient contrast
- [ ] Links are distinguishable from text
- [ ] Form inputs have visible borders
- [ ] Error states are not color-only

## Forms

### Labels
- [ ] All inputs have visible labels
- [ ] Labels are associated with `htmlFor`/`id`
- [ ] Placeholder text is not the only label
- [ ] Required fields marked with `*` and `aria-required`

### Validation
- [ ] Errors announced with `aria-live`
- [ ] Error messages linked to inputs via `aria-describedby`
- [ ] Form-level errors summarized at top
- [ ] Success messages announced

## Media

### Images
- [ ] Decorative images use `alt=""`
- [ ] Informative images have descriptive `alt`
- [ ] Complex images have `longdesc`
- [ ] SVGs have accessible names

### Icons
- [ ] Icon buttons have `aria-label`
- [ ] Decorative icons hidden from screen readers
- [ ] Icon + text combinations are properly labeled

## Responsive Design

### Mobile
- [ ] Touch targets are 44x44px minimum
- [ ] Content reflows at 320px width
- [ ] No horizontal scrolling
- [ ] Text is readable without zoom

### Zoom
- [ ] Content readable at 200% zoom
- [ ] No loss of functionality at zoom
- [ ] Layout adapts gracefully

## Testing Tools

### Automated
- [ ] axe-core integration
- [ ] Lighthouse accessibility audit
- [ ] WAVE toolbar testing

### Manual
- [ ] Screen reader testing (NVDA/VoiceOver)
- [ ] Keyboard-only navigation testing
- [ ] Color contrast checker
- [ ] Mobile device testing

## Common Issues to Fix

### Missing Labels
```tsx
// Bad
<input type="text" />

// Good
<label htmlFor="email">Email</label>
<input id="email" type="text" aria-required="true" />
```

### Missing Alt Text
```tsx
// Bad
<img src="logo.png" />

// Good
<img src="logo.png" alt="RestoManager logo" />
```

### Invisible Focus
```css
/* Bad */
:focus { outline: none; }

/* Good */
:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }
```

### Missing ARIA
```tsx
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<button onClick={handleClick}>Click me</button>

// Or if must use div:
<div 
  role="button" 
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
>
  Click me
</div>
```
