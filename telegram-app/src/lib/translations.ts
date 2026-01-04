// Translation system for Syntrix app
// Note: Full FAQ/Security/Whitepaper content removed due to TypeScript compilation limits
// Only essential UI translations are included

import {
  germanWhitepaperContent,
  spanishWhitepaperContent,
  frenchWhitepaperContent,
  italianWhitepaperContent,
  dutchWhitepaperContent
} from './whitepaperContent'

type FAQItem = { question: string; answer: string | string[] }
type FAQSection = { title: string; items: FAQItem[] }
type InfoSection = {
  title: string
  paragraphs?: string[]
  lists?: string[][]
}

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

const englishSecuritySections: InfoSection[] = [
  {
    title: '1. Encryption and Fund Protection',
    lists: [
      [
        'All client funds are encrypted and stored in a secure liquidity pool. The Syntrix team has no access to your funds',
        'To secure data and assets, Syntrix uses industry-standard encryption both on the server and inside Telegram:',
        'AES-256 – symmetric encryption for data storage and transfer',
        'RSA-4096 – asymmetric encryption for secure key exchange and authentication',
        'SHA-512 – cryptographic hashing for data integrity and verification',
        'All bot operations run in a fully encrypted environment to prevent hacks or fund theft'
      ]
    ]
  },
  {
    title: '2. Liquidity Reserve Pool',
    lists: [
      [
        '25% of daily profits are allocated to a reserve liquidity pool to protect all investments',
        'The reserve pool exceeds current investor deposits ($53M vs $48M)',
        'In case of technical failures, "black swan" events, or unforeseen circumstances, the pool automatically returns all client funds',
        'This system guarantees capital safety even if individual trades lose money'
      ]
    ]
  },
  {
    title: '3. Risk Management and Trading Safety',
    lists: [
      [
        'Maximum risk per trade is limited to 1% of the deposit',
        'Risk/Reward per trade is always at least 1:5, ensuring steady growth even during losing trades',
        'Maximum consecutive losses are 2 trades. If the bot detects 3 losses, it pauses and reviews strategies',
        'Even under extreme conditions, client capital remains protected by the reserve pool and strict risk management'
      ]
    ]
  },
  {
    title: '4. Security Within Telegram',
    paragraphs: ['To maximize account safety and secure access to Syntrix, users should:'],
    lists: [
      [
        'Enable 2FA (two-factor authentication) in Telegram',
        'Use a registered SIM card to prevent unauthorized account recovery',
        'Set up a secret question and answer during registration',
        'If a phone or SIM card is lost, access can be restored by confirming the balance and secret question',
        'This acts as a third security layer for the account and funds'
      ]
    ]
  },
  {
    title: '5. Server Protection and DDoS Mitigation',
    lists: [
      [
        'Syntrix servers are protected against DDoS attacks and distributed across multiple regions worldwide',
        'All servers implement multi-level authentication to minimize hacking risks',
        'Critical operations are executed within a secure infrastructure inaccessible to external parties'
      ]
    ]
  },
  {
    title: '6. Transparency and Verification',
    lists: [
      [
        'All Syntrix trades are trackable via referral codes and PNL screenshots',
        'Users can request transaction verification through support',
        'Full transparency ensures the platform is not a financial pyramid and avoids risky or opaque schemes'
      ]
    ]
  },
  {
    title: '7. Backup and Contingency Mechanisms',
    paragraphs: ['In the event of any technical failure or temporary bot downtime:'],
    lists: [
      [
        'The reserve pool automatically returns all investments and profits to clients',
        'Even during critical events (server outage, network failure), users will not lose funds'
      ]
    ]
  }
]

const germanSecuritySections: InfoSection[] = [
  {
    title: '1. Verschlüsselung und Fondsabsicherung',
    lists: [
      [
        'Alle Kundengelder sind verschlüsselt und in einem sicheren Liquiditätspool gespeichert. Das Syntrix-Team hat keinen Zugriff auf deine Mittel',
        'Zum Schutz von Daten und Assets nutzt Syntrix branchenübliche Verschlüsselung auf Servern und in Telegram:',
        'AES-256 – symmetrische Verschlüsselung für Datenspeicherung und -übertragung',
        'RSA-4096 – asymmetrische Verschlüsselung für sicheren Schlüsselaustausch und Authentifizierung',
        'SHA-512 – kryptografisches Hashing für Datenintegrität und Verifikation',
        'Alle Bot-Operationen laufen in einer vollständig verschlüsselten Umgebung, um Hacks oder Diebstahl zu verhindern'
      ]
    ]
  },
  {
    title: '2. Liquiditätsreservepool',
    lists: [
      [
        '25 % der Tagesgewinne werden in einen Reserve-Liquiditätspool gesteckt, damit alle Investitionen geschützt sind',
        'Der Reservepool übersteigt aktuelle Investoren-Einlagen (53 Mio. $ vs. 48 Mio. $)',
        'Bei technischen Ausfällen, "Black-Swan"-Ereignissen oder unvorhergesehenen Situationen gibt der Pool automatisch alle Kundengelder zurück',
        'Dieses System garantiert Kapitalsicherheit, selbst wenn einzelne Trades Verluste verzeichnen'
      ]
    ]
  },
  {
    title: '3. Risikomanagement und sichere Trades',
    lists: [
      [
        'Das maximale Risiko pro Trade beträgt 1 % der Einzahlung',
        'Risk/Reward pro Trade liegt stets bei mindestens 1:5, was gleichmäßiges Wachstum auch bei Verlusten ermöglicht',
        'Maximale aufeinanderfolgende Verluste: 2 Trades. Erkennt der Bot 3 Verluste, pausiert er und prüft Strategien',
        'Auch unter extremen Bedingungen bleibt das Kapital dank Reservepool und striktem Risikomanagement geschützt'
      ]
    ]
  },
  {
    title: '4. Sicherheit innerhalb von Telegram',
    paragraphs: ['Für maximale Kontosicherheit und gesicherten Zugang zu Syntrix sollten Nutzer:'],
    lists: [
      [
        '2FA (Zwei-Faktor-Authentifizierung) in Telegram aktivieren',
        'Eine registrierte SIM-Karte verwenden, um unerlaubte Wiederherstellung zu verhindern',
        'Eine geheime Frage und Antwort während der Registrierung festlegen',
        'Gehen Telefon oder SIM verloren, kann der Zugriff durch Bestätigung des Guthabens und der Geheimfrage wiederhergestellt werden',
        'Das bildet eine dritte Sicherheitsschicht für Konto und Gelder'
      ]
    ]
  },
  {
    title: '5. Server-Schutz und DDoS-Abwehr',
    lists: [
      [
        'Syntrix-Server sind gegen DDoS-Attacken geschützt und geografisch verteilt',
        'Alle Server nutzen mehrstufige Authentifizierung, um Hack-Risiken zu minimieren',
        'Kritische Prozesse laufen in einer sicheren Infrastruktur, die für externe Parteien unzugänglich ist'
      ]
    ]
  },
  {
    title: '6. Transparenz und Verifikation',
    lists: [
      [
        'Alle Syntrix-Trades sind über Empfehlungscodes und PNL-Screenshots nachvollziehbar',
        'Nutzer können Transaktionsverifizierungen über den Support anfordern',
        'Volle Transparenz stellt sicher, dass die Plattform keine Finanzpyramide ist und keine riskanten oder undurchsichtigen Systeme verwendet'
      ]
    ]
  },
  {
    title: '7. Backup- und Notfallmechanismen',
    paragraphs: ['Im Falle technischer Ausfälle oder temporärer Bot-Downtimes:'],
    lists: [
      [
        'Der Reservepool gibt automatisch alle Investitionen und Gewinne an die Kunden zurück',
        'Auch bei kritischen Ereignissen (Serverausfall, Netzstörung) verlieren Nutzer keine Mittel'
      ]
    ]
  }
]

const englishAdvantagesSections: InfoSection[] = [
  {
    title: '1. Fully Automated Trading',
    lists: [
      [
        'Trades cryptocurrency pairs 24/7 without user intervention',
        'Uses Smart Money Concepts (SMC), liquidity analysis, order book reading, and institutional risk management strategies',
        'No need to monitor charts or make manual decisions',
        'Generates passive income reliably with minimal effort'
      ]
    ]
  },
  {
    title: '2. High Win Rate and Profitability',
    lists: [
      [
        'Win-rate of 90%+, based on backtested strategies over 5–10 years',
        'Risk/Reward ratio is always at least 1:5',
        'Potential daily profit ranges from 1% to 11%, depending on your subscription plan',
        'Advanced algorithms allow consistent gains even in volatile markets'
      ]
    ]
  },
  {
    title: '3. Maximum Safety and Capital Protection',
    lists: [
      [
        'Client funds are encrypted and inaccessible to the team',
        'Liquidity reserve pool (25% of profits) protects all deposits and profits against losses',
        'Maximum risk per trade is 1% of your deposit',
        'Multi-layered security on servers and inside Telegram',
        'Even in rare technical failures or "black swan" events, capital stays safeguarded'
      ]
    ]
  },
  {
    title: '4. Instant Withdrawals',
    lists: [
      [
        'Withdrawals processed by the bot in 3 seconds, plus network time',
        'Funds are always available; no lockups or waiting periods',
        'Supports withdrawals in USDT or USDC to maintain stability against volatility'
      ]
    ]
  },
  {
    title: '5. Complete Transparency',
    lists: [
      [
        'All trades and profits are trackable using referral codes and PNL screenshots',
        'Full visibility ensures no hidden operations and confirms Syntrix is not a financial pyramid',
        'Users can request transaction verification through support'
      ]
    ]
  },
  {
    title: '6. Licensed and Regulated',
    lists: [
      [
        'Operates under Syntrix Algo Systems LLC, Dubai',
        'Licensed for algorithmic crypto trading bots',
        'Legal and regulatory compliance ensures trustworthiness and long-term reliability'
      ]
    ]
  },
  {
    title: '7. Flexible Wallet Functionality',
    lists: [
      [
        'Syntrix can be used as a high-yield crypto wallet',
        'Deposits and withdrawals can be done in under a minute',
        'Funds remain fully accessible at all times, while generating passive daily income'
      ]
    ]
  },
  {
    title: '8. No Technical Hassle',
    lists: [
      [
        'No mining equipment, staking, or electricity costs required',
        'All operations are handled automatically inside the bot',
        'The bot manages market volatility, liquidity, and risk without user involvement'
      ]
    ]
  },
  {
    title: '9. Multi-Level Referral Program',
    lists: [
      [
        'Earn passive income through a 3-level referral system: 4% / 3% / 2%',
        'Maximum passive income from referrals: 9%',
        'Encourages organic growth without compromising your personal investments'
      ]
    ]
  },
  {
    title: '10. Telegram Security Integration',
    lists: [
      [
        'Optional 2FA protection for user accounts',
        'Secret question/answer system for account recovery',
        'Keeps funds and account access secure even if a user loses their phone or SIM'
      ]
    ]
  },
  {
    title: '11. Ideal for Beginners and Professionals',
    lists: [
      [
        'No prior trading experience needed',
        'Professionals can leverage advanced algorithms',
        'Perfect solution for reliable crypto income'
      ]
    ]
  }
]

