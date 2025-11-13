# Planning Guide

A modern cryptocurrency trading bot platform called SYNTRIX that inspires trust through bold, sophisticated design with white, black, and dark blue tones, creating a premium and authoritative experience for automated trading.

**Experience Qualities**: 
1. **Authoritative** - Bold design with strong contrast and dark blue accents that communicate premium quality and expertise
2. **Sophisticated** - Clean white space with strategic use of black and deep blue that feels refined and intentional
3. **Trustworthy** - Professional color palette and clear information hierarchy that inspires confidence in automated trading

**Complexity Level**: Light Application (multiple features with basic state)
  - The platform showcases bot features, pricing plans, and user testimonials with interactive elements for demonstration purposes, without requiring complex backend integration

## Essential Features

### Hero Section with Value Proposition
- **Functionality**: Displays main headline, subheadline, and primary CTA button
- **Purpose**: Immediately communicates the platform's value and encourages user action
- **Trigger**: Page load
- **Progression**: User lands on page → Reads compelling headline about automated trading → Sees trust indicators → Clicks "Get Started" CTA
- **Success criteria**: Clear value proposition visible above fold with prominent CTA

### Trading Bot Features Showcase
- **Functionality**: Grid or card layout displaying key bot capabilities (automated trading, risk management, 24/7 monitoring, etc.)
- **Purpose**: Educates users about platform capabilities and builds confidence
- **Trigger**: User scrolls past hero section
- **Progression**: User scrolls → Views feature cards with icons → Reads brief descriptions → Understands value proposition
- **Success criteria**: 4-6 feature cards with icons, headings, and descriptions presented in clean grid

### Profit Calculator
- **Functionality**: Interactive calculator allowing users to estimate potential trading profits based on investment amount and time period
- **Purpose**: Demonstrates value proposition through personalized calculations and engages users with interactive element
- **Trigger**: User scrolls to calculator section or clicks calculator navigation
- **Progression**: User enters investment amount → Selects time period → Sees calculated potential profit → Understands bot's value → Clicks CTA
- **Success criteria**: Input field for investment amount, time period selector, real-time calculation display with visual feedback

### Statistics/Metrics Display
- **Functionality**: Shows key platform metrics (users, trading volume, success rate, etc.)
- **Purpose**: Builds credibility through social proof and performance data
- **Trigger**: User scrolls to statistics section
- **Progression**: User views animated counters → Sees impressive metrics → Builds trust in platform
- **Success criteria**: 3-4 key metrics with large numbers and brief labels displayed prominently

### FAQ Section
- **Functionality**: Collapsible accordion with common questions and answers
- **Purpose**: Addresses user concerns and reduces friction in decision-making
- **Trigger**: User scrolls to FAQ or has questions
- **Progression**: User browses questions → Clicks to expand → Reads answer → Finds clarity
- **Success criteria**: 5-8 common questions with expandable answers using accordion component

### Multi-Language Support
- **Functionality**: Language selector dropdown allowing users to switch between English, German, Spanish, French, Portuguese, and Dutch
- **Purpose**: Makes platform accessible to international users and expands market reach
- **Trigger**: User clicks language selector in header
- **Progression**: User opens language dropdown → Selects preferred language → All interface text updates → Selection persists across sessions
- **Success criteria**: Language selector in header, all user-facing text translates instantly, preference saved using useKV for persistence

## Edge Case Handling
- **Mobile Responsiveness**: Layout adapts gracefully to smaller screens with stacked sections and touch-friendly buttons
- **Long Content**: Text truncation or scrollable areas prevent layout breaking on verbose content
- **Missing Data**: Placeholder content or graceful fallbacks for any dynamic sections
- **Slow Connections**: Content appears progressively rather than leaving blank spaces during load

## Design Direction
The design should feel bold, futuristic, and premium - inspired by crypto.com's aesthetic with a deep dark blue background and vibrant electric blue accents. The dark theme creates an immersive, technology-forward experience that evokes the cutting-edge world of cryptocurrency trading. The interface should feel sophisticated, modern, and trustworthy with dynamic animations that bring energy and life to the platform.

## Color Selection
Dark theme with vibrant blue accents inspired by crypto.com, creating a premium cryptocurrency platform aesthetic with high contrast and modern appeal.

