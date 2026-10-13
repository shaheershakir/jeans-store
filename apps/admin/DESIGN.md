# DESIGN.md - TEESGARAGE Apparel Admin Dashboard

## 1. Product Identity

This is a **modern admin dashboard for a single-brand apparel business** selling Stripes, Fullsleeve, Drsleeve, Printed tees, Ringer tees, Henley, Trackpants, and Sweatpants.

The interface is designed for store owners, operations teams, inventory managers, order managers, and marketing teams.

The design should communicate:

- Premium fashion
- Commerce
- Organization
- Trust
- Operational efficiency
- Data clarity

The dashboard should feel like a **modern commerce SaaS product**, not a generic analytics dashboard.

It should be visually polished but highly practical.

The UI must prioritize:

1. Fast information scanning
2. Clear actions
3. Efficient data management
4. Consistent visual hierarchy
5. Responsive behavior

Do not make the interface look like a consumer shopping website. This is an **internal business administration system**.

---

# 2. Visual Theme & Atmosphere

Use a **clean, premium, minimal light interface**.

The visual language should combine:

- Modern SaaS dashboards
- Premium fashion brands
- E-commerce operations software

The overall feeling should be:

> Clean, premium, calm, structured, and data-focused.

Avoid overly futuristic or cyberpunk styling.

Avoid neon dashboards, gaming aesthetics, excessive gradients, glassmorphism, and decorative effects.

The interface should feel comfortable to use for several hours every day.

---

# 3. Color System

Use a restrained neutral palette with a strong primary accent.

## Background

- **Primary Background:** `#F8F9FA`
- **Secondary Background:** `#FFFFFF`
- **Sidebar Background:** `#FFFFFF`
- **Card Background:** `#FFFFFF`

## Borders

- **Default Border:** `#E5E7EB`
- **Strong Border:** `#D1D5DB`
- **Table Divider:** `#EAECF0`

Borders should be subtle and should not visually dominate the interface.

## Text

- **Primary Text:** `#111827`
- **Secondary Text:** `#667085`
- **Muted Text:** `#98A2B3`
- **Disabled Text:** `#B8BEC8`

Use strong contrast for important information.

## Primary Accent

Use a sophisticated **indigo / deep blue** as the primary application accent.

- **Primary:** `#4F46E5`
- **Primary Hover:** `#4338CA`
- **Primary Light:** `#EEF2FF`

Use the primary color for:

- Primary buttons
- Active navigation
- Links
- Selected filters
- Important interactive elements
- Focus states
- Key chart data

Do not use the accent color everywhere.

---

# 4. Semantic Colors

Use semantic colors consistently.

## Success

- `#16A34A`
- Light background: `#F0FDF4`

Use for:

- Delivered orders
- Successful payments
- Healthy inventory
- Active products
- Positive revenue changes

## Warning

- `#D97706`
- Light background: `#FFFBEB`

Use for:

- Low stock
- Pending payments
- Pending shipments
- Expiring promotions

## Error

- `#DC2626`
- Light background: `#FEF2F2`

Use for:

- Failed payments
- Cancelled orders
- Out-of-stock products
- Failed shipments
- Validation errors

## Informational

- `#2563EB`
- Light background: `#EFF6FF`

Use for:

- Processing orders
- Informational notifications
- General system states

Do not use red or green as decorative colors.

Semantic colors must communicate meaning.

---

# 5. Typography

Use **Inter** as the primary typeface.

Fallback:

```text
Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

## Headings

### Page Title

- 24px
- Weight: 600
- Line height: 32px

### Section Heading

- 18px
- Weight: 600
- Line height: 28px

### Card Heading

- 14px or 16px
- Weight: 600

## Body

- 14px
- Weight: 400
- Line height: 20px

## Small Text

- 12px
- Weight: 400 or 500
- Line height: 16px

## KPI Numbers

Use Inter or a clean tabular-number font.

- 28px to 32px
- Weight: 600 or 700

Enable tabular numbers where possible so financial values align correctly.

Example:

```text
₹8,42,500
```

Do not use JetBrains Mono or Fira Code for the entire dashboard.

Monospace fonts should only be used for technical identifiers such as:

- SKU
- Order ID
- Transaction ID
- Tracking number

---

# 6. Spacing System

Use an 8px spacing system.

Preferred spacing:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
```

