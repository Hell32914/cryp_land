// Translation system for Syntrix app
// Note: Full FAQ/Security/Whitepaper content removed due to TypeScript compilation limits
// Only essential UI translations are included

import { englishWhitepaperContent, germanWhitepaperContent } from './whitepaperContent'

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
    securitySections: englishSecuritySections,
    advantagesSections: englishAdvantagesSections,
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
    profile: 'Perfil',
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
    whitepaperContent: englishWhitepaperContent,
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
  }
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.ENGLISH
