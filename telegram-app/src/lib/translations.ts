// Translation system for Syntrix app
// Note: Full FAQ/Security/Whitepaper content removed due to TypeScript compilation limits
// Only essential UI translations are included

import { englishWhitepaperContent, germanWhitepaperContent } from './whitepaperContent'

type FAQItem = { question: string; answer: string | string[] }
type FAQSection = { title: string; items: FAQItem[] }

const englishFAQSections: FAQSection[] = [
  {
    title: '1. General Information',
    items: [
      {
        question: 'What is Syntrix and how does it operate?',
        answer:
          'Syntrix is a Telegram-based trading bot that executes institutional strategies across major crypto exchanges, giving you hands-off exposure to automated trading.'
      },
      {
        question: 'Do I need trading experience to use Syntrix?',
        answer: 'No. Just choose a plan, fund the bot, and it handles the rest with proven algorithms.'
      },
      {
        question: 'Is Syntrix available worldwide and secure?',
        answer: 'Yes. It operates in jurisdictions where crypto is legal and protects funds with encrypted wallets plus a large liquidity reserve.'
      }
    ]
  },
  {
    title: '2. Deposits & Wallet',
    items: [
      {
        question: 'Which currencies are supported for deposits?',
        answer: 'USDT, USDC, Bitcoin, Ethereum, Solana, and other major tokens. Deposits are instantly converted to USDT for trading.'
      },
      {
        question: 'How fast are deposits activated?',
        answer: 'Funds arrive within seconds once the blockchain confirms the transaction and are available to the bot almost immediately.'
      },
      {
        question: 'Can Syntrix be used as a wallet?',
        answer: 'Absolutely. Your capital stays accessible, accrues passive income, and can be withdrawn at any time.'
      }
    ]
  },
  {
    title: '3. Profit & Risk Management',
    items: [
      {
        question: 'What returns should I expect?',
        answer: 'Daily returns range from 0.5% to 7% depending on the plan, with compounding increasing long-term growth.'
      },
      {
        question: 'How is risk controlled?',
        answer: 'Each trade risks no more than 1% of your deposit, and 25% of profits are parked in a reserve pool to cover drawdowns.'
      }
    ]
  },
  {
    title: '4. Withdrawals',
    items: [
      {
        question: 'How long do withdrawals take?',
        answer: 'The bot processes withdrawals in about 3 seconds, plus network time; most transactions complete in under a minute.'
      },
      {
        question: 'Are there any hidden fees?',
        answer: 'No. Syntrix itself does not charge fees—only the blockchain network fee applies.'
      }
    ]
  },
  {
    title: '5. Referral Program',
    items: [
      {
        question: 'How does the referral program work?',
        answer: 'You earn 4% / 3% / 2% from three levels of referrals, for up to 9% passive income on referral profits.'
      },
      {
        question: 'When do I receive referral bonuses?',
        answer: 'Referral payouts are distributed daily alongside your regular plan profits.'
      }
    ]
  },
  {
    title: '6. Support & Compliance',
    items: [
      {
        question: 'Is Syntrix regulated?',
        answer: 'It is registered in Dubai as Syntrix Algo Systems LLC and operates under compliant guidelines for algorithmic trading.'
      },
      {
        question: 'How can I reach support?',
        answer: 'Use the in-app Support button or Telegram support channel for 24/7 assistance.'
      }
    ]
  }
]