Use consistent spacing between:

- Cards
- Sections
- Form fields
- Table rows
- Navigation items
- Page headers

Avoid arbitrary spacing values unless required for visual alignment.

---

# 7. Border Radius

Use moderate rounded corners.

### Cards

```text
12px
```

### Buttons

```text
8px
```

### Inputs

```text
8px
```

### Badges

```text
9999px
```

Do not use extremely rounded cards or excessive pill-shaped UI.

The dashboard should feel structured rather than playful.

---

# 8. Shadows

Use subtle shadows only when useful.

Preferred:

```text
0 1px 2px rgba(16, 24, 40, 0.05)
```

Use shadows mainly for:

- Dropdowns
- Modals
- Popovers
- Floating elements

Cards should primarily use borders rather than large shadows.

Avoid heavy floating-card effects.

---

# 9. Application Layout

Use a persistent admin layout.

Desktop:

```text
┌────────────────────────────────────────────────────────────┐
│ Sidebar │ Top Navigation                                   │
│         ├───────────────────────────────────────────────────┤
│         │                                                   │
│         │ Page Header                                       │
│         │                                                   │
│         │ Content                                           │
│         │                                                   │
│         │                                                   │
└────────────────────────────────────────────────────────────┘
```

## Sidebar

Width:

```text
240px - 260px
```

The sidebar should contain:

```text
Dashboard

Catalog
  Products
  Categories
  Collections
  Size & Fit

Inventory

Orders
  All Orders
  Returns
  Refunds

Customers

Marketing
  Coupons
  Promotions
  Banners

Shipping

Payments

Reviews

Analytics

AI Assistant

Settings
```

Sidebar behavior:

- White background
- Subtle right border
- Clear active state
- Compact navigation
- Icons + labels
- Collapsible on desktop
- Drawer navigation on mobile

The active navigation item should use the primary accent color with a subtle tinted background.

Do not use huge icons.

---

# 10. Top Navigation

The topbar should contain:

- Breadcrumb/page context
- Global search
- Notifications
- Admin profile
- Optional quick action button

Example:

```text
Products                         🔍 Search    🔔    Admin ▼
```

Keep the topbar clean.

Do not overload it with controls.

---

# 11. Page Header

Every major page should have a consistent header.

Example:

```text
Products

Manage apparel products, product photos, sizes, colors, stock, and delivery weights.

                              + Add Product
```

Page headers should contain:

- Title
- Short description when useful
- Primary action
- Optional secondary actions

Keep descriptions short.

---

# 12. Dashboard Layout

The dashboard should use a responsive 12-column grid.

Desktop:

```text
12 columns
```

Recommended spacing:

```text
16px - 24px
```

Top KPI row:

```text
┌──────────┬──────────┬──────────┬──────────┐
│ Revenue  │ Orders   │ AOV      │ Customers│
└──────────┴──────────┴──────────┴──────────┘
```

Below:

```text
┌─────────────────────────────────┬──────────────┐
│                                 │              │
│ Revenue Overview                │ Inventory    │
│                                 │ Alerts       │
│                                 │              │
└─────────────────────────────────┴──────────────┘
```

Then:

```text
┌──────────────────────┬─────────────────────────┐
│ Top Products         │ Sales by Fit            │
│                      │                         │
└──────────────────────┴─────────────────────────┘
```

Then:

```text
┌────────────────────────────────────────────────┐
│ Recent Orders                                  │
└────────────────────────────────────────────────┘
```

Do not create a dashboard where every component has equal visual weight.

The most important information should dominate.

---

# 13. KPI Cards

KPI cards should be compact and informative.

Example:

```text
Total Revenue

₹8,42,500

↑ 12.4%
vs previous month
```

Each KPI card may contain:

- Label
- Main value
- Percentage change
- Comparison period
- Small contextual icon

