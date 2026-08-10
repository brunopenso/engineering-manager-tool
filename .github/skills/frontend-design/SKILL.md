---
name: frontend-design
description: Use this skill when asked to create React screens, dashboards, forms, or pages with Material UI. Focus on clean layout, modern colors, responsive design, accessibility, and reusable components.
---

When asked to build a React UI screen:

1. Use React functional components.
2. Use Material UI components wherever possible.
3. Prefer:
   - `Container`, `Box`, `Stack`, `Grid`, `Paper`, `Card`
   - `Typography`, `Button`, `TextField`, `Chip`, `Avatar`
   - `AppBar`, `Toolbar`, `Drawer`, `Tabs`, `Dialog`
4. Build responsive layouts using Material UI spacing and breakpoints.
5. Use a clean modern visual hierarchy:
   - strong page title
   - clear section spacing
   - one primary action
   - limited accent colors
6. Prefer accessible color contrast and consistent padding.
7. If no palette is specified, use:
   - primary: indigo or blue
   - secondary accents: teal or purple
   - background: light gray or off-white
8. When generating code:
   - include imports
   - keep components readable
   - avoid unnecessary complexity
   - use theme-aware styling with `sx`
9. If asked for a screen, produce:
   - page layout
   - header/title area
   - content sections/cards
   - form/table/list if relevant
   - responsive behavior
10. If the user request is vague, choose a polished enterprise-style UI with Material UI best practices.

Example user intents for this skill:

- create a dashboard screen in react
- make a beautiful login page with material ui
- build a profile page using mui
- generate a responsive products page in react
