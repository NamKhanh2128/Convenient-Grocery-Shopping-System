# Frontend Enhancement Specification (Non-breaking Changes Only)

## ⚠️ IMPORTANT CONSTRAINT

- DO NOT modify, refactor, or remove any existing frontend components, layouts, or logic.
- DO NOT change existing UI structure unless explicitly required below.
- ONLY extend the current system by adding new components or enhancing specific areas listed.
- Maintain backward compatibility with current UI/UX.

---

## 1. 📊 Statistics Screen (New Feature)

### Requirement
Add a new screen called **"Statistics"** accessible from the navigation bar.

### Features

#### 1.1 Food Consumption Over Time
- Display charts:
  - Line chart (daily / weekly / monthly)
  - Bar chart (food category comparison)
- Filters:
  - Time range
  - Food category

#### 1.2 Consumption Trends Analysis
- Show:
  - Most consumed foods
  - Least consumed foods
- Add tags:
  - "Frequently Used"
  - "Rarely Used"
- Optional suggestion text:
  - "You should use [food] in the next few days"

#### 1.3 Food Waste Report
- Show:
  - Total expired items
  - Waste percentage
- Display:
  - Pie chart (used vs wasted)
- List expired items

---

## 2. 🧭 Navigation Bar Enhancement (Non-breaking UI Improvement)

### Requirement
Enhance existing navigation bar WITHOUT restructuring it.

### Changes
- Add text labels below each icon
- Ensure:
  - Icons are evenly spaced
  - Clear visual hierarchy
- Highlight active tab

### Add new tab:
- "Statistics" (with appropriate icon)

---

## 3. 🌐 Localization (Language Consistency)

### Requirement
Ensure consistent language usage across UI.

### Features
- Add language switch option:
  - Vietnamese (default)
  - English
- Place switch in:
  - Settings OR Profile (do not restructure layout)

- Ensure:
  - No mixed-language UI
  - All labels are translatable

---

## 4. 🍽️ Meal Plan Enhancements (Extend Only)

### Add new icons:
- Favorite (⭐)
- Frequently Used (🔥)

### Behavior:
- Users can mark items as Favorite
- System auto-tags "Frequently Used" based on usage frequency

### Constraint:
- Do NOT redesign Meal Plan layout
- Only inject additional UI elements

---

## 5. 👨‍👩‍👧‍👦 Family Management Enhancements

### 5.1 Add Member by ID
- Input field:
  - Enter User ID or Family ID
- Show status:
  - Pending / Accepted

### 5.2 New User Onboarding

When a new user enters the app:

Display 2 options:
- Create a new family
- Join an existing family (via ID)

### UI:
- Simple buttons or cards
- No impact on existing flows

---

## 6. 🎨 UI/UX Enhancements (Soft Improvements Only)

### Apply ONLY where safe:
- Add subtle animations:
  - Tab transitions
  - Item interactions
- Improve spacing and alignment if needed
- Add visual feedback:
  - Toast / Snackbar
  - Loading states
  - Empty states

### DO NOT:
- Change core layout structure
- Replace existing design system

---

## 7. 📌 Micro UX Improvements

- Tooltip for icons (if missing)
- Empty state messages:
  - "No data available"
- Loading skeletons
- Feedback messages for user actions

---

## 8. 🧠 Smart Insights (Optional)

Add non-intrusive suggestions:
- "You are wasting X% of food"
- "You consume more meat than vegetables"
- "Use [item] before [date]"

---

## ✅ Summary

This specification is strictly **additive and non-destructive**:
- No breaking changes
- No redesign of existing UI
- Only enhancements, additions, and improvements

Ensure all implementations respect the current frontend architecture.