Use icons sparingly.

Good icons:

- Revenue → Indian rupee
- Orders → Shopping bag
- Customers → Users
- Inventory → Package
- Refunds → Rotate/undo
- Conversion → Trending up

Avoid decorative illustrations.

---

# 14. Charts

Charts should be clean and easy to interpret.

Preferred:

- Line charts
- Area charts
- Bar charts
- Horizontal bar charts
- Donut charts only when appropriate

Avoid:

- 3D charts
- Excessive gradients
- Decorative chart effects
- Unnecessary animation
- Overly colorful charts

## Revenue Chart

Use a single dominant series.

Allow time filters:

```text
7D
30D
90D
12M
```

## Sales by Fit

Use horizontal bars.

Example:

```text
Straight    ███████████████
Slim        ███████████
Skinny      ███████
Relaxed     ████
Bootcut     ██
```

## Size Analytics

Use a bar chart or compact heatmap.

Make size-related analytics easy to scan.

---

# 15. Tables

Tables are a major part of the admin experience.

They should be dense enough to show useful information but never cramped.

Table requirements:

- Clear column headers
- Consistent row height
- Subtle dividers
- Hover state
- Sorting
- Filtering
- Search
- Pagination
- Bulk selection
- Row actions

Recommended row height:

```text
56px - 64px
```

Table hover:

Use a very subtle background change.

Do not create strong colored row backgrounds.

---

# 16. Product Table

Recommended columns:

```text
Product
SKU
Category
Fit
Price
Stock
Status
Updated
Actions
```

Product image should be small and consistent.

Use compact status badges.

Example:

```text
Straight Fit Blue

SKU: ST-BLU-32

₹2,999

14 in stock

● Active
```

---

# 17. Product Images

Product imagery should have a clean presentation.

Use:

- Consistent aspect ratios
- Neutral image containers
- Small border radius
- No excessive image effects

Recommended thumbnail ratio:

```text
1:1
```

Do not let inconsistent image dimensions break table layouts.

---

# 18. Status Badges

Use badges for states.

Examples:

```text
Active
Draft
Archived

Delivered
Processing
Shipped
Cancelled

In Stock
Low Stock
Out of Stock

Paid
Pending
Failed
Refunded
```

Badges should be:

- Small
- Compact
- Semantically colored
- Easy to scan

Do not make badges huge.

---

# 19. Product Form

Product creation should be divided into logical sections.

Example:

```text
Product Information

Basic Information
────────────────────────────

Pricing
────────────────────────────

Media
────────────────────────────

Variants
────────────────────────────

Inventory
────────────────────────────

SEO
────────────────────────────
```

Use a two-column layout where appropriate.

For example:

```text
Product Name
[________________________]

Category
[____________]

Fit
[____________]

Price
[____________]
```

Avoid extremely long single-column forms on desktop.

---

# 20. Variant UI

Variants are a critical part of the product experience.

Use a structured table.

Example:

```text
┌───────┬────────┬──────────┬───────┬────────┐
│ Size  │ Color  │ SKU      │ Stock │ Price  │
├───────┼────────┼──────────┼───────┼────────┤
│ 30    │ Blue   │ BL-30    │ 24    │ ₹2,999 │
│ 32    │ Blue   │ BL-32    │ 14    │ ₹2,999 │
│ 34    │ Blue   │ BL-34    │ 4     │ ₹2,999 │
│ 36    │ Blue   │ BL-36    │ 0     │ ₹2,999 │
└───────┴────────┴──────────┴───────┴────────┘
```

Make low-stock and out-of-stock states visually obvious but not visually overwhelming.

---

# 21. Inventory UI

Inventory should prioritize operational clarity.

Important information:

- Available
- Reserved
- Reorder threshold
- Stock status

Example:

```text
Straight Fit Blue

28   24     Healthy
30   32     Healthy
32   14     Healthy
34    4     Low Stock
36    0     Out of Stock
```

Use compact status indicators.

Avoid giant inventory cards.

---

# 22. Order Management UI

Order pages should prioritize status and actionability.