const germanFAQSections: FAQSection[] = [
  {
    title: '1. Allgemeine Informationen',
    items: [
      {
        question: 'Was ist Syntrix und wie funktioniert es?',
        answer:
          'Syntrix ist ein Telegram-Trading-Bot, der institutionelle Strategien auf großen Krypto-Börsen ausführt und automatisiertes Trading ohne manuelle Eingriffe liefert.'
      },
      {
        question: 'Benötige ich Handelserfahrung?',
        answer: 'Nein. Wähle einfach einen Plan aus, zahle ein, und der Bot übernimmt den Trading-Alltag für dich.'
      },
      {
        question: 'Ist Syntrix sicher und weltweit verfügbar?',
        answer: 'Ja. Die Plattform ist in allen Ländern nutzbar, in denen Krypto legal ist, und schützt Gelder mit verschlüsselten Wallets und einer großen Liquiditätsreserve.'
      }
    ]
  },
  {
    title: '2. Einzahlungen & Wallet',
    items: [
      {
        question: 'Welche Währungen werden unterstützt?',
        answer: 'USDT, USDC, Bitcoin, Ethereum, Solana und weitere große Tokens. Einzahlungen werden für den Handel automatisch in USDT umgewandelt.'
      },
      {
        question: 'Wie schnell sind Einzahlungen aktiv?',
        answer: 'Sobald die Blockchain bestätigt, sind die Mittel innerhalb von Sekunden verfügbar und der Bot beginnt sofort mit dem Trading.'
      },
      {
        question: 'Kann ich Syntrix als Wallet nutzen?',
        answer: 'Ja. Dein Kapital bleibt zugänglich, erzielt passives Einkommen und kann jederzeit abgehoben werden.'
      }
    ]
  },
  {
    title: '3. Rendite & Risikomanagement',
    items: [
      {
        question: 'Welche Renditen kann ich erwarten?',
        answer: 'Tägliche Renditen liegen je nach Plan zwischen 0,5 % und 7 %, wobei Reinvestitionen das Wachstum noch beschleunigen.'
      },
      {
        question: 'Wie wird das Risiko kontrolliert?',
        answer: 'Jeder Trade riskiert maximal 1 % des Kapitals, zudem sind 25 % der Gewinne in einem Reservepool geparkt, um Drawdowns abzufedern.'
      }
    ]
  },
  {
    title: '4. Auszahlungen',
    items: [
      {
        question: 'Wie schnell erfolgen Auszahlungen?',
        answer: 'Der Bot verarbeitet Auszahlungen in etwa 3 Sekunden plus Netzwerklaufzeit; meistens ist die Auszahlung in unter einer Minute abgeschlossen.'
      },
      {
        question: 'Gibt es versteckte Gebühren?',
        answer: 'Nein. Syntrix erhebt keine eigenen Gebühren – nur die übliche Blockchain-Transaktionsgebühr fällt an.'
      }
    ]
  },
  {
    title: '5. Empfehlungsprogramm',
    items: [
      {
        question: 'Wie funktioniert das Empfehlungsprogramm?',
        answer: 'Du verdienst 4 % / 3 % / 2 % aus drei Ebenen deiner Empfehlungen, für bis zu 9 % passives Einkommen auf deren Gewinne.'
      },
      {
        question: 'Wann werden Boni ausgezahlt?',
        answer: 'Empfehlungsboni werden täglich zusammen mit deinen regulären Plangewinnen ausgeschüttet.'
      }
    ]
  },
  {
    title: '6. Support & Compliance',
    items: [
      {
        question: 'Ist Syntrix reguliert?',
        answer: 'Syntrix ist in Dubai als Syntrix Algo Systems LLC registriert und hält Compliance-Standards für algorithmisches Trading ein.'
      },
      {
        question: 'Wie erreiche ich den Support?',
        answer: 'Nutze die Support-Schaltfläche im Bot oder den Telegram-Support-Kanal für 24/7 Hilfe.'
      }
    ]
  }
]

const englishFAQPlans = [
  'Bronze Plan: $10–$99 (0.5% daily)',
  'Silver Plan: $100–$499 (1% daily)',
  'Gold Plan: $500–$999 (2% daily)',
  'Platinum Plan: $1000–$4999 (3% daily)',
  'Diamond Plan: $5000–$19999 (5% daily)',
  'Black Plan: $20000–$100000 (7% daily)',
  'Custom plans: deposits > $100,000 (8%+ daily)'
]

const germanFAQPlans = [
  'Bronze-Plan: $10–$99 (0,5 % täglich)',
  'Silber-Plan: $100–$499 (1 % täglich)',
  'Gold-Plan: $500–$999 (2 % täglich)',
  'Platin-Plan: $1000–$4999 (3 % täglich)',
  'Diamond-Plan: $5000–$19999 (5 % täglich)',
  'Black-Plan: $20000–$100000 (7 % täglich)',
  'Sonderpläne: Einzahlungen über $100.000 (8 %+ täglich)'
]

