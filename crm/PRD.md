# Syntrix CRM - Product Requirements Document

A modern dark-themed CRM web panel for managing Telegram bot operations, providing comprehensive analytics, user management, financial tracking, and marketing tools.

**Experience Qualities**:
1. **Professional** - Enterprise-grade interface that conveys trust and reliability through clean layouts and precise data presentation
2. **Efficient** - Quick access to critical metrics and actions through well-organized navigation and smart data visualization
3. **Sophisticated** - Modern dark aesthetic with refined micro-interactions that feel premium and polished

**Complexity Level**: Complex Application (advanced functionality, accounts)
- Multi-page dashboard with authentication, role-based access, comprehensive data tables, multiple chart types, and internationalization across 3 languages

## Essential Features

### Authentication System
- **Functionality**: Secure login with email/username and password
- **Purpose**: Protect sensitive business and user data from unauthorized access
- **Trigger**: User navigates to application root
- **Progression**: Login screen → Enter credentials → Validate → Redirect to Analytics Dashboard
- **Success criteria**: User successfully authenticates and is redirected; invalid credentials show clear error messages

### Analytics Dashboard
- **Functionality**: Display KPI cards and financial/geographic charts
- **Purpose**: Provide at-a-glance business health metrics and trends
- **Trigger**: Successful login or clicking "Analytics" in sidebar
- **Progression**: Load dashboard → Display KPI cards (users, balance, deposits, withdrawals, profit) → Render financial dynamics chart → Show geographic distribution chart
- **Success criteria**: All metrics display correctly, charts render with mock data, updates reflect selected time period

### User Management
- **Functionality**: Searchable, filterable, sortable table of all users with detailed profiles
- **Purpose**: Enable admin to track, search, and manage user accounts efficiently
- **Trigger**: Click "Users" in sidebar
- **Progression**: Load users table → Apply search/filters → Click user row → View detailed modal → Close or edit
- **Success criteria**: Table displays all columns, search works instantly, filters apply correctly, pagination functions, modal shows complete user details

### Geographic Data
- **Functionality**: Country-based user distribution visualization
- **Purpose**: Understand market penetration and geographic performance
- **Trigger**: Click "Geo Data" in sidebar
- **Progression**: Load geo view → Display country table → Render donut chart → Export CSV option
- **Success criteria**: Countries listed with user counts, chart visualizes distribution, CSV export works

### Deposit Tracking
- **Functionality**: Comprehensive deposit transaction log with status tracking
- **Purpose**: Monitor incoming payments and conversion funnel
- **Trigger**: Click "Deposits" in Finance category
- **Progression**: Load deposits → Display transactions with statuses (Paid/FTD/Withdrawn) → Filter by status → Search by user
- **Success criteria**: All deposits shown with complete metadata, filtering works, status badges clearly visible

### Withdrawal Management
- **Functionality**: Withdrawal request queue with approval workflow
- **Purpose**: Process user payout requests efficiently
- **Trigger**: Click "Withdrawals" in Finance category
- **Progression**: Load withdrawals → View pending requests → Update status (Pending/Successful/Declined) → Process
- **Success criteria**: Requests display in queue, status changes persist, date/time accurate

### Expense Tracking
- **Functionality**: Admin expense log for business operations
- **Purpose**: Track operational costs and maintain financial records
- **Trigger**: Click "Expenses" in Finance category
- **Progression**: Load expenses → View categorized expenses → Add new expense → Submit
- **Success criteria**: Expenses listed chronologically, categories clear, totals calculated

### Referral Links Management
- **Functionality**: Track performance of all marketing referral links
- **Purpose**: Measure ROI of different traffic sources and campaigns
- **Trigger**: Click "Referral Links" in Marketing category
- **Progression**: Load links → Display performance metrics (clicks, registrations, deposits, revenue) → Sort by performance
- **Success criteria**: All links shown with complete funnel metrics, sortable by any metric

### Link Builder
- **Functionality**: Generate UTM-tagged referral links with custom parameters
- **Purpose**: Create trackable marketing links for campaigns
- **Trigger**: Click "Link Builder" in Marketing category
- **Progression**: Open builder → Select source → Add SubID parameters (up to 5) → Generate → Copy link
- **Success criteria**: Generated link contains all parameters, copyable, validates correctly

### Internationalization
- **Functionality**: Switch between EN/RU/UA languages
- **Purpose**: Support international team and multi-market operations
- **Trigger**: Language selector in header/sidebar
- **Progression**: Click language → UI instantly updates → All text translates → Preference persists
- **Success criteria**: Complete translation coverage, instant switching, no missing keys, persists across sessions

## Edge Case Handling

- **Empty States**: Show helpful messages and illustrations when tables/charts have no data with clear call-to-action
- **Loading States**: Display skeleton loaders for tables and shimmer effects for cards during data fetch
- **Network Errors**: Show toast notifications for API failures with retry options
- **Invalid Form Data**: Real-time validation with inline error messages below inputs
- **Session Expiry**: Redirect to login with message, preserve intended destination
- **Large Datasets**: Implement virtual scrolling or server-side pagination for 1000+ rows
- **Export Failures**: Show progress indicators and error states for CSV generation
- **Browser Compatibility**: Graceful degradation for older browsers, detect and warn
- **Responsive Breakpoints**: Collapse sidebar to hamburger menu on tablet/mobile

## Design Direction

The interface should evoke a sense of sophisticated professionalism through a dark, premium aesthetic - think high-end analytics platforms like Grafana or modern trading dashboards - with clean data visualization, subtle depth through layering, and purposeful use of accent colors to highlight critical actions and metrics, balancing information density with breathing room.

## Color Selection

Custom dark palette - carefully selected colors that work harmoniously in a dark interface while maintaining excellent readability and creating visual hierarchy through strategic use of vibrant accents.