const germanAdvantagesSections: InfoSection[] = [
  {
    title: '1. Vollständig automatisierter Handel',
    lists: [
      [
        'Handelt 24/7 Kryptowährungspaare ohne Nutzerintervention',
        'Verwendet Smart-Money-Konzepte (SMC), Liquiditätsanalyse, Orderbuch-Auswertung und institutionelle Risikomanagement-Strategien',
        'Keine Charts oder manuelle Entscheidungen nötig',
        'Erzeugt passives Einkommen zuverlässig mit minimalem Aufwand'
      ]
    ]
  },
  {
    title: '2. Hohe Trefferquote und Rentabilität',
    lists: [
      [
        'Trefferquote von über 90 %, basierend auf 5–10 Jahren rückgetesteter Strategien',
        'Risk/Reward-Verhältnis liegt stets bei mindestens 1:5',
        'Potentieller Tagesgewinn liegt zwischen 1 % und 11 %, je nach Abo-Plan',
        'Fortschrittliche Algorithmen erlauben konstante Gewinne auch in volatilen Märkten'
      ]
    ]
  },
  {
    title: '3. Maximale Sicherheit und Kapitalerhalt',
    lists: [
      [
        'Kundengelder sind verschlüsselt und für das Team unzugänglich',
        'Der Liquiditätspuffer (25 % der Gewinne) schützt alle Einzahlungen und Gewinne vor Verlusten',
        'Maximales Risiko pro Trade beträgt 1 % deiner Einzahlung',
        'Mehrschichtige Sicherheit auf Servern und innerhalb von Telegram',
        'Auch bei seltenen technischen Fehlern oder "Black-Swan"-Ereignissen bleibt das Kapital gesichert'
      ]
    ]
  },
  {
    title: '4. Sofortige Auszahlungen',
    lists: [
      [
        'Auszahlungen werden vom Bot in 3 Sekunden verarbeitet, zuzüglich Netzwerklaufzeit',
        'Mittel sind jederzeit verfügbar; es gibt keine Sperrfristen oder Wartezeiten',
        'Unterstützt Auszahlungen in USDT oder USDC, um Stabilität gegenüber Volatilität zu gewährleisten'
      ]
    ]
  },
  {
    title: '5. Absolute Transparenz',
    lists: [
      [
        'Alle Trades und Gewinne lassen sich über Empfehlungscodes und PNL-Screenshots nachverfolgen',
        'Volle Sichtbarkeit stellt sicher, dass Syntrix keine Finanzpyramide ist',
        'Nutzer können Transaktionsverifizierungen über den Support anfordern'
      ]
    ]
  },
  {
    title: '6. Lizenziert und reguliert',
    lists: [
      [
        'Operiert unter Syntrix Algo Systems LLC, Dubai',
        'Lizenziert für algorithmische Krypto-Trading-Bots',
        'Rechtliche und regulatorische Compliance sorgt für Vertrauen und langfristige Verlässlichkeit'
      ]
    ]
  },
  {
    title: '7. Flexible Wallet-Funktion',
    lists: [
      [
        'Syntrix kann als hochrentable Krypto-Wallet genutzt werden',
        'Ein- und Auszahlungen dauern unter einer Minute',
        'Mittel bleiben jederzeit zugänglich, während sie passives Daily Income generieren'
      ]
    ]
  },
  {
    title: '8. Keine technische Mühe',
    lists: [
      [
        'Keine Mining-Hardware, kein Staking oder Stromkosten nötig',
        'Alle Abläufe laufen automatisch innerhalb des Bots',
        'Der Bot steuert Marktvolatilität, Liquidität und Risiko ganz ohne Nutzerintervention'
      ]
    ]
  },
  {
    title: '9. Mehrstufiges Empfehlungsprogramm',
    lists: [
      [
        'Verdiene passives Einkommen über ein 3-stufiges Empfehlungsmodell: 4 % / 3 % / 2 %',
        'Maximaler passiver Verdienst aus Empfehlungen: 9 %',
        'Fördert organisches Wachstum ohne dein eigenes Kapital zu beeinträchtigen'
      ]
    ]
  },
  {
    title: '10. Telegram-Sicherheitsintegration',
    lists: [
      [
        'Optionale 2FA zum Schutz deines Kontos',
        'Geheimfrage/-antwort-System zur Wiederherstellung',
        'Sichert Mittel und Zugang selbst bei Verlust des Telefons oder der SIM-Karte'
      ]
    ]
  },
  {
    title: '11. Ideal für Einsteiger und Profis',
    lists: [
      [
        'Keine Handelserfahrung notwendig',
        'Profis profitieren von fortgeschrittenen Algorithmen',
        'Perfekte Lösung für zuverlässiges Krypto-Einkommen'
      ]
    ]
  }
]

const spanishFAQSections: FAQSection[] = [
  {
    title: '1. Información general',
    items: [
      {
        question: '¿Qué es Syntrix y cómo funciona?',
        answer:
          'Syntrix es un bot de trading en Telegram que aplica estrategias institucionales en las principales bolsas para ofrecer trading automatizado sin que debas intervenir.'
      },
      {
        question: '¿Necesito experiencia en trading para usarlo?',
        answer: 'No. Basta con elegir un plan, depositar fondos y el bot se encarga de todo con algoritmos probados.'
      },
      {
        question: '¿Syntrix es seguro y está disponible en todo el mundo?',
        answer: 'Sí. Opera donde el cripto es legal y protege los fondos con wallets cifrados junto a un gran pool de liquidez.'
      }
    ]
  },
  {
    title: '2. Depósitos y wallet',
    items: [
      {
        question: '¿Qué monedas aceptan para depositar?',
        answer: 'USDT, USDC, Bitcoin, Ethereum, Solana y otros tokens principales. Las entradas se convierten en USDT para trading.'
      },
      {
        question: '¿Cuánto tarda el depósito en activarse?',
        answer: 'Los fondos llegan en segundos tras la confirmación de la blockchain y el bot los utiliza casi de inmediato.'
      },
      {
        question: '¿Puedo usar Syntrix como wallet?',
        answer: 'Sí. Tu capital se mantiene accesible, genera ingresos pasivos y puedes retirarlo cuando quieras.'
      }
    ]
  },
  {
    title: '3. Ganancias y gestión de riesgo',
    items: [
      {
        question: '¿Qué rendimientos puedo esperar?',
        answer: 'Las ganancias diarias oscilan entre 0.5 % y 7 % según el plan, y el reinvertir acelera el crecimiento a largo plazo.'
      },
      {
        question: '¿Cómo controlan el riesgo?',
        answer: 'Cada trade arriesga como máximo el 1 % del depósito y el 25 % de las ganancias se guarda en un pool de reserva para cubrir drawdowns.'
      }
    ]
  },
  {
    title: '4. Retiros',
    items: [
      {
        question: '¿Cuánto tardan los retiros?',
        answer: 'El bot procesa retiros en aproximadamente 3 segundos más el tiempo de la red; la mayoría completan en menos de un minuto.'
      },
      {
        question: '¿Hay comisiones ocultas?',
        answer: 'No. Syntrix no cobra comisiones adicionales: solo pagas la tasa de la red blockchain.'
      }
    ]
  },
  {
    title: '5. Programa de referidos',
    items: [
      {
        question: '¿Cómo funciona el programa de referidos?',
        answer: 'Ganas 4 % / 3 % / 2 % de tres niveles de referidos, hasta un 9 % de ingresos pasivos sobre sus ganancias.'
      },
      {
        question: '¿Cuándo recibo los bonos?',
        answer: 'Los pagos de referidos se distribuyen diariamente junto con tus ganancias regulares del plan.'
      }
    ]
  },
  {
    title: '6. Soporte y cumplimiento',
    items: [
      {
        question: '¿Syntrix está regulado?',
        answer: 'Syntrix Algo Systems LLC está registrada en Dubái y sigue los lineamientos de cumplimiento para trading algorítmico.'
      },
      {
        question: '¿Cómo contacto al soporte?',
        answer: 'Usa el botón de Soporte dentro de la app o el canal oficial de Telegram disponible 24/7.'
      }
    ]
  }
]

const spanishFAQPlans = [
  'Plan Bronze: $10–$99 (0.5 % diario)',
  'Plan Silver: $100–$499 (1 % diario)',
  'Plan Gold: $500–$999 (2 % diario)',
  'Plan Platinum: $1000–$4999 (3 % diario)',
  'Plan Diamond: $5000–$19999 (5 % diario)',
  'Plan Black: $20000–$100000 (7 % diario)',
  'Planes personalizados: depósitos > $100000 (8 %+ diario)'
]

const frenchFAQSections: FAQSection[] = [
  {
    title: '1. Informations générales',
    items: [
      {
        question: 'Qu\'est-ce que Syntrix et comment fonctionne-t-il ?',
        answer:
          'Syntrix est un bot de trading Telegram qui exécute des stratégies institutionnelles sur les principales exchanges, offrant une exposition automatisée sans intervention manuelle.'
      },
      {
        question: 'Ai-je besoin d\'expérience pour utiliser Syntrix ?',
        answer: 'Non. Choisissez un plan, alimentez le bot et il s\'occupe du reste avec des algorithmes éprouvés.'
      },
      {
        question: 'Syntrix est-il sécurisé et disponible dans le monde entier ?',
        answer: 'Oui. Il opère dans les juridictions où la crypto est légale et protège les fonds avec des wallets chiffrés et un large pool de liquidité.'
      }
    ]
  },
  {
    title: '2. Dépôts et wallet',
    items: [
      {
        question: 'Quelles devises sont prises en charge pour les dépôts ?',
        answer: 'USDT, USDC, Bitcoin, Ethereum, Solana et autres tokens majeurs, convertis instantanément en USDT pour le trading.'
      },
      {
        question: 'À quelle vitesse les dépôts sont-ils activés ?',
        answer: 'Les fonds arrivent en quelques secondes après la confirmation de la blockchain et sont immédiatement disponibles pour le bot.'
      },
      {
        question: 'Puis-je utiliser Syntrix comme wallet ?',
        answer: 'Absolument. Votre capital reste accessible, génère un revenu passif et peut être retiré quand vous le souhaitez.'
      }
    ]
  },
  {
    title: '3. Rendement et gestion du risque',
    items: [
      {
        question: 'Quels rendements puis-je espérer ?',
        answer: 'Les rendements journaliers vont de 0,5 % à 7 % selon le plan, et la capitalisation accélère la croissance à long terme.'
      },
      {
        question: 'Comment le risque est-il maîtrisé ?',
        answer: 'Chaque trade risque au maximum 1 % du dépôt, et 25 % des gains sont mis en réserve pour absorber les drawdowns.'
      }
    ]
  },
  {
    title: '4. Retraits',
    items: [
      {
        question: 'Combien de temps prennent les retraits ?',
        answer: 'Le bot traite les retraits en environ 3 secondes plus le temps du réseau ; la plupart arrivent en moins d\'une minute.'
      },
      {
        question: 'Y a-t-il des frais cachés ?',
        answer: 'Non. Syntrix ne facture rien de plus que les frais réseau standard.'
      }
    ]
  },
  {
    title: '5. Programme de parrainage',
    items: [
      {
        question: 'Comment fonctionne le programme de parrainage ?',
        answer: 'Vous gagnez 4 % / 3 % / 2 % sur trois niveaux de parrainages, soit jusqu\'à 9 % de revenu passif sur leurs gains.'
      },
      {
        question: 'Quand reçois-je les bonus ?',
        answer: 'Les paiements de parrainages sortent quotidiennement avec vos gains réguliers.'
      }
    ]
  },
  {
    title: '6. Support et conformité',
    items: [
      {
        question: 'Syntrix est-il réglementé ?',
        answer: 'Syntrix Algo Systems LLC est enregistré à Dubaï et respecte les lignes directrices de conformité pour le trading algorithmique.'
      },
      {
        question: 'Comment joindre le support ?',
        answer: 'Utilisez le bouton Support dans l\'app ou le canal Telegram officiel disponible 24/7.'
      }
    ]
  }
]

const frenchFAQPlans = [
  'Plan Bronze : $10–$99 (0,5 % par jour)',
  'Plan Argent : $100–$499 (1 % par jour)',
  'Plan Or : $500–$999 (2 % par jour)',
  'Plan Platine : $1000–$4999 (3 % par jour)',
  'Plan Diamond : $5000–$19999 (5 % par jour)',
  'Plan Black : $20000–$100000 (7 % par jour)',
  'Plans personnalisés : dépôts > $100000 (8 %+ par jour)'
]