Order header:

```text
Order #ORD-10482

Delivered

₹5,998

                        Refund
                        More
```

Then:

```text
Customer
────────────────────────────

Items
────────────────────────────

Payment
────────────────────────────

Shipping
────────────────────────────

Order Timeline
────────────────────────────
```

The order timeline should be visually simple.

Use dots and connecting lines rather than large decorative graphics.

---

# 23. Customer UI

Customer pages should feel like CRM screens.

Header:

```text
John Mathew

john@example.com

12 orders
₹38,420 spent
```

Use tabs:

```text
Overview
Orders
Returns
Reviews
Addresses
```

Avoid putting every customer attribute into one giant card.

---

# 24. Forms & Inputs

Inputs should be:

- Clear
- Compact
- Consistent
- Accessible

Height:

```text
40px - 44px
```

Labels should always be visible.

Do not rely only on placeholders.

Use helper text for complex fields.

Validation messages should appear close to the relevant input.

---

# 25. Buttons

Use three levels.

## Primary

Use for the main page action.

Example:

```text
+ Add Product
Create Coupon
Save Changes
```

## Secondary

Use for supporting actions.

Example:

```text
Export
Filter
Cancel
```

## Destructive

Use only for dangerous actions.

Example:

```text
Delete Product
Cancel Order
Reject Return
```

Avoid having multiple visually dominant buttons beside each other.

---

# 26. Modals & Dialogs

Use dialogs for:

- Confirmation
- Quick editing
- Small forms
- Destructive actions

Do not use dialogs for complex multi-step workflows.

Complex operations should have dedicated pages.

Destructive confirmation example:

```text
Delete product?

This action cannot be undone.

[Cancel] [Delete Product]
```

---

# 27. Notifications & Toasts

Use lightweight toast notifications.

Examples:

```text
✓ Product created successfully.

✓ Inventory updated.

✓ Order status updated.

✕ Failed to process refund.
```

Do not make toasts overly large.

---

# 28. Empty States

Every data-heavy page needs a useful empty state.

Example:

```text
No products found

Try changing your filters or add your first product.

[Add Product]
```

Avoid generic:

```text
No data.
```

Empty states should explain what the user can do next.

---

# 29. Loading States

Use skeleton loading states for:

- Tables
- KPI cards
- Charts
- Product grids
- Detail pages

Avoid blank screens or full-page spinners for normal data loading.

---

# 30. Error States

Errors should be understandable.

Example:

```text
Unable to load products

Something went wrong while fetching your products.

[Try Again]
```

Do not expose raw API errors to the user.

Technical details may be logged separately.

---

# 31. Search & Filtering

Search should be fast and prominent.

Product filters:

```text
Category
Fit
Size
Color
Price
Stock
Status
```

Order filters:

```text
Status
Payment
Date
Customer
Amount
```

Customer filters:

```text
Customer type
Orders
Spending
Last active
```

Filters should be removable individually.

Provide a clear "Reset filters" action.

---

# 32. Responsive Design

Desktop is the primary experience, but the interface must work on:

- Desktop
- Laptop
- Tablet
- Mobile

At smaller widths:

- Collapse sidebar
- Convert tables into scrollable or card-based layouts
- Stack form fields
- Reduce chart complexity
- Keep primary actions accessible

Do not simply shrink desktop components.

---

# 33. Dark Mode

Dark mode is optional.

If implemented, it must use a proper semantic dark theme.

Do not reuse the old WattVision dark/neon palette.

Dark mode should use:

- Neutral dark backgrounds
- Neutral surfaces
- Muted borders
- Controlled accent usage

Never use neon cyan as the primary dashboard color.

---

# 34. Apparel-Specific Visual Language

Use product imagery and category-specific product fields to make the admin useful for tees and bottoms.

Use apparel product context subtly through:

- Product photography
- Fit labels
- Material, print, and pattern details
- Size indicators
- Inventory visualization
- Product thumbnails

Do not turn the admin dashboard into a fashion landing page.

The apparel identity should come from product data and photography, not decorative clothing textures or a category-specific color palette.

