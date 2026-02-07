# Scaling Fix for Create New Ticket Page

## Issues Identified
1. Fixed max-width container (`max-w-2xl`) - doesn't scale well on larger screens
2. Fixed textarea rows - doesn't adapt to content/screen size
3. Priority grid limitations - `grid-cols-2 md:grid-cols-4` could be more responsive
4. No viewport-relative positioning - page lacks proper min-height handling
5. Inconsistent responsive padding - fixed `px-6` doesn't scale properly

## Plan
- [x] Update container max-width with responsive breakpoints (`max-w-lg sm:max-w-xl lg:max-w-2xl`)
- [x] Make textarea flexible with min-height instead of fixed rows (`min-h-[120px] sm:min-h-[150px]`)
- [x] Improve priority grid with better responsive breakpoints (`grid-cols-2 sm:grid-cols-2 lg:grid-cols-4`)
- [x] Use responsive padding throughout (`p-4 sm:p-6`)
- [x] Scale form elements appropriately (buttons, icons, spacing)