const spanishSecuritySections: InfoSection[] = [
  {
    title: '1. Cifrado y protección de fondos',
    lists: [
      [
        'Los fondos del cliente están cifrados y almacenados en un pool de liquidez seguro. El equipo de Syntrix no tiene acceso a tu capital',
        'Para proteger datos y activos, Syntrix utiliza cifrado de nivel industrial tanto en el servidor como dentro de Telegram:',
        'AES-256 – cifrado simétrico para almacenamiento y transferencia de datos',
        'RSA-4096 – cifrado asimétrico para intercambio seguro de claves y autenticación',
        'SHA-512 – hashing criptográfico para integridad y verificación de datos',
        'Todas las operaciones del bot se ejecutan en un entorno completamente cifrado para prevenir hackeos y robos'
      ]
    ]
  },
  {
    title: '2. Pool de reserva de liquidez',
    lists: [
      [
        'El 25 % de las ganancias diarias se destina a un pool de reserva liquidity para proteger todas las inversiones',
        'El pool de reserva supera los depósitos activos: $53M frente a $48M',
        'En caso de fallas técnicas o “cisnes negros”, el pool devuelve automáticamente todos los fondos',
        'Este sistema garantiza la seguridad del capital incluso si operaciones individuales pierden dinero'
      ]
    ]
  },
  {
    title: '3. Gestión de riesgo y seguridad del trading',
    lists: [
      [
        'El riesgo máximo por operación se limita al 1 % del depósito',
        'El ratio riesgo/recompensa por operación siempre es al menos 1:5 para un crecimiento estable',
        'Después de dos pérdidas consecutivas, el bot estará alerta y si detecta tres, se pausa y revisa la estrategia',
        'Incluso en condiciones extremas, el capital se mantiene protegido gracias al pool de reserva y una gestión de riesgo estricta'
      ]
    ]
  },
  {
    title: '4. Seguridad dentro de Telegram',
    paragraphs: ['Para maximizar la seguridad de tu cuenta y el acceso a Syntrix, deberías:'],
    lists: [
      [
        'Activar 2FA (autenticación de dos factores) en Telegram',
        'Usar una SIM registrada para evitar recuperaciones no autorizadas',
        'Configurar una pregunta y respuesta secreta durante el registro',
        'Si pierdes el teléfono o la SIM, puedes recuperar el acceso confirmando tu balance y la pregunta secreta',
        'Esto actúa como una tercera capa de seguridad para la cuenta y los fondos'
      ]
    ]
  },
  {
    title: '5. Protección de servidores y mitigación de DDoS',
    lists: [
      [
        'Los servidores de Syntrix están protegidos contra ataques DDoS y distribuidos geográficamente',
        'Todos los servidores aplican autenticación multinivel para minimizar riesgos de hackeo',
        'Las operaciones críticas se ejecutan dentro de una infraestructura segura inaccesible para externos'
      ]
    ]
  },
  {
    title: '6. Transparencia y verificación',
    lists: [
      [
        'Todas las operaciones de Syntrix son rastreables mediante códigos de referido y capturas de PNL',
        'Puedes solicitar verificaciones de transacciones a través del soporte',
        'La transparencia total asegura que la plataforma no es una pirámide financiera ni utiliza esquemas opacos'
      ]
    ]
  },
  {
    title: '7. Mecanismos de respaldo y contingencia',
    paragraphs: ['En caso de fallas técnicas o inactividad temporal del bot:'],
    lists: [
      [
        'El pool de reserva devuelve automáticamente todas las inversiones y ganancias a los clientes',
        'Incluso durante incidentes críticos (caída de servidores, fallas de red), los usuarios no pierden sus fondos'
      ]
    ]
  }
]

const frenchSecuritySections: InfoSection[] = [
  {
    title: '1. Chiffrement et protection des fonds',
    lists: [
      [
        'Tous les fonds clients sont chiffrés et stockés dans un pool de liquidité sécurisé. L\'équipe Syntrix n\'a aucun accès.',
        'Pour protéger les données et les actifs, Syntrix utilise des chiffrement standards sur les serveurs et dans Telegram :',
        'AES-256 – chiffrement symétrique pour le stockage et le transfert',
        'RSA-4096 – chiffrement asymétrique pour l\'échange sécurisé de clés et l\'authentification',
        'SHA-512 – hachage cryptographique pour l\'intégrité et la vérification',
        'Toutes les opérations du bot tournent dans un environnement entièrement chiffré pour prévenir piratages et vols'
      ]
    ]
  },
  {
    title: '2. Pool de réserve de liquidité',
    lists: [
      [
        '25 % des profits journaliers sont alloués à un pool de réserve de liquidité pour protéger tous les investissements',
        'Le pool dépasse les dépôts actuels : 53 M$ contre 48 M$',
        'En cas de défaillances techniques ou d\'événements imprévus, le pool rend automatiquement tous les fonds',
        'Ce système garantit la sécurité du capital même si des trades individuels perdent de l\'argent'
      ]
    ]
  },
  {
    title: '3. Gestion des risques et sécurité du trading',
    lists: [
      [
        'Risque maximal par trade limité à 1 % du dépôt',
        'Ratio risque/rendement toujours au moins 1:5 pour assurer une croissance stable durant les pertes',
        'Pertes consécutives maximales : 2 trades. Si 3 pertes sont détectées, le bot se met en pause pour réviser les stratégies',
        'Même dans des conditions extrêmes, le capital reste protégé grâce au pool de réserve et à la gestion stricte du risque'
      ]
    ]
  },
  {
    title: '4. Sécurité dans Telegram',
    paragraphs: ['Pour maximiser la sécurité du compte et l\'accès à Syntrix, les utilisateurs devraient :'],
    lists: [
      [
        'Activer la 2FA (authentification à deux facteurs) dans Telegram',
        'Utiliser une carte SIM enregistrée pour empêcher les récupérations non autorisées',
        'Configurer une question secrète et sa réponse lors de l\'inscription',
        'En cas de perte du téléphone ou de la SIM, l\'accès est rétabli en confirmant le solde et la question secrète',
        'Cela agit comme une troisième couche de protection pour le compte et les fonds'
      ]
    ]
  },
  {
    title: '5. Protection des serveurs et mitigation DDoS',
    lists: [
      [
        'Les serveurs Syntrix sont protégés contre les attaques DDoS et répartis globalement',
        'Tous les serveurs appliquent une authentification multi-niveaux pour minimiser les risques de piratage',
        'Les opérations critiques s\'exécutent dans une infrastructure sécurisée inaccessible aux parties externes'
      ]
    ]
  },
  {
    title: '6. Transparence et vérification',
    lists: [
      [
        'Tous les trades Syntrix sont traçables via les codes de parrainage et les captures de PnL',
        'Les utilisateurs peuvent demander une vérification des transactions via le support',
        'La transparence totale garantit qu\'il ne s\'agit pas d\'une pyramide financière ni de schémas opaques'
      ]
    ]
  },
  {
    title: '7. Sauvegardes et plans de continuité',
    paragraphs: ['En cas de défaillance technique ou d\'indisponibilité temporaire du bot :'],
    lists: [
      [
        'Le pool de réserve retourne automatiquement tous les investissements et gains aux clients',
        'Même lors d\'événements critiques (panne de serveur, coupure réseau), les utilisateurs ne perdent pas leurs fonds'
      ]
    ]
  }
]

const spanishAdvantagesSections: InfoSection[] = [
  {
    title: '1. Trading totalmente automatizado',
    lists: [
      [
        'Opera pares de criptomonedas 24/7 sin intervención del usuario',
        'Emplea Smart Money Concepts (SMC), análisis de liquidez, lectura del libro de órdenes y gestión institucional del riesgo',
        'No necesitas monitorear gráficos ni tomar decisiones manuales',
        'Genera ingresos pasivos constantes con mínimo esfuerzo'
      ]
    ]
  },
  {
    title: '2. Alta tasa de aciertos y rentabilidad',
    lists: [
      [
        'Más del 90 % de aciertos según estrategias backtesteadas por 5-10 años',
        'Ratio riesgo/recompensa de al menos 1:5',
        'Ganancias diarias potenciales de 1 % a 11 % según tu plan',
        'Algoritmos avanzados aseguran resultados consistentes incluso en mercados volátiles'
      ]
    ]
  },
  {
    title: '3. Seguridad máxima y protección del capital',
    lists: [
      [
        'Los fondos de los clientes están cifrados y no son accesibles para el equipo',
        'El pool de reserva (25 % de las ganancias) protege depósitos y beneficios ante pérdidas',
        'El riesgo máximo por trade es el 1 % de tu depósito',
        'Seguridad multicapa en servidores y dentro de Telegram',
        'Incluso ante fallas técnicas raras o eventos “cisne negro”, el capital permanece protegido'
      ]
    ]
  },
  {
    title: '4. Retiros instantáneos',
    lists: [
      [
        'Retiros procesados por el bot en 3 segundos más el tiempo de red',
        'Fondos siempre disponibles; sin bloqueos ni esperas',
        'Admite retiros en USDT o USDC para mantener estabilidad frente a la volatilidad'
      ]
    ]
  },
  {
    title: '5. Transparencia total',
    lists: [
      [
        'Todas las operaciones y ganancias son rastreables con códigos de referido y capturas de PNL',
        'La visibilidad total evita operaciones ocultas y demuestra que no se trata de una pirámide financiera',
        'Puedes solicitar verificaciones de transacciones con el soporte'
      ]
    ]
  },
  {
    title: '6. Licenciado y regulado',
    lists: [
      [
        'Opera bajo Syntrix Algo Systems LLC, Dubái',
        'Cuenta con licencia para bots de trading algorítmico en cripto',
        'El cumplimiento legal y regulatorio garantiza confianza y fiabilidad'
      ]
    ]
  },
  {
    title: '7. Funcionalidad flexible de wallet',
    lists: [
      [
        'Syntrix funciona como una wallet cripto de alto rendimiento',
        'Depósitos y retiros se realizan en menos de un minuto',
        'Tus fondos permanecen accesibles mientras generan ingreso pasivo'
      ]
    ]
  },
  {
    title: '8. Sin complicaciones técnicas',
    lists: [
      [
        'No necesitas equipos de minería ni pagar electricidad',
        'Todas las operaciones son automáticas dentro del bot',
        'El algoritmo controla la volatilidad, liquidez y riesgo sin intervención del usuario'
      ]
    ]
  },
  {
    title: '9. Programa de referidos multinivel',
    lists: [
      [
        'Gana ingresos pasivos con un modelo de 3 niveles: 4 % / 3 % / 2 %',
        'Ingreso pasivo máximo de 9 % gracias a los referidos',
        'Fomenta un crecimiento orgánico sin comprometer tu inversión'
      ]
    ]
  },
  {
    title: '10. Integración de seguridad en Telegram',
    lists: [
      [
        'Protección 2FA opcional para tus cuentas',
        'Sistema de pregunta y respuesta secreta para recuperar el acceso',
        'Garantiza seguridad incluso si pierdes tu teléfono o tarjeta SIM'
      ]
    ]
  },
  {
    title: '11. Ideal para principiantes y profesionales',
    lists: [
      [
        'No se necesita experiencia en trading',
        'Los profesionales aprovechan algoritmos avanzados',
        'Solución perfecta para ingresos cripto confiables'
      ]
    ]
  }
]