Avoid:

- Fabric textures used as interface backgrounds
- Stitching patterns
- Clothing-shaped UI elements
- Excessive blue
- Fashion-magazine layouts

This is an operations dashboard first.

---

# 35. Iconography

Use one consistent icon library throughout the application.

Preferred style:

- Simple
- Outline-based
- 16px to 20px
- Consistent stroke width

Use icons from the project's existing icon library where available.

Do not mix multiple icon styles.

Do not use emoji as UI icons.

Icons should support comprehension rather than decoration.

---

# 36. Data Visualization Rules

Charts must communicate information clearly.

Rules:

- Always include meaningful labels
- Avoid unnecessary legends
- Use consistent units
- Format currency as INR
- Format large numbers consistently
- Use tooltips for detailed values
- Avoid excessive colors
- Maintain consistent colors for the same metric

Example:

Revenue should always use the same visual identity throughout the application.

---

# 37. Currency & Number Formatting

The store operates using Indian Rupees.

Use:

```text
₹2,999
₹24,999
₹8,42,500
```

Use Indian number grouping.

Examples:

```text
1,000
10,000
1,00,000
10,00,000
```

Do not use:

```text
$2,999
2.999,00
```

unless a future multi-currency feature explicitly requires it.

---

# 38. Accessibility

The UI must follow accessibility best practices.

Requirements:

- Keyboard navigation
- Visible focus states
- Proper labels
- Semantic HTML
- Accessible dialogs
- Accessible tables
- Sufficient color contrast
- Do not rely on color alone to communicate status
- Screen-reader-friendly controls

For example:

Do not represent low stock only with red.

Use:

```text
⚠ Low Stock
```

alongside the color.

---

# 39. Animation

Animations should be subtle.

Use animation for:

- Sidebar transitions
- Dropdowns
- Dialogs
- Toasts
- Hover states
- Loading transitions

Avoid:

- Large page transitions
- Bouncing cards
- Constant animations
- Decorative motion

The interface should feel fast.

---

# 40. Design Consistency

All pages must feel like the same product.

Maintain consistent:

- Navigation
- Typography
- Buttons
- Inputs
- Cards
- Tables
- Status badges
- Spacing
- Icons
- Colors
- Interaction patterns

Do not design each page independently.

If a pattern already exists, reuse it.

---

# 41. Design Priority

When making UI decisions, follow this priority:

```text
Usability
    ↓
Clarity
    ↓
Consistency
    ↓
Accessibility
    ↓
Visual polish
    ↓
Decoration
```

Never sacrifice usability for visual effects.

---

# 42. Do's

- Use clean white surfaces
- Use subtle borders
- Use a restrained accent color
- Keep tables highly usable
- Make important metrics immediately visible
- Use consistent status colors
- Use real product imagery
- Make inventory states obvious
- Use compact controls
- Keep forms organized
- Provide loading, empty and error states
- Use realistic commerce data
- Keep the dashboard visually calm

---

# 43. Don'ts

- Do not use the old WattVision electrical dashboard design
- Do not use neon cyan as the primary color
- Do not use dark backgrounds by default
- Do not use electrical/ray/power icons
- Do not use electric-consumption terminology
- Do not use Bolivian Bolivianos (`Bs.`)
- Do not use Power BI-style visual overload
- Do not use excessive gradients
- Do not use glassmorphism everywhere
- Do not use huge rounded cards
- Do not use emoji as UI icons
- Do not use decorative fabric textures
- Do not make every component look like a card
- Do not create fake analytics
- Do not prioritize aesthetics over functionality

---

# 44. Core Design Principle

The dashboard should answer three questions immediately:

### 1. What is happening?

Revenue, orders, customers, inventory, payments.

### 2. What needs attention?

Low stock, failed payments, pending orders, returns, refunds, delivery problems.

### 3. What should I do next?

Add inventory, process orders, review returns, create promotions, investigate product performance.

The interface should make those answers obvious without requiring the admin to hunt through the application.

**Build a commerce operations dashboard, not a decorative analytics dashboard.**