- **Primary Color**: Deep electric blue `oklch(0.55 0.22 250)` - represents technology, trust, and primary actions; used for main CTAs and active states
- **Secondary Colors**: 
  - Dark slate background `oklch(0.15 0.01 250)` - primary surface color
  - Elevated card gray `oklch(0.20 0.01 250)` - secondary surface with subtle lift
  - Muted blue-gray `oklch(0.35 0.02 250)` - tertiary elements and dividers
- **Accent Color**: Vibrant cyan `oklch(0.70 0.18 200)` - for highlights, success states, and drawing attention to key metrics
- **Foreground/Background Pairings**:
  - Background (Dark Slate #1A1D29): White text (#F8F9FA) - Ratio 14.8:1 ✓
  - Card (Elevated Gray #22252F): White text (#F8F9FA) - Ratio 13.2:1 ✓
  - Primary (Electric Blue #2563EB): White text (#FFFFFF) - Ratio 4.8:1 ✓
  - Secondary (Muted Gray #3F4456): Light gray text (#E5E7EB) - Ratio 5.2:1 ✓
  - Accent (Vibrant Cyan #06B6D4): Dark text (#0F172A) - Ratio 8.5:1 ✓
  - Muted (Charcoal #2D3142): Medium gray text (#9CA3AF) - Ratio 4.6:1 ✓

## Font Selection

Typography should convey modernity and precision - clean, geometric sans-serifs that maintain excellent legibility at small sizes for data-dense tables while looking sophisticated in larger headings.

- **Primary Font**: Inter (body text, UI elements, tables) - exceptional legibility, designed for screens
- **Secondary Font**: JetBrains Mono (numeric data, IDs, codes) - monospaced clarity for technical information

- **Typographic Hierarchy**:
  - H1 (Page Titles): Inter SemiBold / 28px / -0.02em tracking / leading-tight
  - H2 (Section Headers): Inter SemiBold / 20px / -0.01em tracking / leading-snug  
  - H3 (Card Titles): Inter Medium / 16px / normal tracking / leading-normal
  - Body (Table Data): Inter Regular / 14px / normal tracking / leading-relaxed
  - Small (Meta Info): Inter Regular / 12px / 0.01em tracking / leading-normal
  - Code (IDs/Numbers): JetBrains Mono Regular / 14px / normal tracking / leading-normal

## Animations

Animations should feel instant and responsive - micro-transitions that provide feedback without creating delays, with slightly longer, more noticeable animations reserved for major state changes like page navigation or modal appearances.

- **Purposeful Meaning**: Use motion to indicate relationships (modal slides from clicked element), state changes (status badge color transitions), and system feedback (button press, successful action confirmation)
- **Hierarchy of Movement**:
  - Critical feedback (button states, toggles): 100-150ms
  - Data updates (chart transitions, table row additions): 200-300ms
  - Navigation (page transitions, modal open/close): 300ms with ease-out
  - Ambient motion (hover effects, subtle pulses): 200ms with ease-in-out

## Component Selection

- **Components**:
  - **Sidebar**: shadcn Sidebar component with collapsible groups for category organization (Analytics, Finance, Marketing)
  - **Card**: Base card for KPI metrics with custom gradient backgrounds and icon badges
  - **Table**: shadcn Table with custom dark styling, sortable headers, and row hover states
  - **Dialog**: For user detail modal, expense creation, and confirmations
  - **Button**: Primary (filled blue), Secondary (outlined), Ghost (icon-only) variants
  - **Input**: Dark-themed inputs with focus rings and inline validation
  - **Select**: Dropdown for filters, language switcher, period selection
  - **Badge**: Status indicators for payment states (Paid/FTD/Withdrawn/Pending)
  - **Tabs**: For switching between chart views on dashboard
  - **Tooltip**: Info badges for metric explanations
  - **Sonner Toast**: Success/error notifications for actions

- **Customizations**:
  - Custom chart color scheme matching dark theme using Recharts
  - Gradient KPI cards with phosphor icons and animated counters
  - Custom table row expansion for nested transaction details
  - Language switcher component with flag icons
  - Search input with debounce and keyboard shortcuts (Cmd+K)

- **States**:
  - **Buttons**: Default, Hover (slight scale + brightness), Active (pressed down), Disabled (50% opacity)
  - **Inputs**: Default, Focus (blue ring), Error (red ring), Success (green checkmark), Disabled
  - **Table Rows**: Default, Hover (subtle background lift), Selected (blue tint), Loading (skeleton)
  - **Charts**: Loading (animated skeleton), Populated, Empty (illustration), Error state

- **Icon Selection**:
  - ChartLine (Analytics), Users (Users), Globe (Geo Data)
  - ArrowDownCircle (Deposits), ArrowUpCircle (Withdrawals), Receipt (Expenses)
  - Link (Referral Links), PencilRuler (Link Builder)
  - MagnifyingGlass (Search), Funnel (Filter), Download (Export)
  - Check (Success), X (Error), Clock (Pending)

- **Spacing**:
  - Container padding: `p-6` (24px)
  - Card padding: `p-5` (20px)
  - Element gaps: `gap-4` (16px) for related items, `gap-6` (24px) for sections
  - Table cell padding: `px-4 py-3` (16px horizontal, 12px vertical)
  - Button padding: `px-4 py-2` for medium, `px-6 py-3` for large

- **Mobile**:
  - Sidebar collapses to bottom navigation bar on mobile
  - KPI cards stack vertically from 4-column grid on desktop
  - Tables switch to card-list view with key information
  - Charts maintain aspect ratio but stack instead of side-by-side
  - Forms go full-width with larger touch targets (min 44px)
  - Modals become full-screen sheets on mobile