const frenchAdvantagesSections: InfoSection[] = [
  {
    title: '1. Trading entièrement automatisé',
    lists: [
      [
        'Opère 24h/24 et 7j/7 sans intervention',
        'Utilise Smart Money Concepts, analyse de la liquidité, lecture du carnet d\'ordres et gestion institutionnelle des risques',
        'Pas besoin de surveiller les graphiques ou de prendre des décisions manuelles',
        'Génère un revenu passif fiable avec un minimum d\'effort'
      ]
    ]
  },
  {
    title: '2. Taux de réussite élevé et rentabilité',
    lists: [
      [
        'Taux de réussite supérieur à 90 % basé sur 5 à 10 ans de stratégies testées',
        'Ratio risque/rendement d\'au moins 1:5',
        'Potentiel de gain quotidien de 1 % à 11 % selon votre abonnement',
        'Des algorithmes avancés assurent des gains constants même sur les marchés volatils'
      ]
    ]
  },
  {
    title: '3. Sécurité maximale et protection du capital',
    lists: [
      [
        'Les fonds des clients sont chiffrés et inaccessibles à l\'équipe',
        'Le pool de réserve (25 % des gains) protège dépôts et profits en cas de pertes',
        'Le risque maximal par trade est limité à 1 % du dépôt',
        'Sécurité multicouche sur les serveurs et au sein de Telegram',
        'Même face à des pannes techniques rares ou des événements imprévus, le capital reste protégé'
      ]
    ]
  },
  {
    title: '4. Retraits instantanés',
    lists: [
      [
        'Retraits traités par le bot en 3 secondes plus le temps réseau',
        'Fonds disponibles à tout moment ; pas de blocage ni d\'attente',
        'Retraits en USDT ou USDC pour une stabilité face à la volatilité'
      ]
    ]
  },
  {
    title: '5. Transparence totale',
    lists: [
      [
        'Toutes les opérations et profits sont traçables',
        'La visibilité totale garantit qu\'il n\'y a rien de caché',
        'Vous pouvez demander une vérification de transaction via le support'
      ]
    ]
  },
  {
    title: '6. Licencié et réglementé',
    lists: [
      [
        'Opère sous Syntrix Algo Systems LLC, Dubaï',
        'Titulaire d\'une licence pour les bots de trading algorithmique crypto',
        'La conformité juridique renforce la confiance'
      ]
    ]
  },
  {
    title: '7. Fonctionnalité wallet flexible',
    lists: [
      [
        'Syntrix peut servir de wallet crypto à rendement élevé',
        'Dépôts et retraits en moins d\'une minute',
        'Les fonds restent accessibles tout en générant un revenu'
      ]
    ]
  },
  {
    title: '8. Aucun souci technique',
    lists: [
      [
        'Aucun matériel de mining ni frais d\'électricité requis',
        'Toutes les opérations sont gérées automatiquement',
        'Le bot contrôle la volatilité, la liquidité et le risque sans intervention'
      ]
    ]
  },
  {
    title: '9. Programme de parrainage multi-niveaux',
    lists: [
      [
        'Gagnez via un programme à 3 niveaux : 4 % / 3 % / 2 %',
        'Revenu passif maximal de 9 % tiré des gains des parrainés',
        'Encourage une croissance organique sans compromettre votre capital'
      ]
    ]
  },
  {
    title: '10. Intégration de sécurité Telegram',
    lists: [
      [
        'Protection 2FA optionnelle pour vos comptes',
        'Système question/réponse secrète pour récupérer l\'accès',
        'Les fonds restent sécurisés même si vous perdez votre téléphone ou votre SIM'
      ]
    ]
  },
  {
    title: '11. Idéal pour débutants et professionnels',
    lists: [
      [
        'Aucune expérience en trading requise',
        'Les professionnels exploitent des algorithmes avancés',
        'Solution parfaite pour un revenu crypto fiable'
      ]
    ]
  }
]

const italianFAQSections: FAQSection[] = [
  {
    title: '1. Informazioni generali',
    items: [
      {
        question: 'Cos\'è Syntrix e come funziona?',
        answer:
          'Syntrix è un bot di trading su Telegram che esegue strategie istituzionali sulle principali exchange, offrendo un trading automatizzato senza intervento manuale.'
      },
      {
        question: 'Serve esperienza di trading?',
        answer: 'No. Scegli un piano, deposita e il bot gestisce tutto con algoritmi collaudati.'
      },
      {
        question: 'Syntrix è sicuro e disponibile ovunque?',
        answer: 'Sì. Opera dove la crypto è legale e protegge i fondi con wallet crittografati e un grande pool di liquidità.'
      }
    ]
  },
  {
    title: '2. Depositi e wallet',
    items: [
      {
        question: 'Quali valute accettate?',
        answer: 'USDT, USDC, Bitcoin, Ethereum, Solana e altri token principali. I depositi vengono convertiti in USDT per il trading.'
      },
      {
        question: 'Quanto impiegano i depositi?',
        answer: 'I fondi arrivano in pochi secondi dopo la conferma della blockchain e il bot li usa subito.'
      },
      {
        question: 'Posso usare Syntrix come wallet?',
        answer: 'Sì. Il capitale resta accessibile, genera reddito passivo e può essere ritirato quando vuoi.'
      }
    ]
  },
  {
    title: '3. Profitti e gestione del rischio',
    items: [
      {
        question: 'Quali rendimenti aspettarmi?',
        answer: 'Rendimenti giornalieri dal 0,5 % al 7 %, a seconda del piano, con la reinvestizione che accelera la crescita.'
      },
      {
        question: 'Come gestite il rischio?',
        answer: 'Ogni trade rischia al massimo l\'1 % del deposito e il 25 % dei profitti viene accantonato in un pool di riserva.'
      }
    ]
  },
  {
    title: '4. Prelievi',
    items: [
      {
        question: 'Quanto durano i prelievi?',
        answer: 'Il bot li elabora in circa 3 secondi più il tempo di rete; la maggior parte impiega meno di un minuto.'
      },
      {
        question: 'Ci sono commissioni nascoste?',
        answer: 'No. Syntrix non applica commissioni extra, solo le fee di rete.'
      }
    ]
  },
  {
    title: '5. Programma referral',
    items: [
      {
        question: 'Come funziona il programma referral?',
        answer: 'Guadagni il 4 % / 3 % / 2 % su tre livelli, fino al 9 % di reddito passivo sui profitti dei referral.'
      },
      {
        question: 'Quando ricevo i bonus?',
        answer: 'I bonus vengono erogati quotidianamente insieme ai guadagni del piano.'
      }
    ]
  },
  {
    title: '6. Supporto e compliance',
    items: [
      {
        question: 'Syntrix è regolamentato?',
        answer: 'Syntrix Algo Systems LLC è registrata a Dubai e segue le linee guida per il trading algoritmico.'
      },
      {
        question: 'Come contatto il supporto?',
        answer: 'Usa il pulsante Supporto nell\'app o il canale Telegram ufficiale attivo 24/7.'
      }
    ]
  }
]

const italianFAQPlans = [
  'Piano Bronze: $10–$99 (0,5 % giornaliero)',
  'Piano Silver: $100–$499 (1 % giornaliero)',
  'Piano Gold: $500–$999 (2 % giornaliero)',
  'Piano Platinum: $1000–$4999 (3 % giornaliero)',
  'Piano Diamond: $5000–$19999 (5 % giornaliero)',
  'Piano Black: $20000–$100000 (7 % giornaliero)',
  'Piani personalizzati: depositi > $100000 (8 %+ giornaliero)'
]

const italianSecuritySections: InfoSection[] = [
  {
    title: '1. Crittografia e protezione dei fondi',
    lists: [
      [
        'I fondi dei clienti sono crittografati e conservati in un pool di liquidità sicuro. Il team Syntrix non vi accede.',
        'Syntrix usa crittografia industriale sul server e all\'interno di Telegram:',
        'AES-256 – crittografia simmetrica per storage e trasferimento',
        'RSA-4096 – crittografia asimmetrica per scambio sicuro di chiavi e autenticazione',
        'SHA-512 – hashing per integrità e verifica dei dati',
        'Le operazioni del bot girano in un ambiente completamente crittografato contro hacks e furti'
      ]
    ]
  },
  {
    title: '2. Pool di riserva di liquidità',
    lists: [
      [
        'Il 25 % dei profitti giornalieri finisce in un pool di riserva per proteggere tutti gli investimenti',
        'Il pool supera i depositi attivi: 53 M$ vs 48 M$',
        'In caso di guasti o eventi imprevisti, il pool restituisce automaticamente tutti i fondi',
        'Questo garantisce la sicurezza del capitale anche se alcuni trade perdono'
      ]
    ]
  },
  {
    title: '3. Gestione del rischio e sicurezza del trading',
    lists: [
      [
        'Il rischio massimo per trade è limitato all\'1 % del deposito',
        'Il rapporto rischio/ricompensa è sempre almeno di 1:5 per stare in crescita anche durante i drawdown',
        'Massimo due perdite consecutive. Dopo tre, il bot si ferma e rivede le strategie',
        'Anche in condizioni estreme, il capitale resta protetto da pool di riserva e gestione rigorosa'
      ]
    ]
  },
  {
    title: '4. Sicurezza su Telegram',
    paragraphs: ['Per massimizzare la sicurezza dell\'account e l\'accesso a Syntrix, chi usa dovrebbe:'],
    lists: [
      [
        'Attivare la 2FA in Telegram',
        'Usare una SIM registrata per evitare recuperi non autorizzati',
        'Configurare una domanda/risposta segreta in registrazione',
        'Se perdi telefono o SIM, riprendi l\'accesso confermando saldo e domanda segreta',
        'Questo crea un terzo livello di protezione per account e fondi'
      ]
    ]
  },
  {
    title: '5. Protezione server e mitigazione DDoS',
    lists: [
      [
        'I server Syntrix sono protetti da DDoS e distribuiti globalmente',
        'Tutti i server applicano autenticazione multi-livello per ridurre il rischio di hacking',
        'Le operazioni critiche girano in un\'infrastruttura sicura inaccessibile agli esterni'
      ]
    ]
  },
  {
    title: '6. Trasparenza e verifica',
    lists: [
      [
        'Tutti i trade sono tracciabili via codici referral e screenshot PnL',
        'Puoi richiedere la verifica di transazioni tramite supporto',
        'Trasparenza totale assicura che la piattaforma non sia una piramide finanziaria'
      ]
    ]
  },
  {
    title: '7. Backup e continuità',
    paragraphs: ['In caso di guasti tecnici o fermo temporaneo del bot:'],
    lists: [
      [
        'Il pool di riserva restituisce automaticamente investimenti e profitti ai clienti',
        'Anche durante eventi critici (down server, interruzioni di rete), gli utenti non perdono fondi'
      ]
    ]
  }
]

const italianAdvantagesSections: InfoSection[] = [
  {
    title: '1. Trading completamente automatizzato',
    lists: [
      [
        'Opera 24/7 senza interventi manuali',
        'Usa Smart Money Concepts, analisi della liquidità, lettura del book e gestione istituzionale del rischio',
        'Non serve controllare i grafici o decidere manualmente',
        'Genera reddito passivo costante con minimo sforzo'
      ]
    ]
  },
  {
    title: '2. Alto tasso di successo e redditività',
    lists: [
      [
        'Oltre il 90 % di successi su strategie testate 5-10 anni',
        'Rapporto rischio/ricompensa almeno 1:5',
        'Potenziale di guadagno giornaliero tra 1 % e 11 % a seconda del piano',
        'Algoritmi avanzati mantengono guadagni costanti anche in mercati volatili'
      ]
    ]
  },
  {
    title: '3. Massima sicurezza e protezione del capitale',
    lists: [
      [
        'I fondi dei clienti sono crittografati e inaccessibili al team',
        'Il pool di riserva (25 % dei profitti) protegge depositi e profitti dalle perdite',
        'Il rischio per trade è al massimo dell\'1 % del deposito',
        'Sicurezza multilivello su server e dentro Telegram',
        'Anche in situazioni estreme, il capitale resta protetto'
      ]
    ]
  },
  {
    title: '4. Prelievi istantanei',
    lists: [
      [
        'Prelievi elaborati in 3 secondi più tempo di rete',
        'Fondi disponibili sempre, senza blocchi né attese',
        'Supporta prelievi in USDT o USDC per stabilità rispetto alla volatilità'
      ]
    ]
  },
  {
    title: '5. Trasparenza totale',
    lists: [
      [
        'Tutte le operazioni e i profitti sono tracciabili',
        'Massima visibilità garantisce l\'assenza di operazioni nascoste',
        'Puoi richiedere la verifica delle transazioni al supporto'
      ]
    ]
  },
  {
    title: '6. Licenziato e regolamentato',
    lists: [
      [
        'Opera sotto Syntrix Algo Systems LLC, Dubai',
        'Autorizzato per bot di trading algoritmico crypto',
        'La compliance legale assicura fiducia'
      ]
    ]
  },
  {
    title: '7. Wallet flessibile',
    lists: [
      [
        'Syntrix può funzionare come wallet crypto ad alto rendimento',
        'Depositi e prelievi in meno di 60 secondi',
        'I fondi restano accessibili mentre generano entrate passive'
      ]
    ]
  },
  {
    title: '8. Nessuna complicazione tecnica',
    lists: [
      [
        'Nessun hardware mining o costi elettrici',
        'Tutte le operazioni automatiche',
        'Il bot gestisce volatilità, liquidità e rischio'
      ]
    ]
  },
  {
    title: '9. Programma referral multi-livello',
    lists: [
      [
        'Guadagni fino al 4 % / 3 % / 2 % su tre livelli',
        'Reddito passivo al massimo 9 % dai referral',
        'Favorisce crescita organica senza compromettere il capitale'
      ]
    ]
  },
  {
    title: '10. Sicurezza Telegram integrata',
    lists: [
      [
        'Protezione 2FA opzionale per gli account',
        'Sistema domanda/risposta segreta per recupero',
        'I fondi restano sicuri anche se perdi telefono o SIM'
      ]
    ]
  },
  {
    title: '11. Perfetto per principianti e professionisti',
    lists: [
      [
        'Non serve esperienza di trading',
        'I professionisti sfruttano algoritmi avanzati',
        'Soluzione ideale per reddito crypto affidabile'
      ]
    ]
  }
]