export const translations = {
  ENGLISH: {
    appTitle: 'Syntrix Bot',
    wallet: 'Wallet',
    invite: 'Invite',
    home: 'Home',
    calculator: 'Calculator',
    profile: 'Profile',
    totalBalance: 'Total Balance:',
    profit: 'Profit:',
    deposit: 'Deposit:',
    reinvest: 'REINVEST',
    depositBtn: 'DEPOSIT',
    inactive: 'INACTIVE',
    leftUntilBronze: 'left until Bronze',
    incomePlans: 'INCOME PLANS',
    dailyUpdate: 'DAILY UPDATE',
    noEarningsData: 'No earnings data',
    walletComingSoon: 'Wallet functionality coming soon',
    manageYourBalance: 'MANAGE YOUR BALANCE',
    availableBalance: 'Available balance:',
    howToDeposit: 'How to Deposit',
    withdraw: 'WITHDRAW',
    howToWithdraw: 'How to Withdraw',
    transactionsHistory: 'TRANSACTIONS HISTORY',
    noTransactionsYet: 'No transactions yet',
    inviteFriends: 'Invite friends to join',
    referralBalance: 'Referral Balance:',
    yourReferralLink: 'YOUR REFERRAL LINK',
    termsOfTheProgram: 'TERMS OF THE PROGRAM',
    friendDeposit: 'Friend deposit',
    earnings: 'Earnings',
    friendOfAFriend: 'Friend of a friend',
    thirdLevel: 'Third level',
    yourReferrals: 'YOUR REFERRALS',
    noReferralsYet: 'No referrals yet',
    linkCopied: 'Link copied to clipboard',
    calculateYourProfit: 'CALCULATE YOUR PROFIT',
    depositAmount: 'Deposit Amount',
    enterAmount: 'Enter amount',
    timePeriodSelection: 'Time period selection',
    enterDays: 'Enter days',
    reinvestToggle: 'Reinvest',
    profitText: 'Profit:',
    summary: 'Summary',
    totalProfit: 'TOTAL PROFIT:',
    totalFunds: 'TOTAL FUNDS:',
    leaderboard: 'Leaderboard',
    accountBalance: 'Account Balance:',
    referralEarnings: 'Referral Earnings:',
    totalReferrals: 'Total Referrals:',
    welcome: 'Welcome to Syntrix',
    websiteLink: 'Website',
    verifyWithSyntrix: 'Verify with Syntrix',
    languageChanged: 'Language changed to',
    idCopied: 'ID copied to clipboard',
    back: 'Back',
    selectCurrency: 'Select Currency',
    enterAmountDollar: 'Enter amount $',
    continue: 'CONTINUE',
    faqTitle: 'SYNTRIX — FAQ',
    faqSubtitle: 'Frequently Asked Questions',
    faqDescription: 'Get answers to common questions about Syntrix',
    securityTitle: 'Security',
    whitepaperTitle: 'SYNTRIX WhitePaper',
    withdrawTitle: 'WITHDRAW PROFITS',
    incomePlansTitle: 'Income Plans',
    tableDeposit: 'Deposit',
    tableDailyProfit: 'Daily Profit',
    advantagesTitle: 'Advantages',
    advantagesSubtitle: 'Why Choose Syntrix',
    advantagesDescription: 'Discover the unique benefits that make Syntrix the best choice for crypto investors',
    
    // Basic content placeholders (full content removed to reduce file size)
    securitySubtitle: 'Syntrix Security',
    securityDescription: 'Multi-level protection for your investments and peace of mind',
    whitepaperContent: englishWhitepaperContent,
    faqIntro: 'Find answers to the most common questions about Syntrix and get started faster.',
    faqSections: englishFAQSections,
    faqPlansTitle: 'Income Plans',
    faqPlans: englishFAQPlans,
    
    advantage1Title: '1. Fully Automated Trading',
    advantage1Text1: '• Trades 24/7 without user intervention',
    advantage1Text2: '• Uses Smart Money Concepts and institutional risk management strategies',
    advantage1Text3: '• No need to monitor charts or make manual decisions',
    advantage1Text4: '• Generates passive income reliably with minimal effort',
    
    advantage2Title: '2. High Success Rate and Profitability',
    advantage2Text1: '• 90%+ success rate based on 5-10 years of tested strategies',
    advantage2Text2: '• Risk/Reward ratio is always at least 1:5',
    advantage2Text3: '• Daily profit potential ranges from 1% to 11% depending on your subscription plan',
    advantage2Text4: '• Advanced algorithms enable consistent gains even in volatile markets',
    
    advantage3Title: '3. Maximum Security and Capital Protection',
    advantage3Text1: '• Client funds are encrypted and inaccessible to the team',
    advantage3Text2: '• Liquidity reserve pool (25% of profits) ensures all deposits and profits are protected from losses',
    advantage3Text3: '• Maximum risk per trade is 1% of your deposit',
    advantage3Text4: '• Multi-layered security implemented on servers and within Telegram',
    advantage3Text5: '• Even in rare technical failures or black swan events, capital is fully protected',
    
    advantage4Title: '4. Instant Withdrawals',
    advantage4Text1: '• Withdrawals processed by the bot in 3 seconds, plus network time',
    advantage4Text2: '• Funds are always available; no lockups or waiting periods',
    advantage4Text3: '• Supports withdrawals in USDT or USDC, ensuring stability against market volatility',
    
    advantage5Title: '5. Complete Transparency',
    advantage5Text1: '• All trades and profits are trackable',
    advantage5Text2: '• Full visibility ensures no hidden operations',
    advantage5Text3: '• Users can request transaction verification',
    
    advantage6Title: '6. Licensed and Regulated',
    advantage6Text1: '• Operates under Syntrix Algo Systems LLC, Dubai',
    advantage6Text2: '• Licensed for algorithmic crypto trading bots',
    advantage6Text3: '• Legal compliance ensures trustworthiness',
    
    advantage7Title: '7. Flexible Wallet Functionality',
    advantage7Text1: '• Syntrix can be used as a high-yield crypto wallet',
    advantage7Text2: '• Deposits and withdrawals in under a minute',
    advantage7Text3: '• Funds remain accessible while generating income',
    
    advantage8Title: '8. No Technical Hassle',
    advantage8Text1: '• No mining equipment or electricity costs needed',
    advantage8Text2: '• All operations handled automatically',
    advantage8Text3: '• Bot manages volatility and risk',
    
    advantage9Title: '9. Multi-Level Referral Program',
    advantage9Text1: '• Earn through 3-level referral system: 4% / 3% / 2%',
    advantage9Text2: '• Maximum passive income from referrals: 9%',
    advantage9Text3: '• Encourages organic growth',
    
    advantage10Title: '10. Telegram Security Integration',
    advantage10Text1: '• Optional 2FA protection for user accounts',
    advantage10Text2: '• Secret question/answer system for recovery',
    advantage10Text3: '• Funds remain secure even if phone is lost',
    
    advantage11Title: '11. Ideal for Beginners and Professionals',
    advantage11Text1: '• No prior trading experience needed',
    advantage11Text2: '• Professionals can leverage advanced algorithms',
    advantage11Text3: '• Perfect solution for reliable crypto income',
    
    // Additional UI keys
    close: 'Close',
    plan: 'Plan',
    minAmount: 'Min Amount',
    dailyPercent: 'Daily %',
    selectLanguage: 'Select Language',
    approximateCalculation: 'Approximate Calculation',
    day: 'day',
    profileTitle: 'Profile',
    id: 'ID',
    nickname: 'Nickname',
    currentPlan: 'Current Plan',
    status: 'Status',
    language: 'Language',
    support: 'Support',
    advantages: 'Advantages',
    whitepaperLabel: 'WhitePaper',
    security: 'Security',
    website: 'Website',
    faq: 'FAQ',
    welcomeMatrix: 'WELCOME TO SYNTRIX',
    profitsNotRandom: 'Profits Are Not Random'
  },
  GERMAN: {
    appTitle: 'Syntrix Bot',
    wallet: 'Brieftasche',
    invite: 'Einladen',
    home: 'Start',
    calculator: 'Rechner',
    profile: 'Profil',
    totalBalance: 'Gesamtsaldo:',
    profit: 'Gewinn:',
    deposit: 'Einzahlung:',
    reinvest: 'REINVESTIEREN',
    depositBtn: 'EINZAHLEN',
    inactive: 'INAKTIV',
    leftUntilBronze: 'bis Bronze',
    incomePlans: 'EINNAHMEPLÄNE',
    dailyUpdate: 'TAGLICHES UPDATE',
    noEarningsData: 'Keine Gewinnzahlen',
    walletComingSoon: 'Wallet-Funktion bald verfügbar',
    manageYourBalance: 'VERWALTE DEINEN SALDO',
    availableBalance: 'Verfügbares Guthaben:',
    howToDeposit: 'Wie einzahlen',
    withdraw: 'AUSZAHLEN',
    howToWithdraw: 'Wie auszahlen',
    transactionsHistory: 'TRANSAKTIONENVERLAUF',
    noTransactionsYet: 'Noch keine Transaktionen',
    inviteFriends: 'Freunde einladen',
    referralBalance: 'Empfehlungsguthaben:',
    yourReferralLink: 'DEIN EMPFEHLUNGS-LINK',
    termsOfTheProgram: 'PROGRAMMBEDINGUNGEN',
    friendDeposit: 'Einzahlung eines Freundes',
    earnings: 'Erträge',
    friendOfAFriend: 'Freund eines Freundes',
    thirdLevel: 'Dritte Ebene',
    yourReferrals: 'DEINE EMPFEHLUNGEN',
    noReferralsYet: 'Noch keine Empfehlungen',
    linkCopied: 'Link in Zwischenablage kopiert',
    calculateYourProfit: 'BERECHNE DEINEN GEWINN',
    depositAmount: 'Einzahlungsbetrag',
    enterAmount: 'Betrag eingeben',
    timePeriodSelection: 'Zeitraum wählen',
    enterDays: 'Tage eingeben',
    reinvestToggle: 'Reinvestieren',
    profitText: 'Gewinn:',
    summary: 'Zusammenfassung',
    totalProfit: 'GESAMTGEWINN:',
    totalFunds: 'GESAMTVERMÖGEN:',
    leaderboard: 'Bestenliste',
    accountBalance: 'Kontostand:',
    referralEarnings: 'Empfehlungsgewinne:',
    totalReferrals: 'Gesamtempfehlungen:',
    welcome: 'Willkommen bei Syntrix',
    websiteLink: 'Webseite',
    verifyWithSyntrix: 'Mit Syntrix verifizieren',
    languageChanged: 'Sprache geändert zu',
    idCopied: 'ID kopiert',
    back: 'Zurück',
    selectCurrency: 'Währung wählen',
    enterAmountDollar: 'Betrag in $ eingeben',
    continue: 'WEITER',
    faqTitle: 'SYNTRIX — FAQ',
    faqSubtitle: 'Häufig gestellte Fragen',
    faqDescription: 'Antworten auf häufige Fragen zu Syntrix',
    securityTitle: 'Sicherheit',
    whitepaperTitle: 'SYNTRIX WhitePaper',
    withdrawTitle: 'GEWINNE AUSZAHLEN',
    incomePlansTitle: 'EINKOMMENSPLÄNE',
    tableDeposit: 'Einzahlung',
    tableDailyProfit: 'Täglicher Gewinn',
    advantagesTitle: 'Vorteile',
    advantagesSubtitle: 'Warum Syntrix wählen',
    advantagesDescription: 'Entdecke die einzigartigen Vorteile, die Syntrix zur besten Wahl für Krypto-Investoren machen',
    securitySubtitle: 'Syntrix-Sicherheit',
    securityDescription: 'Mehrstufiger Schutz für deine Investitionen und sorgenfreie Nutzung',
    whitepaperContent: germanWhitepaperContent,
    faqIntro: 'Finde Antworten auf die häufigsten Fragen und starte schneller mit Syntrix.',
    faqSections: germanFAQSections,
    faqPlansTitle: 'Einkommenspläne',
    faqPlans: germanFAQPlans,
    advantage1Title: '1. Vollständig automatisierter Handel',
    advantage1Text1: '• Handelt rund um die Uhr ohne Nutzerintervention',
    advantage1Text2: '• Nutzt Smart-Money-Konzepte und institutionelle Risikomanagement-Strategien',
    advantage1Text3: '• Keine Notwendigkeit, Charts zu überwachen oder manuell zu entscheiden',
    advantage1Text4: '• Generiert passives Einkommen zuverlässig mit minimalem Aufwand',
    advantage2Title: '2. Hohe Erfolgsquote und Rentabilität',
    advantage2Text1: '• Erfolgsquote über 90 % auf Basis von 5-10 Jahren getesteter Strategien',
    advantage2Text2: '• Risiko-Rendite-Verhältnis liegt immer mindestens bei 1:5',
    advantage2Text3: '• Tagesgewinnpotenzial zwischen 1 % und 11 %, abhängig vom Abo-Plan',
    advantage2Text4: '• Fortschrittliche Algorithmen ermöglichen konstante Gewinne selbst in volatilen Märkten',
    advantage3Title: '3. Maximale Sicherheit und Kapitalerhalt',
    advantage3Text1: '• Kundengelder sind verschlüsselt und für das Team unzugänglich',
    advantage3Text2: '• Liquiditätspuffer (25 % der Gewinne) schützt alle Einzahlungen und Gewinne vor Verlusten',
    advantage3Text3: '• Maximales Risiko pro Trade beträgt 1 % deiner Einzahlung',
    advantage3Text4: '• Mehrschichtige Sicherheit auf Servern und innerhalb von Telegram',
    advantage3Text5: '• Selbst bei seltenen technischen Fehlern oder Black-Swan-Ereignissen bleibt das Kapital vollständig geschützt',
    advantage4Title: '4. Sofortige Auszahlungen',
    advantage4Text1: '• Auszahlungen werden vom Bot in 3 Sekunden bearbeitet, zuzüglich Netzwerklaufzeit',
    advantage4Text2: '• Mittel sind jederzeit verfügbar; keine Sperrfristen oder Wartezeiten',
    advantage4Text3: '• Unterstützt Auszahlungen in USDT oder USDC, um Stabilität gegenüber Marktvolatilität zu gewährleisten',
    advantage5Title: '5. Absolute Transparenz',
    advantage5Text1: '• Alle Trades und Gewinne sind nachvollziehbar',
    advantage5Text2: '• Volle Sichtbarkeit verhindert verdeckte Operationen',
    advantage5Text3: '• Nutzer können Transaktionsverifizierungen anfordern',
    advantage6Title: '6. Lizenziert und reguliert',
    advantage6Text1: '• Operiert unter Syntrix Algo Systems LLC, Dubai',
    advantage6Text2: '• Lizenziert für algorithmische Krypto-Trading-Bots',
    advantage6Text3: '• Gesetzeskonformität schafft Vertrauen',
    advantage7Title: '7. Flexible Wallet-Funktion',
    advantage7Text1: '• Syntrix kann als hochrentable Krypto-Wallet genutzt werden',
    advantage7Text2: '• Ein- und Auszahlungen dauern unter einer Minute',
    advantage7Text3: '• Mittel bleiben zugänglich, während sie Einkommen generieren',
    advantage8Title: '8. Keine technische Mühe',
    advantage8Text1: '• Keine Mining-Hardware oder Stromkosten notwendig',
    advantage8Text2: '• Alle Abläufe erfolgen automatisch',
    advantage8Text3: '• Der Bot steuert Volatilität und Risiken',
    advantage9Title: '9. Mehrstufiges Empfehlungsprogramm',
    advantage9Text1: '• Verdiene über ein 3-stufiges Empfehlungsmodell: 4 % / 3 % / 2 %',
    advantage9Text2: '• Maximaler passiver Verdienst aus Empfehlungen: 9 %',
    advantage9Text3: '• Fördert organisches Wachstum',
    advantage10Title: '10. Telegram-Sicherheitsintegration',
    advantage10Text1: '• Optionale 2FA zum Schutz von Nutzerkonten',
    advantage10Text2: '• Geheimfragen/-antworten-System zur Wiederherstellung',
    advantage10Text3: '• Mittel bleiben sicher, selbst wenn das Telefon verloren geht',
    advantage11Title: '11. Ideal für Einsteiger und Profis',
    advantage11Text1: '• Keine Handelserfahrung notwendig',
    advantage11Text2: '• Profis profitieren von fortgeschrittenen Algorithmen',
    advantage11Text3: '• Perfekte Lösung für zuverlässiges Krypto-Einkommen',
    close: 'Schließen',
    plan: 'Plan',
    minAmount: 'Mindestbetrag',
    dailyPercent: 'Täglich %',
    selectLanguage: 'Sprache wählen',
    approximateCalculation: 'Ungefähre Berechnung',
    day: 'Tag',
    profileTitle: 'Profil',
    id: 'ID',
    nickname: 'Spitzname',
    currentPlan: 'Aktueller Plan',
    status: 'Status',
    language: 'Sprache',
    support: 'Support',
    advantages: 'Vorteile',
    whitepaperLabel: 'WhitePaper',
    security: 'Sicherheit',
    website: 'Webseite',
    faq: 'FAQ',
    welcomeMatrix: 'WILLKOMMEN BEI SYNTRIX',
    profitsNotRandom: 'GEWINNE SIND KEIN ZUFALL'
  }
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.ENGLISH
