# Implementation Plan

- [x] 1. Add Settings icon import and setup navigation state detection
  - Import Settings icon from Lucide React in header component
  - Add usePathname hook import from Next.js navigation
  - Create active state detection logic for settings page
  - _Requirements: 1.3, 2.5, 3.1_

- [x] 2. Implement settings menu item in user avatar dropdown
  - Add Settings menu item to UserMenu dropdown content
  - Include Settings icon and "账户设置" label
  - Implement Link component for navigation to /settings
  - Add proper DropdownMenuItem wrapper with accessibility attributes
  - _Requirements: 1.1, 1.2, 1.3, 5.1_

- [x] 3. Add settings navigation item to main navigation menu
  - Add Settings link to NavigationMenu component navigation list
  - Include Settings icon and "设置" label for consistency
  - Apply conditional active state styling based on current pathname
  - Maintain existing responsive behavior and styling patterns
  - _Requirements: 2.1, 2.2, 2.5, 3.1, 5.2_

- [x] 4. Implement active state styling for settings navigation
  - Create conditional className logic for active settings navigation
  - Apply active state styling when pathname matches /settings
  - Ensure consistent active state appearance with other navigation items
  - Test active state persistence across page interactions
  - _Requirements: 2.5, 3.1, 3.4, 5.5_

- [x] 5. Add accessibility attributes and keyboard navigation support
  - Add proper aria-labels for settings navigation items
  - Ensure keyboard navigation works for both dropdown and main nav
  - Test screen reader compatibility for settings navigation
  - Validate focus management in dropdown interactions
  - _Requirements: 4.2, 4.3, 5.4_

- [x] 6. Test responsive behavior and mobile navigation
  - Verify settings navigation appears correctly on mobile devices
  - Test dropdown behavior on touch devices
  - Ensure proper spacing and readability across screen sizes
  - Validate navigation item visibility in mobile menu
  - _Requirements: 4.1, 4.4, 5.2_

- [x] 7. Validate navigation consistency and user experience
  - Test both navigation methods lead to same /settings destination
  - Verify consistent styling patterns with existing navigation items
  - Test hover states and interaction feedback
  - Ensure navigation works correctly for authenticated users only
  - _Requirements: 1.4, 5.3, 5.4, 5.5_

- [x] 8. Create comprehensive tests for settings navigation
  - Write unit tests for UserMenu settings dropdown item
  - Write unit tests for NavigationMenu settings navigation item
  - Test authentication state handling and conditional rendering
  - Create integration tests for complete navigation flow
  - _Requirements: 1.4, 2.4, 4.2, 4.3_