const dutchFAQSections: FAQSection[] = [
  {
    title: '1. Algemene informatie',
    items: [
      {
        question: 'Wat is Syntrix en hoe werkt het?',
        answer:
          'Syntrix is een Telegram tradingbot die institutionele strategieën op grote crypto exchanges uitvoert en hands-off toegang biedt tot geautomatiseerd handelen.'
      },
      {
        question: 'Heb ik ervaring nodig om Syntrix te gebruiken?',
        answer: 'Nee. Kies een plan, stort geld en de bot handelt namens jou met bewezen algoritmes.'
      },
      {
        question: 'Is Syntrix wereldwijd beschikbaar en veilig?',
        answer: 'Ja. De dienst opereert in jurisdicties waar crypto legaal is en beschermt fondsen met versleutelde wallets en een grote liquiditeitsreserve.'
      }
    ]
  },
  {
    title: '2. Stortingen en wallet',
    items: [
      {
        question: 'Welke valuta worden geaccepteerd?',
        answer: 'USDT, USDC, Bitcoin, Ethereum, Solana en andere grote tokens. Stortingen worden direct omgezet naar USDT voor trading.'
      },
      {
        question: 'Hoe snel wordt een storting geactiveerd?',
        answer: 'Zodra de blockchain bevestigt, zijn de middelen binnen enkele seconden beschikbaar en begint de bot met handelen.'
      },
      {
        question: 'Kan ik Syntrix als wallet gebruiken?',
        answer: 'Ja. Je kapitaal blijft toegankelijk, genereert passief inkomen en kan op elk moment worden opgenomen.'
      }
    ]
  },
  {
    title: '3. Winst en risicobeheer',
    items: [
      {
        question: 'Welke rendementen kan ik verwachten?',
        answer: 'Dagelijkse rendementen variëren tussen 0,5 % en 7 % afhankelijk van je plan, met compounding voor extra groei.'
      },
      {
        question: 'Hoe wordt het risico beheerd?',
        answer: 'Elke trade riskeert maximaal 1 % van je storting en 25 % van de winsten gaat naar een reservepool om drawdowns op te vangen.'
      }
    ]
  },
  {
    title: '4. Opnames',
    items: [
      {
        question: 'Hoe snel zijn opnames?',
        answer: 'De bot verwerkt opnames in ongeveer 3 seconden plus netwerktijd; de meeste opnames zijn binnen een minuut rond.'
      },
      {
        question: 'Zijn er verborgen kosten?',
        answer: 'Nee. Syntrix rekent geen extra kosten — alleen de gebruikelijke blockchain fee.'
      }
    ]
  },
  {
    title: '5. Referralprogramma',
    items: [
      {
        question: 'Hoe werkt het referralprogramma?',
        answer: 'Je verdient 4 % / 3 % / 2 % over drie niveaus, tot 9 % passief inkomen over de winst van je referrals.'
      },
      {
        question: 'Wanneer krijg ik referralbonussen?',
        answer: 'Referralbonussen worden dagelijks uitgekeerd samen met je reguliere planwinsten.'
      }
    ]
  },
  {
    title: '6. Support en compliance',
    items: [
      {
        question: 'Is Syntrix gereguleerd?',
        answer: 'Syntrix Algo Systems LLC is geregistreerd in Dubai en volgt compliance-richtlijnen voor algoritmisch handelen.'
      },
      {
        question: 'Hoe neem ik contact op met support?',
        answer: 'Gebruik de Support-knop in de app of het officiële Telegram-kanaal voor 24/7 hulp.'
      }
    ]
  }
]

const dutchFAQPlans = [
  'Plan Bronze: $10–$99 (0,5 % per dag)',
  'Plan Silver: $100–$499 (1 % per dag)',
  'Plan Gold: $500–$999 (2 % per dag)',
  'Plan Platinum: $1000–$4999 (3 % per dag)',
  'Plan Diamond: $5000–$19999 (5 % per dag)',
  'Plan Black: $20000–$100000 (7 % per dag)',
  'Aangepaste plannen: stortingen > $100000 (8 %+ per dag)'
]

const dutchSecuritySections: InfoSection[] = [
  {
    title: '1. Encryptie en fondsbescherming',
    lists: [
      [
        'Klantenfondsen zijn versleuteld en opgeslagen in een veilige liquidity pool. Het Syntrix-team heeft geen toegang.',
        'Voor server- en Telegrambeveiliging gebruikt Syntrix industriële encryptie:',
        'AES-256 – symmetrische encryptie voor opslag en overdracht',
        'RSA-4096 – asymmetrische encryptie voor veilige sleuteluitwisseling',
        'SHA-512 – cryptografische hashing voor integriteit en verificatie',
        'Alle botoperaties draaien in een volledig versleutelde omgeving om hacks en diefstal te voorkomen'
      ]
    ]
  },
  {
    title: '2. Liquiditeitsreservepool',
    lists: [
      [
        '25 % van de dagelijkse winsten wordt gealloceerd aan een reservepool om alle investeringen te beschermen',
        'De pool overstijgt de actieve stortingen: $53M versus $48M',
        'Bij technische storingen of “black swan”-events keert de pool automatisch alle fondsen terug',
        'Dit systeem waarborgt kapitaalsveiligheid, ook als individuele trades verlies maken'
      ]
    ]
  },
  {
    title: '3. Risicobeheer en handelsveiligheid',
    lists: [
      [
        'Maximaal risico per trade is 1 % van het deposito',
        'Risk/Reward-ratio blijft minimaal 1:5 voor stabiele groei tijdens drawdowns',
        'De bot pauzeert na drie opeenvolgende verliestrades om de strategie te herzien',
        'Ook onder extreme omstandigheden blijft het kapitaal beschermd dankzij de reservepool en strikte risicobeheersing'
      ]
    ]
  },
  {
    title: '4. Telegram-beveiliging',
    paragraphs: ['Voor maximale accountbeveiliging en toegang tot Syntrix raden we aan:'],
    lists: [
      [
        'Activeer 2FA (twee-factor-authenticatie) in Telegram',
        'Gebruik een geregistreerde simkaart om ongeoorloofde herstelpogingen te voorkomen',
        'Stel tijdens registratie een geheime vraag en antwoord in',
        'Bij verlies van telefoon of SIM herstel je toegang door saldo en geheime vraag te bevestigen',
        'Deze extra laag beschermt account en fondsen'
      ]
    ]
  },
  {
    title: '5. Serverbescherming en DDoS-mitigatie',
    lists: [
      [
        'Syntrix-servers zijn beschermd tegen DDoS-aanvallen en wereldwijd verspreid',
        'Alle servers gebruiken multi-level authenticatie om hackpogingen te minimaliseren',
        'Kritieke operaties draaien binnen een beveiligde infrastructuur die afgesloten is voor derden'
      ]
    ]
  },
  {
    title: '6. Transparantie en verificatie',
    lists: [
      [
        'Alle Syntrix-trades zijn traceerbaar via referralcodes en PNL-screenshots',
        'Verzoeken om transactiecontrole kunnen worden ingediend bij support',
        'Volledige transparantie bewijst dat Syntrix geen financiële piramide is'
      ]
    ]
  },
  {
    title: '7. Back-ups en continuïteitsplanning',
    paragraphs: ['Bij technische storingen of tijdelijke onbereikbaarheid van de bot:'],
    lists: [
      [
        'De reservepool keert automatisch alle investeringen en winsten terug aan klanten',
        'Zelfs tijdens kritieke incidenten (server-down, netwerkproblemen) verliezen gebruikers geen fondsen'
      ]
    ]
  }
]

const dutchAdvantagesSections: InfoSection[] = [
  {
    title: '1. Volledig geautomatiseerd handelen',
    lists: [
      [
        'Handelt 24/7 zonder gebruikersinterventie',
        'Gebruikt Smart Money Concepts, liquiditeitsanalyse, orderboeklezing en institutioneel risicobeheer',
        'Geen charts volgen of handmatige beslissingen nodig',
        'Genereert betrouwbaar passief inkomen met minimale inspanning'
      ]
    ]
  },
  {
    title: '2. Hoog slagingspercentage en winstgevendheid',
    lists: [
      [
        'Meer dan 90 % succesrate op basis van 5–10 jaar geteste strategieën',
        'Risk/Reward-ratio is altijd minimaal 1:5',
        'Dagelijkse winstmogelijkheden tussen 1 % en 11 % afhankelijk van het plan',
        'Geavanceerde algoritmes zorgen voor consistente resultaten, zelfs bij volatiliteit'
      ]
    ]
  },
  {
    title: '3. Maximale beveiliging en kapitaalbescherming',
    lists: [
      [
        'Klantenfondsen zijn versleuteld en ontoegankelijk voor het team',
        'De reservepool (25 % van de winsten) beschermt stortingen en opbrengsten tegen verliezen',
        'Maximaal 1 % risico per trade van je deposito',
        'Multilayer beveiliging op servers en binnen Telegram',
        'Zelfs bij zeldzame uitval of black swan events blijft kapitaal beschermd'
      ]
    ]
  },
  {
    title: '4. Instant opnames',
    lists: [
      [
        'Opnames worden in 3 seconden plus netwerktijd verwerkt',
        'Fondsen zijn altijd beschikbaar zonder blokkades of wachttijden',
        'Ondersteunt opnames in USDT of USDC voor stabiliteit tijdens volatiliteit'
      ]
    ]
  },
  {
    title: '5. Volledige transparantie',
    lists: [
      [
        'Alle trades en winsten zijn traceerbaar',
        'Volledige zichtbaarheid zorgt ervoor dat er geen verborgen operaties zijn',
        'Je kunt transacties laten verifiëren via support'
      ]
    ]
  },
  {
    title: '6. Gelicentieerd en gereguleerd',
    lists: [
      [
        'Opereren onder Syntrix Algo Systems LLC, Dubai',
        'Gelicentieerd voor algoritmische crypto trading bots',
        'Wettelijke compliance zorgt voor vertrouwen'
      ]
    ]
  },
  {
    title: '7. Flexibele wallet-functionaliteit',
    lists: [
      [
        'Syntrix werkt als een crypto wallet met hoog rendement',
        'Stortingen en opnames in minder dan een minuut',
        'Fondsen blijven beschikbaar terwijl ze passief inkomen opleveren'
      ]
    ]
  },
  {
    title: '8. Geen technische rompslomp',
    lists: [
      [
        'Geen mining hardware of energiekosten nodig',
        'Alle processen verlopen automatisch',
        'De bot beheert volatiliteit, liquiditeit en risico zonder jouw tussenkomst'
      ]
    ]
  },
  {
    title: '9. Multi-level referralprogramma',
    lists: [
      [
        'Verdien via een 3-niveaus systeem: 4 % / 3 % / 2 %',
        'Maximaal 9 % passief inkomen dankzij referenties',
        'Stimuleert organische groei zonder jouw kapitaal aan te tasten'
      ]
    ]
  },
  {
    title: '10. Telegram beveiliging geïntegreerd',
    lists: [
      [
        'Optionele 2FA beveiliging voor accounts',
        'Geheim vraag- en antwoordsysteem voor herstel',
        'Fondsen blijven veilig als je telefoon of SIM verloren gaat'
      ]
    ]
  },
  {
    title: '11. Perfect voor beginners en professionals',
    lists: [
      [
        'Geen ervaring met handelen nodig',
        'Professionals benutten geavanceerde algoritmes',
        'Ideale oplossing voor betrouwbaar crypto-inkomen'
      ]
    ]
  }
]