- **Primary Color**: Electric Blue (oklch(0.55 0.25 240)) - Vibrant and energetic, representing innovation and cryptocurrency; used for primary CTAs and key interactive elements
- **Secondary Colors**: Dark Navy Card (oklch(0.16 0.04 252)) for elevated surfaces and cards; Darker Navy (oklch(0.20 0.04 252)) for secondary elements
- **Accent Color**: Bright Blue (oklch(0.62 0.28 235)) for hover states, attention-drawing elements, and highlights that pop against the dark background
- **Foreground/Background Pairings**:
  - Background (Deep Navy oklch(0.12 0.04 252)): Light text (oklch(0.98 0.01 252)) - Ratio 14.5:1 ✓
  - Card (Dark Navy oklch(0.16 0.04 252)): Light text (oklch(0.98 0.01 252)) - Ratio 12.8:1 ✓
  - Primary (Electric Blue oklch(0.55 0.25 240)): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓
  - Secondary (Darker Navy oklch(0.20 0.04 252)): Light text (oklch(0.98 0.01 252)) - Ratio 11.5:1 ✓
  - Accent (Bright Blue oklch(0.62 0.28 235)): White text (oklch(1 0 0)) - Ratio 4.8:1 ✓
  - Muted (Medium Navy oklch(0.22 0.03 252)): Muted text (oklch(0.65 0.02 252)) - Ratio 4.5:1 ✓

## Font Selection
Typography should feel modern, professional, and highly legible - conveying technological sophistication while remaining accessible. Inter font family provides the geometric precision and readability needed for a fintech platform.

- **Typographic Hierarchy**:
  - H1 (Hero Title): Inter Bold/48px/tight (-0.02em) - Commands attention
  - H2 (Section Headers): Inter Semibold/36px/tight - Clearly delineates sections
  - H3 (Feature Titles): Inter Semibold/24px/normal - Feature and card headings
  - Body (Descriptions): Inter Regular/16px/relaxed (1.6) - Comfortable reading
  - Small (Captions/Labels): Inter Regular/14px/normal - Supplementary information
  - Button Text: Inter Medium/16px/normal - Clear actionable text

## Animations
Animations should feel dynamic, fluid, and energetic - bringing the dark interface to life with smooth transitions and eye-catching effects. The motion design should reflect the fast-paced, technology-driven nature of cryptocurrency trading while maintaining elegance and purpose. More elaborate background animations with moving particles, waves, and glowing orbs create an immersive, futuristic atmosphere.

- **Purposeful Meaning**: Dynamic particle networks and flowing waves communicate the interconnected nature of blockchain; smooth color transitions create depth; pulsing glows suggest activity and energy
- **Hierarchy of Movement**: Background features complex multi-layered animations with particles, waves, and gradient orbs moving at different speeds; Primary CTAs have vibrant glow effects on hover; Cards lift with enhanced shadows; Statistics animate with smooth count-ups; Floating particles traverse the screen creating depth

## Component Selection
- **Components**: 
  - Button (primary CTAs with hover states)
  - Card (feature showcases, calculator container, testimonials)
  - Badge (highlights and labels)
  - Accordion (FAQ section)
  - Separator (section dividers)
  - Input (calculator investment amount input)
  - Select (time period dropdown for calculator)
  - Avatar (testimonial authors or team members)
- **Customizations**: 
  - Hero section with gradient overlay on background
  - Animated counter components for statistics using framer-motion
  - Feature grid with custom hover effects
  - Interactive profit calculator with real-time calculations and visual result display
- **States**: 
  - Buttons: default (sky blue), hover (darker blue with subtle lift), active (pressed down), disabled (muted gray)
  - Cards: default (subtle shadow), hover (elevated shadow + slight scale)
  - Accordion items: collapsed (arrow down), expanded (arrow up, smooth height transition)
- **Icon Selection**: 
  - Robot/Bot icon for trading automation features
  - ChartLine/TrendUp for performance metrics
  - Shield/Lock for security features
  - Lightning/Zap for speed features
  - Clock for 24/7 monitoring
  - Users for community/user count
- **Spacing**: 
  - Section padding: py-20 lg:py-28 (generous vertical breathing room)
  - Container max-width: max-w-6xl mx-auto (comfortable reading width)
  - Grid gaps: gap-8 lg:gap-12 (clear visual separation)
  - Card padding: p-6 lg:p-8 (comfortable internal spacing)
  - Button padding: px-8 py-3 (easily clickable)
- **Mobile**: 
  - Hero text scales down (text-4xl on mobile → text-6xl on desktop)
  - Feature grid: 1 column mobile → 2 columns tablet → 3 columns desktop
  - Pricing cards: stacked on mobile → side-by-side on tablet/desktop
  - Statistics: 2-column grid mobile → 4 columns desktop
  - Navigation: hamburger menu on mobile → full navigation on desktop
  - Reduced padding on mobile (py-12 mobile → py-20 desktop)
