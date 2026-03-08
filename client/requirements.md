## Packages
date-fns | Date formatting and calculations
recharts | Progress graphs and analytics visualization

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  sans: ["var(--font-body)"],
  display: ["var(--font-display)"],
}

Implementation assumptions:
- The backend expects multipart/form-data for `/api/logs` with fields `date`, `aCoins`, `credits`, and `screenshot`.
- Auth checks use `/api/auth/me`. If it returns 401, redirect to `/auth`.
- Static images are not required (using dark styling + gradients instead).
- Users can choose from a list of predefined avatar strings.
- We enforce a dark mode "gaming" theme by applying `.dark` class to the body by default in index.css.