export const translations = {
  ENGLISH: {
    appTitle: 'Syntrix Bot',
    wallet: 'Wallet',
    invite: 'Invite',
    home: 'Home',
    calculator: 'Calculator',
    ai: 'AI',
    profile: 'Profile',
    aiAnalyticsTitle: 'AI Analytics',
    aiAnalyticsInfo: 'Info',
    aiAnalyticsInfoTitle: 'How it works',
    aiAnalyticsInfoBody:
      'Syntrix AI compares its market assessment with several independent analytical models in near real time.\n' +
      'It aggregates consensus and disagreements into a single trading signal (BUY/SELL/HOLD) and explains the key drivers behind it.\n' +
      'Signals refresh twice per hour. You can tap Update for a manual refresh, but frequent taps may be rate-limited.',
    simulated: 'Demo',
    update: 'Update',
    loading: 'Loading…',
    errorGeneric: 'Unable to load',
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
    securitySections: englishSecuritySections,
    advantagesSections: englishAdvantagesSections,
    whitepaperContent: spanishWhitepaperContent,
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
    ai: 'KI',
    profile: 'Profil',
    aiAnalyticsTitle: 'KI-Analytik',
    aiAnalyticsInfo: 'Info',
    aiAnalyticsInfoTitle: 'So funktioniert es',
    aiAnalyticsInfoBody:
      'Syntrix AI vergleicht seine Markteinschätzung nahezu in Echtzeit mit mehreren unabhängigen Analysemodellen.\n' +
      'Aus Übereinstimmungen und Abweichungen entsteht ein gemeinsames Signal (BUY/SELL/HOLD) – inklusive kurzer Begründung.\n' +
      'Die Signale werden zweimal pro Stunde aktualisiert. Mit „Aktualisieren“ kannst du manuell neu laden – zu häufiges Tippen kann jedoch durch Limits geblockt werden.',
    simulated: 'SIMULATION',
    update: 'Aktualisieren',
    loading: 'Lädt…',
    errorGeneric: 'Konnte nicht laden',
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
    securitySections: germanSecuritySections,
    advantagesSections: germanAdvantagesSections,
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
  },
  SPANISH: {
    appTitle: 'Syntrix Bot',
    wallet: 'Cartera',
    invite: 'Invitar',
    home: 'Inicio',
    calculator: 'Calculadora',
    ai: 'IA',
    profile: 'Perfil',
    aiAnalyticsTitle: 'Analítica IA',
    aiAnalyticsInfo: 'Info',
    aiAnalyticsInfoTitle: 'Cómo funciona',
    aiAnalyticsInfoBody:
      'Syntrix AI compara su lectura del mercado casi en tiempo real con varios modelos analíticos independientes.\n' +
      'Combina coincidencias y diferencias en una sola señal (BUY/SELL/HOLD) y resume los factores clave.\n' +
      'Las señales se actualizan dos veces por hora. Puedes pulsar Actualizar para refrescar manualmente, pero demasiados intentos pueden estar limitados.',
    simulated: 'SIMULACIÓN',
    update: 'Actualizar',
    loading: 'Cargando…',
    errorGeneric: 'No se pudo cargar',
    totalBalance: 'Balance total:',
    profit: 'Ganancia:',
    deposit: 'Depósito:',
    reinvest: 'REINVESTIR',
    depositBtn: 'DEPOSITAR',
    inactive: 'INACTIVO',
    leftUntilBronze: 'hasta Bronze',
    incomePlans: 'PLANES DE INGRESO',
    dailyUpdate: 'ACTUALIZACIÓN DIARIA',
    noEarningsData: 'Sin datos de ganancias',
    walletComingSoon: 'Funcionalidad de cartera próximamente',
    manageYourBalance: 'ADMINISTRA TU BALANCE',
    availableBalance: 'Balance disponible:',
    howToDeposit: 'Cómo depositar',
    withdraw: 'RETIRAR',
    howToWithdraw: 'Cómo retirar',
    transactionsHistory: 'HISTORIAL DE TRANSACCIONES',
    noTransactionsYet: 'Aún no hay transacciones',
    inviteFriends: 'Invita a amigos',
    referralBalance: 'Balance de referidos:',
    yourReferralLink: 'TU ENLACE DE REFERIDOS',
    termsOfTheProgram: 'TÉRMINOS DEL PROGRAMA',
    friendDeposit: 'Depósito de un amigo',
    earnings: 'Ganancias',
    friendOfAFriend: 'Amigo de un amigo',
    thirdLevel: 'Tercer nivel',
    yourReferrals: 'TUS REFERIDOS',
    noReferralsYet: 'Aún no hay referidos',
    linkCopied: 'Enlace copiado al portapapeles',
    calculateYourProfit: 'CALCULA TU GANANCIA',
    depositAmount: 'Monto de depósito',
    enterAmount: 'Ingresa el monto',
    timePeriodSelection: 'Selecciona el periodo',
    enterDays: 'Ingresa los días',
    reinvestToggle: 'Reinvertir',
    profitText: 'Ganancia:',
    summary: 'Resumen',
    totalProfit: 'GANANCIA TOTAL:',
    totalFunds: 'FONDOS TOTALES:',
    leaderboard: 'Tabla de líderes',
    accountBalance: 'Saldo de la cuenta:',
    referralEarnings: 'Ganancias por referidos:',
    totalReferrals: 'Total de referidos:',
    welcome: 'Bienvenido a Syntrix',
    websiteLink: 'Sitio web',
    verifyWithSyntrix: 'Verificar con Syntrix',
    languageChanged: 'Idioma cambiado a',
    idCopied: 'ID copiada',
    back: 'Atrás',
    selectCurrency: 'Selecciona la moneda',
    enterAmountDollar: 'Ingresa el monto en $',
    continue: 'CONTINUAR',
    faqTitle: 'SYNTRIX — PREGUNTAS FRECUENTES',
    faqSubtitle: 'Preguntas frecuentes',
    faqDescription: 'Respuestas a las dudas más comunes sobre Syntrix',
    securityTitle: 'Seguridad',
    whitepaperTitle: 'WhitePaper de SYNTRIX',
    withdrawTitle: 'RETIRAR GANANCIAS',
    incomePlansTitle: 'Planes de ingreso',
    tableDeposit: 'Depósito',
    tableDailyProfit: 'Ganancia diaria',
    advantagesTitle: 'Ventajas',
    advantagesSubtitle: 'Por qué elegir Syntrix',
    advantagesDescription: 'Descubre los beneficios que hacen de Syntrix la mejor opción para inversionistas cripto',
    securitySubtitle: 'Seguridad de Syntrix',
    securityDescription: 'Protección multicapa para tu inversión y tranquilidad',
    securitySections: spanishSecuritySections,
    advantagesSections: spanishAdvantagesSections,
    whitepaperContent: spanishWhitepaperContent,
    faqIntro: 'Encuentra respuestas a las preguntas más frecuentes y comienza más rápido con Syntrix.',
    faqSections: spanishFAQSections,
    faqPlansTitle: 'Planes de ingreso',
    faqPlans: spanishFAQPlans,
    close: 'Cerrar',
    plan: 'Plan',
    minAmount: 'Monto mínimo',
    dailyPercent: '% diario',
    selectLanguage: 'Seleccionar idioma',
    approximateCalculation: 'Cálculo aproximado',
    day: 'día',
    profileTitle: 'Perfil',
    id: 'ID',
    nickname: 'Apodo',
    currentPlan: 'Plan actual',
    status: 'Estado',
    language: 'Idioma',
    support: 'Soporte',
    advantages: 'Ventajas',
    whitepaperLabel: 'WhitePaper',
    security: 'Seguridad',
    website: 'Sitio',
    faq: 'Preguntas',
    welcomeMatrix: 'BIENVENIDO A SYNTRIX',
    profitsNotRandom: 'Las ganancias no son al azar'
  },
  FRENCH: {
    appTitle: 'Syntrix Bot',
    wallet: 'Portefeuille',
    invite: 'Inviter',
    home: 'Accueil',
    calculator: 'Calculatrice',
    ai: 'IA',
    profile: 'Profil',
    aiAnalyticsTitle: 'Analytique IA',
    aiAnalyticsInfo: 'Info',
    aiAnalyticsInfoTitle: 'Comment ça marche',
    aiAnalyticsInfoBody:
      'Syntrix AI compare son analyse du marché, quasi en temps réel, avec plusieurs modèles indépendants.\n' +
      'Elle synthétise les convergences et divergences en un seul signal (BUY/SELL/HOLD) et en résume les principaux facteurs.\n' +
      'Les signaux sont mis à jour deux fois par heure. Vous pouvez appuyer sur Mettre à jour pour rafraîchir manuellement, mais des clics trop fréquents peuvent être limités.',
    simulated: 'SIMULATION',
    update: 'Mettre à jour',
    loading: 'Chargement…',
    errorGeneric: 'Impossible de charger',
    totalBalance: 'Solde total :',
    profit: 'Profit :',
    deposit: 'Dépôt :',
    reinvest: 'RÉINVESTIR',
    depositBtn: 'DÉPOSER',
    inactive: 'INACTIF',
    leftUntilBronze: 'jusqu\'à Bronze',
    incomePlans: 'PLANS DE REVENU',
    dailyUpdate: 'MISE À JOUR QUOTIDIENNE',
    noEarningsData: 'Pas de données de gains',
    walletComingSoon: 'Fonctionnalité portefeuille bientôt disponible',
    manageYourBalance: 'GÉREZ VOTRE SOLDE',
    availableBalance: 'Solde disponible :',
    howToDeposit: 'Comment déposer',
    withdraw: 'RETIRER',
    howToWithdraw: 'Comment retirer',
    transactionsHistory: 'HISTORIQUE DES TRANSACTIONS',
    noTransactionsYet: 'Pas encore de transactions',
    inviteFriends: 'Invitez des amis',
    referralBalance: 'Solde de parrainage :',
    yourReferralLink: 'VOTRE LIEN DE PARRAINAGE',
    termsOfTheProgram: 'CONDITIONS DU PROGRAMME',
    friendDeposit: 'Dépôt d’un ami',
    earnings: 'Gains',
    friendOfAFriend: 'Ami d’un ami',
    thirdLevel: 'Troisième niveau',
    yourReferrals: 'VOS PARRAINAGES',
    noReferralsYet: 'Pas encore de parrainages',
    linkCopied: 'Lien copié dans le presse-papiers',
    calculateYourProfit: 'CALCULEZ VOTRE GAIN',
    depositAmount: 'Montant du dépôt',
    enterAmount: 'Entrez un montant',
    timePeriodSelection: 'Sélection de la période',
    enterDays: 'Entrez les jours',
    reinvestToggle: 'Réinvestir',
    profitText: 'Profit :',
    summary: 'Résumé',
    totalProfit: 'GAIN TOTAL :',
    totalFunds: 'FONDS TOTAUX :',
    leaderboard: 'Classement',
    accountBalance: 'Solde du compte :',
    referralEarnings: 'Gains de parrainage :',
    totalReferrals: 'Total des parrainages :',
    welcome: 'Bienvenue chez Syntrix',
    websiteLink: 'Site Web',
    verifyWithSyntrix: 'Vérifier avec Syntrix',
    languageChanged: 'Langue changée en',
    idCopied: 'ID copiée',
    back: 'Retour',
    selectCurrency: 'Sélectionner la devise',
    enterAmountDollar: 'Entrez le montant $',
    continue: 'CONTINUER',
    faqTitle: 'SYNTRIX — FAQ',
    faqSubtitle: 'Foire aux questions',
    faqDescription: 'Réponses aux questions fréquentes sur Syntrix',
    securityTitle: 'Sécurité',
    whitepaperTitle: 'Livre Blanc SYNTRIX',
    withdrawTitle: 'RETIRER LES GAINS',
    incomePlansTitle: 'Plans de revenu',
    tableDeposit: 'Dépôt',
    tableDailyProfit: 'Gain quotidien',
    advantagesTitle: 'Avantages',
    advantagesSubtitle: 'Pourquoi choisir Syntrix',
    advantagesDescription: 'Découvrez les bénéfices qui font de Syntrix le meilleur choix pour les investisseurs crypto',
    securitySubtitle: 'Sécurité Syntrix',
    securityDescription: 'Protection multi-niveaux pour vos investissements et votre tranquillité',
    securitySections: frenchSecuritySections,
    advantagesSections: frenchAdvantagesSections,
    whitepaperContent: frenchWhitepaperContent,
    faqIntro: 'Trouvez des réponses aux questions les plus fréquentes sur Syntrix et démarrez plus vite.',
    faqSections: frenchFAQSections,
    faqPlansTitle: 'Plans de revenu',
    faqPlans: frenchFAQPlans,
    advantage1Title: '1. Trading entièrement automatisé',
    advantage1Text1: '• Opère 24h/24 et 7j/7 sans intervention utilisateur',
    advantage1Text2: '• Utilise Smart Money Concepts et des stratégies institutionnelles de gestion des risques',
    advantage1Text3: '• Pas besoin de surveiller les graphiques ou de prendre des décisions manuelles',
    advantage1Text4: '• Génère un revenu passif fiable avec un minimum d\'effort',
    advantage2Title: '2. Taux de réussite élevé et rentabilité',
    advantage2Text1: '• Taux de réussite supérieur à 90 % basé sur 5-10 ans de stratégies testées',
    advantage2Text2: '• Ratio risque/rendement toujours au moins 1:5',
    advantage2Text3: '• Potentiel de gain quotidien de 1 % à 11 % selon votre plan',
    advantage2Text4: '• Des algorithmes avancés assurent une croissance constante même en marchés volatils',
    advantage3Title: '3. Sécurité maximale et protection du capital',
    advantage3Text1: '• Les fonds clients sont chiffrés et inaccessibles à l\'équipe',
    advantage3Text2: '• Le pool de réserve (25 % des gains) protège dépôts et profits contre les pertes',
    advantage3Text3: '• Risque maximal par trade de 1 % du dépôt',
    advantage3Text4: '• Sécurité multicouche sur les serveurs et dans Telegram',
    advantage3Text5: '• Même avec des pannes techniques rares ou événements imprévus, le capital reste protégé',
    advantage4Title: '4. Retraits instantanés',
    advantage4Text1: '• Retraits traités par le bot en 3 secondes, plus le temps réseau',
    advantage4Text2: '• Les fonds sont toujours disponibles ; pas de blocages ni d\'attente',
    advantage4Text3: '• Prend en charge les retraits en USDT ou USDC pour rester stable face à la volatilité',
    advantage5Title: '5. Transparence totale',
    advantage5Text1: '• Toutes les opérations et profits sont traçables',
    advantage5Text2: '• Une visibilité complète garantit l\'absence d\'opérations cachées',
    advantage5Text3: '• Les utilisateurs peuvent demander la vérification des transactions',
    advantage6Title: '6. Licencié et réglementé',
    advantage6Text1: '• Opère sous Syntrix Algo Systems LLC, Dubaï',
    advantage6Text2: '• Titulaire d\'une licence pour les bots de trading algorithmique crypto',
    advantage6Text3: '• La conformité juridique inspire confiance',
    advantage7Title: '7. Fonctionnalité wallet flexible',
    advantage7Text1: '• Syntrix peut servir de wallet crypto à haut rendement',
    advantage7Text2: '• Dépôts et retraits en moins d\'une minute',
    advantage7Text3: '• Les fonds restent accessibles tout en générant du revenu',
    advantage8Title: '8. Sans complications techniques',
    advantage8Text1: '• Aucun matériel de minage ni coût d\'électricité requis',
    advantage8Text2: '• Toutes les opérations sont automatisées',
    advantage8Text3: '• Le bot gère la volatilité et le risque',
    advantage9Title: '9. Programme de parrainage multi-niveaux',
    advantage9Text1: '• Gagnez via un système à 3 niveaux : 4 % / 3 % / 2 %',
    advantage9Text2: '• Revenu passif maximal de 9 % grâce aux parrainages',
    advantage9Text3: '• Encourage une croissance organique',
    advantage10Title: '10. Intégration de sécurité Telegram',
    advantage10Text1: '• Protection 2FA optionnelle pour les comptes utilisateur',
    advantage10Text2: '• Système question/réponse secrète pour la récupération',
    advantage10Text3: '• Les fonds restent sécurisés même si le téléphone est perdu',
    advantage11Title: '11. Idéal pour débutants et professionnels',
    advantage11Text1: '• Aucune expérience en trading requise',
    advantage11Text2: '• Les professionnels exploitent des algorithmes avancés',
    advantage11Text3: '• Solution parfaite pour un revenu crypto fiable',
    close: 'Fermer',
    plan: 'Plan',
    minAmount: 'Montant min',
    dailyPercent: '% journalier',
    selectLanguage: 'Choisir la langue',
    approximateCalculation: 'Calcul approximatif',
    day: 'jour',
    profileTitle: 'Profil',
    id: 'ID',
    nickname: 'Pseudo',
    currentPlan: 'Plan actuel',
    status: 'Statut',
    language: 'Langue',
    support: 'Support',
    advantages: 'Avantages',
    whitepaperLabel: 'Livre Blanc',
    security: 'Sécurité',
    website: 'Site',
    faq: 'FAQ',
    welcomeMatrix: 'BIENVENUE CHEZ SYNTRIX',
    profitsNotRandom: 'Les gains ne sont pas aléatoires'
  },
  ITALIAN: {
    appTitle: 'Syntrix Bot',
    wallet: 'Portafoglio',
    invite: 'Invita',
    home: 'Home',
    calculator: 'Calcolatrice',
    ai: 'IA',
    profile: 'Profilo',
    aiAnalyticsTitle: 'Analisi IA',
    aiAnalyticsInfo: 'Info',
    aiAnalyticsInfoTitle: 'Come funziona',
    aiAnalyticsInfoBody:
      'Syntrix AI confronta la propria lettura del mercato quasi in tempo reale con diversi modelli analitici indipendenti.\n' +
      'Sintetizza convergenze e differenze in un unico segnale (BUY/SELL/HOLD) e ne riassume i fattori chiave.\n' +
      'I segnali si aggiornano due volte all’ora. Puoi premere Aggiorna per un refresh manuale, ma tocchi troppo frequenti possono essere limitati.',
    simulated: 'SIMULAZIONE',
    update: 'Aggiorna',
    loading: 'Caricamento…',
    errorGeneric: 'Impossibile caricare',
    totalBalance: 'Saldo totale :',
    profit: 'Profitto :',
    deposit: 'Deposito :',
    reinvest: 'REINVESTI',
    depositBtn: 'DEPOSITA',
    inactive: 'INATTIVO',
    leftUntilBronze: 'fino a Bronze',
    incomePlans: 'Piani di reddito',
    dailyUpdate: 'AGGIORNAMENTO QUOTIDIANO',
    noEarningsData: 'Nessun dato di guadagno',
    walletComingSoon: 'Funzionalità wallet in arrivo',
    manageYourBalance: 'GESTISCI IL TUO SALDO',
    availableBalance: 'Saldo disponibile :',
    howToDeposit: 'Come depositare',
    withdraw: 'RITIRA',
    howToWithdraw: 'Come ritirare',
    transactionsHistory: 'STORICO TRANSAZIONI',
    noTransactionsYet: 'Ancora nessuna transazione',
    inviteFriends: 'Invita amici',
    referralBalance: 'Saldo referral :',
    yourReferralLink: 'IL TUO LINK DI REFERRAL',
    termsOfTheProgram: 'TERMINI DEL PROGRAMMA',
    friendDeposit: 'Deposito di un amico',
    earnings: 'Guadagni',
    friendOfAFriend: 'Amico di un amico',
    thirdLevel: 'Terzo livello',
    yourReferrals: 'I TUOI REFERRAL',
    noReferralsYet: 'Ancora nessun referral',
    linkCopied: 'Link copiato negli appunti',
    calculateYourProfit: 'CALCOLA IL TUO GUADAGNO',
    depositAmount: 'Importo deposito',
    enterAmount: 'Inserisci importo',
    timePeriodSelection: 'Seleziona il periodo',
    enterDays: 'Inserisci i giorni',
    reinvestToggle: 'Reinvesti',
    profitText: 'Profitto :',
    summary: 'Riepilogo',
    totalProfit: 'PROFITTO TOTALE :',
    totalFunds: 'FONDI TOTALI :',
    leaderboard: 'Classifica',
    accountBalance: 'Saldo conto :',
    referralEarnings: 'Guadagni referral :',
    totalReferrals: 'Totale referral :',
    welcome: 'Benvenuto in Syntrix',
    websiteLink: 'Sito web',
    verifyWithSyntrix: 'Verifica con Syntrix',
    languageChanged: 'Lingua cambiata in',
    idCopied: 'ID copiata',
    back: 'Indietro',
    selectCurrency: 'Seleziona valuta',
    enterAmountDollar: 'Inserisci importo $',
    continue: 'CONTINUA',
    faqTitle: 'SYNTRIX — FAQ',
    faqSubtitle: 'Domande frequenti',
    faqDescription: 'Risposte alle domande più comuni su Syntrix',
    securityTitle: 'Sicurezza',
    whitepaperTitle: 'WhitePaper Syntrix',
    withdrawTitle: 'RITIRA I GUADAGNI',
    incomePlansTitle: 'Piani di reddito',
    tableDeposit: 'Deposito',
    tableDailyProfit: 'Profitto giornaliero',
    advantagesTitle: 'Vantaggi',
    advantagesSubtitle: 'Perché scegliere Syntrix',
    advantagesDescription: 'Scopri i benefici che rendono Syntrix la scelta migliore per gli investitori crypto',
    securitySubtitle: 'Sicurezza Syntrix',
    securityDescription: 'Protezione multilivello per i tuoi investimenti e la tua tranquillità',
    securitySections: italianSecuritySections,
    advantagesSections: italianAdvantagesSections,
    whitepaperContent: italianWhitepaperContent,
    faqIntro: 'Trova risposte alle domande frequenti su Syntrix e inizia più velocemente.',
    faqSections: italianFAQSections,
    faqPlansTitle: 'Piani di reddito',
    faqPlans: italianFAQPlans,
    advantage1Title: '1. Trading completamente automatizzato',
    advantage1Text1: '• Opera 24/7 senza interventi manuali',
    advantage1Text2: '• Usa Smart Money Concepts e strategie istituzionali di gestione del rischio',
    advantage1Text3: '• Non serve monitorare i grafici o prendere decisioni manuali',
    advantage1Text4: '• Genera reddito passivo affidabile con minimo sforzo',
    advantage2Title: '2. Alto tasso di successo e redditività',
    advantage2Text1: '• Successo oltre il 90 % grazie a strategie testate 5-10 anni',
    advantage2Text2: '• Rapporto rischio/ricompensa sempre almeno 1:5',
    advantage2Text3: '• Potenziale di guadagno giornaliero tra 1 % e 11 % a seconda del piano',
    advantage2Text4: '• Algoritmi avanzati garantiscono guadagni costanti anche in mercati volatili',
    advantage3Title: '3. Massima sicurezza e protezione del capitale',
    advantage3Text1: '• I fondi sono crittografati e inaccessibili al team',
    advantage3Text2: '• Pool di riserva (25 % dei profitti) protegge depositi e rendimenti',
    advantage3Text3: '• Rischio massimo per trade 1 % del deposito',
    advantage3Text4: '• Sicurezza multilivello sui server e all\'interno di Telegram',
    advantage3Text5: '• Anche in eventi tecnici rari il capitale resta protetto',
    advantage4Title: '4. Prelievi istantanei',
    advantage4Text1: '• Prelievi gestiti dal bot in 3 secondi più tempo di rete',
    advantage4Text2: '• Fondi sempre disponibili, senza blocchi o attese',
    advantage4Text3: '• Supporta prelievi in USDT o USDC per stabilità contro la volatilità',
    advantage5Title: '5. Trasparenza totale',
    advantage5Text1: '• Tutti i trade e i profitti sono tracciabili',
    advantage5Text2: '• Visibilità completa garantisce nessuna operazione nascosta',
    advantage5Text3: '• Puoi richiedere verifiche delle transazioni al supporto',
    advantage6Title: '6. Licenziato e regolamentato',
    advantage6Text1: '• Opera come Syntrix Algo Systems LLC, Dubai',
    advantage6Text2: '• Autorizzato per bot di trading algoritmico crypto',
    advantage6Text3: '• Compliance legale crea fiducia',
    advantage7Title: '7. Funzionalità wallet flessibile',
    advantage7Text1: '• Syntrix può essere usato come wallet ad alto rendimento',
    advantage7Text2: '• Depositi e prelievi in meno di un minuto',
    advantage7Text3: '• I fondi restano accessibili mentre generano reddito',
    advantage8Title: '8. Nessuna complicazione tecnica',
    advantage8Text1: '• Nessuna attrezzatura di mining o costi elettrici',
    advantage8Text2: '• Tutte le operazioni sono automatizzate',
    advantage8Text3: '• Il bot gestisce volatilità e rischio automaticamente',
    advantage9Title: '9. Programma referral multi-livello',
    advantage9Text1: '• Guadagna tramite 3 livelli: 4 % / 3 % / 2 %',
    advantage9Text2: '• Reddito passivo massimo del 9 % dai referral',
    advantage9Text3: '• Favorisce crescita organica senza intaccare il capitale',
    advantage10Title: '10. Sicurezza Telegram integrata',
    advantage10Text1: '• Protezione 2FA opzionale per l\'account',
    advantage10Text2: '• Domanda/risposta segreta per recuperare l\'accesso',
    advantage10Text3: '• I fondi restano protetti anche se perdi telefono o SIM',
    advantage11Title: '11. Ideale per principianti e professionisti',
    advantage11Text1: '• Non serve esperienza di trading',
    advantage11Text2: '• I professionisti sfruttano algoritmi avanzati',
    advantage11Text3: '• Soluzione perfetta per reddito crypto affidabile',
    close: 'Chiudi',
    plan: 'Piano',
    minAmount: 'Importo min',
    dailyPercent: '% giornaliero',
    selectLanguage: 'Seleziona lingua',
    approximateCalculation: 'Calcolo approssimato',
    day: 'giorno',
    profileTitle: 'Profilo',
    id: 'ID',
    nickname: 'Nickname',
    currentPlan: 'Piano attuale',
    status: 'Stato',
    language: 'Lingua',
    support: 'Supporto',
    advantages: 'Vantaggi',
    whitepaperLabel: 'WhitePaper',
    security: 'Sicurezza',
    website: 'Sito',
    faq: 'FAQ',
    welcomeMatrix: 'BENVENUTO IN SYNTRIX',
    profitsNotRandom: 'I profitti non sono casuali'
  },
  DUTCH: {
    appTitle: 'Syntrix Bot',
    wallet: 'Portemonnee',
    invite: 'Uitnodigen',
    home: 'Home',
    calculator: 'Calculator',
    ai: 'AI',
    profile: 'Profiel',
    aiAnalyticsTitle: 'AI-analytiek',
    aiAnalyticsInfo: 'Info',
    aiAnalyticsInfoTitle: 'Hoe het werkt',
    aiAnalyticsInfoBody:
      'Syntrix AI vergelijkt zijn marktinschatting vrijwel realtime met meerdere onafhankelijke analysemethoden.\n' +
      'Het combineert overeenkomsten en verschillen tot één signaal (BUY/SELL/HOLD) en vat de belangrijkste redenen samen.\n' +
      'Signalen verversen twee keer per uur. Je kunt op Bijwerken drukken voor een handmatige refresh, maar te vaak tikken kan worden gelimiteerd.',
    simulated: 'SIMULATIE',
    update: 'Bijwerken',
    loading: 'Laden…',
    errorGeneric: 'Kan niet laden',
    totalBalance: 'Totaalsaldo:',
    profit: 'Winst:',
    deposit: 'Storting:',
    reinvest: 'HERINVESTEREN',
    depositBtn: 'STORTEN',
    inactive: 'INACTIEF',
    leftUntilBronze: 'tot Bronze',
    incomePlans: 'INKOMSTPLANNEN',
    dailyUpdate: 'DAGELIJKSE UPDATE',
    noEarningsData: 'Geen winstgegevens',
    walletComingSoon: 'Wallet-functionaliteit binnenkort beschikbaar',
    manageYourBalance: 'BEHEER JE SALDO',
    availableBalance: 'Beschikbaar saldo:',
    howToDeposit: 'Hoe stort ik',
    withdraw: 'OPNEMEN',
    howToWithdraw: 'Hoe op te nemen',
    transactionsHistory: 'TRANSACTIEGESCHIEDENIS',
    noTransactionsYet: 'Nog geen transacties',
    inviteFriends: 'Nodig vrienden uit',
    referralBalance: 'Referral saldo:',
    yourReferralLink: 'JOUW REFERRALLINK',
    termsOfTheProgram: 'PROGRAMMACONDITIES',
    friendDeposit: 'Storting van een vriend',
    earnings: 'Winst',
    friendOfAFriend: 'Vriend van een vriend',
    thirdLevel: 'Derde niveau',
    yourReferrals: 'JOUW REFERRALS',
    noReferralsYet: 'Nog geen referrals',
    linkCopied: 'Link gekopieerd naar clipboard',
    calculateYourProfit: 'BEREKEN JE WINST',
    depositAmount: 'Stortingsbedrag',
    enterAmount: 'Voer bedrag in',
    timePeriodSelection: 'Kies periode',
    enterDays: 'Voer dagen in',
    reinvestToggle: 'Herinvesteren',
    profitText: 'Winst:',
    summary: 'Samenvatting',
    totalProfit: 'TOTALE WINST:',
    totalFunds: 'TOTALE MIDDELEN:',
    leaderboard: 'Ranglijst',
    accountBalance: 'Rekeningsaldo:',
    referralEarnings: 'Referral opbrengst:',
    totalReferrals: 'Totaal referrals:',
    welcome: 'Welkom bij Syntrix',
    websiteLink: 'Website',
    verifyWithSyntrix: 'Verifieer met Syntrix',
    languageChanged: 'Taal gewijzigd naar',
    idCopied: 'ID gekopieerd',
    back: 'Terug',
    selectCurrency: 'Selecteer valuta',
    enterAmountDollar: 'Voer bedrag in $',
    continue: 'DOORGAAN',
    faqTitle: 'SYNTRIX — FAQ',
    faqSubtitle: 'Veelgestelde vragen',
    faqDescription: 'Vind antwoorden op vaak gestelde vragen over Syntrix',
    securityTitle: 'Beveiliging',
    whitepaperTitle: 'Whitepaper van Syntrix',
    withdrawTitle: 'WINST OPNEMEN',
    incomePlansTitle: 'Inkomstplannen',
    tableDeposit: 'Storting',
    tableDailyProfit: 'Dagelijkse winst',
    advantagesTitle: 'Voordelen',
    advantagesSubtitle: 'Waarom Syntrix kiezen',
    advantagesDescription: 'Ontdek de unieke voordelen die Syntrix tot de beste keuze voor crypto-investeerders maken',
    securitySubtitle: 'Syntrix beveiliging',
    securityDescription: 'Meerdere beschermingslagen voor je investering en gemoedsrust',
    securitySections: dutchSecuritySections,
    advantagesSections: dutchAdvantagesSections,
    whitepaperContent: dutchWhitepaperContent,
    faqIntro: 'Vind antwoorden op de meest gestelde vragen en begin sneller.',
    faqSections: dutchFAQSections,
    faqPlansTitle: 'Inkomstplannen',
    faqPlans: dutchFAQPlans,
    advantage1Title: '1. Volledig geautomatiseerd handelen',
    advantage1Text1: '• Handelt 24/7 zonder gebruikersinterventie',
    advantage1Text2: '• Gebruikt Smart Money Concepts en institutionele risicobeheerstrategieën',
    advantage1Text3: '• Geen grafieken of handmatige beslissingen nodig',
    advantage1Text4: '• Genereert betrouwbaar passief inkomen met minimale inspanning',
    advantage2Title: '2. Hoog slagingspercentage en winstgevendheid',
    advantage2Text1: '• Meer dan 90 % succesratio gebaseerd op 5–10 jaar geteste strategieën',
    advantage2Text2: '• Risk/Reward-ratio blijft minimaal 1:5',
    advantage2Text3: '• Dagelijks winstpotentieel van 1 % tot 11 % afhankelijk van je abonnement',
    advantage2Text4: '• Geavanceerde algoritmes leveren constante winsten tijdens volatiliteit',
    advantage3Title: '3. Maximale beveiliging en kapitaalbescherming',
    advantage3Text1: '• Klantenfondsen zijn versleuteld en ontoegankelijk',
    advantage3Text2: '• Reservepool (25 % van de winsten) beschermt stortingen en opbrengsten tegen verliezen',
    advantage3Text3: '• Maximaal 1 % risico per trade van je storting',
    advantage3Text4: '• Multilayer beveiliging op servers en binnen Telegram',
    advantage3Text5: '• Zelfs bij zeldzame storingen blijft kapitaal beschermd',
    advantage4Title: '4. Instant opnames',
    advantage4Text1: '• Opnames in 3 seconden plus netwerktijd',
    advantage4Text2: '• Fondsen zijn altijd beschikbaar zonder blokkades',
    advantage4Text3: '• Ondersteunt opnames in USDT of USDC voor stabiliteit tegen volatiliteit',
    advantage5Title: '5. Volledige transparantie',
    advantage5Text1: '• Alle trades en winsten zijn traceerbaar',
    advantage5Text2: '• Volledige zichtbaarheid voorkomt verborgen operaties',
    advantage5Text3: '• Je kunt transacties laten verifiëren via support',
    advantage6Title: '6. Gelicentieerd en gereguleerd',
    advantage6Text1: '• Opereren onder Syntrix Algo Systems LLC, Dubai',
    advantage6Text2: '• Gelicenseerd voor algoritmische crypto trading bots',
    advantage6Text3: '• Juridische compliance creëert vertrouwen',
    advantage7Title: '7. Flexibele wallet-functionaliteit',
    advantage7Text1: '• Syntrix werkt als wallet met hoog rendement',
    advantage7Text2: '• Stortingen en opnames duren minder dan een minuut',
    advantage7Text3: '• Fondsen blijven bereikbaar terwijl ze inkomsten genereren',
    advantage8Title: '8. Geen technische rompslomp',
    advantage8Text1: '• Geen mining hardware of energiekosten vereist',
    advantage8Text2: '• Alles verloopt automatisch',
    advantage8Text3: '• De bot beheert volatiliteit en risico zonder jouw input',
    advantage9Title: '9. Multi-level referralprogramma',
    advantage9Text1: '• Verdien via een 3-niveaus systeem: 4 % / 3 % / 2 %',
    advantage9Text2: '• Maximaal 9 % passief inkomen dankzij referrals',
    advantage9Text3: '• Stimuleert organische groei zonder jouw kapitaal aan te tasten',
    advantage10Title: '10. Telegram beveiligingsintegratie',
    advantage10Text1: '• Optionele 2FA voor accounts',
    advantage10Text2: '• Geheim vraag-en-antwoord systeem voor herstel',
    advantage10Text3: '• Fondsen blijven veilig als je telefoon of SIM wordt verloren',
    advantage11Title: '11. Perfect voor beginners en professionals',
    advantage11Text1: '• Geen ervaring met handelen nodig',
    advantage11Text2: '• Professionals benutten geavanceerde algoritmes',
    advantage11Text3: '• Ideale oplossing voor betrouwbaar crypto-inkomen',
    close: 'Sluiten',
    plan: 'Plan',
    minAmount: 'Minimaal bedrag',
    dailyPercent: 'Dagelijks %',
    selectLanguage: 'Selecteer taal',
    approximateCalculation: 'Geschatte berekening',
    day: 'dag',
    profileTitle: 'Profiel',
    id: 'ID',
    nickname: 'Bijnaam',
    currentPlan: 'Huidig plan',
    status: 'Status',
    language: 'Taal',
    support: 'Support',
    advantages: 'Voordelen',
    whitepaperLabel: 'WhitePaper',
    security: 'Beveiliging',
    website: 'Website',
    faq: 'FAQ',
    welcomeMatrix: 'WELKOM BIJ SYNTRIX',
    profitsNotRandom: 'Winsten zijn geen toeval'
  },
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.ENGLISH
