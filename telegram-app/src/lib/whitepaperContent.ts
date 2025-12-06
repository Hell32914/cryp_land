export type WhitepaperParagraph =
  | string
  | {
      text: string
      semibold?: boolean
      indent?: boolean
      boldPrefix?: string
    }
export type WhitepaperListItem = string | { boldPrefix: string; text: string }
export type WhitepaperSection = {
  title: string
  paragraphs?: WhitepaperParagraph[]
  lists?: WhitepaperListItem[][]
}
export type WhitepaperContent = {
  title: string
  sections: WhitepaperSection[]
}

export const englishWhitepaperContent: WhitepaperContent = {
  title: 'Syntrix WhitePaper',
  sections: [
    {
      title: '1. Introduction',
      paragraphs: [
        'Syntrix is a next-generation trading algorithm bot, built on Smart Money Concepts (SMC), liquidity analysis, order book analysis, and institutional risk management strategies. Syntrix delivers consistent performance in an unpredictable market through a proven and continuously optimized algorithm.',
        'Syntrix can also be used as a wallet with passive income:',
        'Syntrix combines bank-level reliability, scalper-level speed, and blockchain transparency.'
      ],
      lists: [
        [
          "Assets are accessible unless it's margin used in opened trade",
          'Withdrawal speed: processed by the bot in up to 3 seconds, plus network transaction time',
          'Secure storage and transparency: blockchain-level verification of transactions'
        ]
      ]
    },
    {
      title: '2. Problems in Traditional Trading',
      paragraphs: [
        'Traditional trading challenges:',
        'Syntrix solutions:',
        'Example calculation:',
        'Trading specifics:'
      ],
      lists: [
        [
          'Requires years of market experience to generate stable income',
          'Requires 24/7 monitoring to avoid missed opportunities',
          'Emotions often lead to poor decisions',
          'Mistakes can result in capital loss'
        ],
        [
          'Fully automated passive income',
          'Strategies are backtested for 5–10 years, win-rate above 90%',
          'Strict risk management: maximum 1% risk per trade'
        ],
        [
          'Bot capital: $1,000,000',
          'Risk per trade: $10,000 (1%)',
          'Risk/Reward ratio: 1:5',
          'A $10,000 loss is covered by the next profitable trade of $50,000',
          'Maximum consecutive losses: 2',
          'Maximum consecutive wins: up to 17'
        ],
        [
          'Trades only cryptocurrency pairs',
          'Trade duration: 30–60 minutes',
          'Trades per day: 17–30'
        ]
      ]
    },
    {
      title: '3. Security and Liquidity Pool',
      paragraphs: [
        'Syntrix provides investor protection through a three-level security system:',
        { text: '1. 50% of profits — client payouts', semibold: true },
        { text: '2. 25% of profits — liquidity reserve pool', semibold: true },
        { text: '3. 25% of profits — team and development', semibold: true }
      ],
      lists: [
        [
          'Half of daily profits are distributed to investors',
          'Syntrix delivers consistent performance through proven and continuously optimized algorithms'
        ],
        [
          'Funds stored in an encrypted wallet, inaccessible to the team',
          'Current reserve pool exceeds investments: $53M vs $48M'
        ],
        [
          '25% of net profit after all investor payouts is retained',
          'Funds allocated to salaries, dividends, bot development, and ecosystem growth',
          'Creates a win-win scenario for both investors and the team'
        ]
      ]
    },
    {
      title: '4. Who Developed Syntrix',
      paragraphs: [
        'Syntrix is developed by a team of 40+ specialists, including developers, cybersecurity experts, and support staff. The core leadership consists of former employees of major market-making firms and crypto exchanges such as Binance, OKX, and MEX.',
        { text: 'Market makers are professionals managing exchange liquidity:', semibold: true },
        'Syntrix leverages 5–10 years of experience in trading, IT, and cybersecurity. The compact team (~50 people) includes C-level experts who built the infrastructure for major exchanges.'
      ],
      lists: [
        ['Create and balance orders to match supply and demand', 'Maintain order book depth and trading stability', 'Develop internal protocols and ensure platform security']
      ]
    },
    {
      title: '5. Registration and Jurisdiction',
      paragraphs: [
        'Syntrix is registered in Dubai as Syntrix Algo Systems LLC.',
        { text: 'Reasons for Dubai registration:', semibold: true },
        'Approximately 80% of the team is based in Dubai, the rest work remotely worldwide.'
      ],
      lists: [['Zero taxation for cryptocurrency businesses', 'High security and legal stability']]
    },
    {
      title: '6. Betriebsdauer und offene Beta',
      paragraphs: [
        { boldPrefix: 'Closed beta:', text: '6 years, generating stable profits for the team and private partners' },
        { boldPrefix: 'Open beta:', text: '9+ months, allowing ordinary users with small capital to participate and earn' }
      ]
    },
    {
      title: '7. Unterstützte Währungen',
      lists: [[
        'Supports all major cryptocurrencies: USDT, USDC, ETH, Solana, Bitcoin',
        'Deposits are automatically converted to USDT for internal trading',
        'Profit is credited in stablecoins, protecting against market volatility',
        'Withdrawals available only in USDT or USDC'
      ]]
    },
    {
      title: '8. Auszahlungsverarbeitung',
      paragraphs: [
        { boldPrefix: 'Bot processing:', text: '3 seconds' },
        { boldPrefix: 'Network time:', text: '' },
        { boldPrefix: 'Total withdrawal:', text: 'under 1 minute' }
      ],
      lists: [['USDT BEP20 — up to 20 seconds', 'Ethereum — slightly longer']]
    },
    {
      title: '9. Risiko von Kapitalverlusten',
      lists: [[
        'Maximum risk per trade: 1% of deposit',
        '25% of profits retained in liquidity reserve to protect against "black swan" events',
        'Client funds are encrypted and inaccessible to the team',
        'Multi-layered security implemented by experts from Binance and other exchanges',
        'Even during consecutive losing trades, investor capital is protected',
        'Withdrawals exceeding 10% of the account balance without prior notice may negatively affect the trading process and trigger liquidation of certain positions',
        'All trading operations are carried out at the full discretion and responsibility of the user'
      ]]
    },
    {
      title: '10. Liquiditätsreserve-Pool',
      lists: [['25% of profits are set aside daily', 'Pool exceeds current investments: $53M vs $48M']]
    },
    {
      title: '11. Handelsstrategien',
      paragraphs: ['Syntrix uses:', 'Strategies are continuously monitored, improved, or excluded if performance drops.'],
      lists: [[
        'Smart Money Concepts (SMC)',
        'ICT strategies',
        'Liquidity and order book analysis',
        'Elliott Wave analysis',
        'Combined technical analysis'
      ]]
    },
    {
      title: '12. Handelsfrequenz und Trefferquote',
      lists: [[
        { boldPrefix: 'Trade duration:', text: '30–60 minutes' },
        { boldPrefix: 'Average trades:', text: '~1 per hour' },
        { boldPrefix: 'Win rate:', text: '90%+' }
      ]]
    },
    {
      title: '13. Risiko aufeinanderfolgender Verluste',
      lists: [[
        'Maximum consecutive losses: 2 stop-losses',
        'After 3 consecutive losing trades, bot halts trading and reviews strategies',
        'Liquidity reserve ensures clients still receive profits even during short-term drawdowns'
      ]]
    },
    {
      title: '14. Marktvolatilität',
      lists: [[
        'Volatility accelerates trades and increases profitability',
        'Crypto markets are ideal for scalping and short-term trades'
      ]]
    },
    {
      title: '15. Syntrix als Wallet nutzen',
      lists: [[
        'Deposit and withdrawal: under 1 minute',
        'Funds available at any time',
        'Passive daily income according to chosen plan',
        'Full security and accessibility of assets'
      ]]
    },
    {
      title: '16. Risiko pro Trade',
      paragraphs: [{ text: 'Risk Management:', semibold: true }, { text: 'Profit Potential:', semibold: true }],
      lists: [[
        'Always 1% risk per trade',
        'Minimum Risk/Reward: 1:5'
      ], [
        'Potential profit per trade: 5–17%',
        'Win rate: 90%+'
      ]]
    },
    {
      title: '17. Empfehlungsprogramm',
      lists: [[
        'Three-level program: 4% / 3% / 2% from referral earnings',
        'Total passive income from three levels: 9%'
      ]]
    },
    {
      title: '18. Preispläne',
      lists: [[
        { boldPrefix: 'Bronze:', text: '$10–$99 (0.5% daily)' },
        { boldPrefix: 'Silver:', text: '$100–$499 (1% daily)' },
        { boldPrefix: 'Gold:', text: '$500–$999 (2% daily)' },
        { boldPrefix: 'Platinum:', text: '$1000–$4999 (3% daily)' },
        { boldPrefix: 'Diamond:', text: '$5000–$19999 (5% daily)' },
        { boldPrefix: 'Black:', text: '$20000–$100000 (7% daily)' },
        { boldPrefix: 'Custom plans:', text: 'deposits > $100,000 (8%+ daily profit)' }
      ]]
    },
    {
      title: '19. Weitere Fragen',
      paragraphs: [
        { text: 'General Information:', semibold: true },
        'Any form of abuse, exploitation, or manipulation of the Syntrix system or its referral program is strictly prohibited. If detected, the user\'s account may be permanently suspended without prior notice.',
        { text: 'Security system:', semibold: true },
        { text: 'Legal & Compliance:', semibold: true },
        { text: 'Terms of Use and Restrictions:', semibold: true },
        { text: 'Telegram security:', semibold: true }
      ],
      lists: [
        [
          'Closing a deposit: Investor can withdraw all funds; deposit closes; bot stops generating profit',
          'Fees: Only network transaction fees apply',
          'Exchanges: Binance and Bybit, trades via bot API; connecting personal API is prohibited'
        ],
        [
          'Encryption: AES-256, RSA-4096, SHA-512 hashing',
          'DDoS protection, global backup servers, multi-level authentication',
          'Bot failure: Liquidity reserve automatically returns all investments and profits'
        ],
        [
          'License: Syntrix Algo Systems LLC, Dubai; licensed for algorithmic crypto trading bots',
          'Not a financial pyramid: Fully transparent transactions, guaranteed percentages, trackable trades',
          'Difference from staking and mining: Funds never locked, passive income, no mining or electricity fees'
        ],
        [
          'Enable 2FA',
          'Use a registered SIM card',
          'Set secret question/answer during registration — allows account recovery if phone/SIM is lost'
        ]
      ]
    }
  ]
}

export const germanWhitepaperContent: WhitepaperContent = {
  title: 'Syntrix WhitePaper',
  sections: [
    {
      title: '1. Einführung',
      paragraphs: [
        'Syntrix ist ein Trading-Bot der nächsten Generation, aufgebaut auf Smart Money Concepts (SMC), Liquiditätsanalyse, Orderbuch-Analyse und institutionellen Risikomanagement-Strategien. Syntrix liefert konstante Performance in unberechenbaren Märkten durch einen bewährten und kontinuierlich optimierten Algorithmus.',
        'Syntrix kann auch als Wallet mit passivem Einkommen genutzt werden:',
        'Syntrix kombiniert Bankniveau-Zuverlässigkeit, Scalper-Geschwindigkeit und Blockchain-Transparenz.'
      ],
      lists: [[
        'Assets bleiben verfügbar, solange sie nicht als Margin in offenen Trades gebunden sind',
        'Auszahlungsgeschwindigkeit: Der Bot bearbeitet sie in bis zu 3 Sekunden, zuzüglich Netzwerklaufzeit',
        'Sichere Aufbewahrung und Transparenz: Blockchain-Level-Verifizierung aller Transaktionen'
      ]]
    },
    {
      title: '2. Herausforderungen im traditionellen Trading',
      paragraphs: [
        'Herausforderungen im traditionellen Trading:',
        'Syntrix-Lösungen:',
        'Beispielrechnung:',
        'Handelsspezifika:'
      ],
      lists: [
        [
          'Erfordert jahrelange Markterfahrung, um stabile Einnahmen zu erzielen',
          'Erfordert eine 24/7-Überwachung, um keine Chancen zu verpassen',
          'Emotionen führen oft zu schlechten Entscheidungen',
          'Fehler können zu Kapitalverlusten führen'
        ],
        [
          'Vollständig automatisiertes passives Einkommen',
          'Strategien sind über 5–10 Jahre rückgetestet, Trefferquote über 90 %',
          'Striktes Risikomanagement: maximal 1 % Risiko pro Trade'
        ],
        [
          'Bot-Kapital: 1.000.000 $',
          'Risiko pro Trade: 10.000 $ (1 %)',
          'Risiko/Rendite-Verhältnis: 1:5',
          'Ein Verlust von 10.000 $ wird vom nächsten profitablen Trade über 50.000 $ ausgeglichen',
          'Maximale aufeinanderfolgende Verluste: 2',
          'Maximale aufeinanderfolgende Gewinne: bis zu 17'
        ],
        [
          'Handelt ausschließlich Kryptowährungspaare',
          'Trade-Dauer: 30–60 Minuten',
          'Trades pro Tag: 17–30'
        ]
      ]
    },
    {
      title: '3. Sicherheit und Liquiditätspool',
      paragraphs: [
        'Syntrix schützt Investoren über ein dreistufiges Sicherheitssystem:',
        { text: '1. 50 % der Gewinne — Auszahlungen an Kunden', semibold: true },
        { text: '2. 25 % der Gewinne — Liquiditätsreserve', semibold: true },
        { text: '3. 25 % der Gewinne — Team und Entwicklung', semibold: true }
      ],
      lists: [
        [
          'Die Hälfte der Tagesgewinne wird an Investoren ausgeschüttet',
          'Syntrix liefert konstante Performance durch bewährte und kontinuierlich optimierte Algorithmen'
        ],
        [
          'Mittel werden in einer verschlüsselten Wallet gespeichert, die für das Team unzugänglich ist',
          'Der Reservepool übersteigt aktuelle Investitionen: 53 Mio. $ vs. 48 Mio. $'
        ],
        [
          '25 % des Nettogewinns nach allen Investorenauszahlungen bleiben im System',
          'Mittel fließen in Gehälter, Dividenden, Bot-Entwicklung und Ökosystem-Wachstum',
          'Schafft eine Win-Win-Situation für Investoren und das Team'
        ]
      ]
    },
    {
      title: '4. Wer entwickelt Syntrix',
      paragraphs: [
        'Syntrix wird von über 40 Spezialisten entwickelt, darunter Entwickler, Cybersicherheitsexperten und Support-Mitarbeiter. Die Führung besteht aus ehemaligen Mitarbeitern großer Market-Making-Firmen und Kryptobörsen wie Binance, OKX und MEX.',
        { text: 'Market-Maker sind Profis, die die Liquidität an Börsen steuern:', semibold: true },
        'Syntrix nutzt 5–10 Jahre Erfahrung im Trading, IT und in der Cybersicherheit. Das kompakte Team (~50 Personen) enthält C-Level-Experten, die die Infrastruktur für große Börsen aufgebaut haben.'
      ],
      lists: [[
        'Orders erstellen und ausbalancieren, um Angebot und Nachfrage in Einklang zu bringen',
        'Aufrechterhaltung der Orderbuch-Tiefe und Handelsstabilität',
        'Entwicklung interner Protokolle und Gewährleistung der Plattform-Sicherheit'
      ]]
    },
    {
      title: '5. Registrierung und Zuständigkeit',
      paragraphs: [
        'Syntrix ist in Dubai als Syntrix Algo Systems LLC registriert.',
        { text: 'Gründe für die Registrierung in Dubai:', semibold: true },
        'Rund 80 % des Teams arbeiten in Dubai, der Rest weltweit remote.'
      ],
      lists: [['Keine Besteuerung für Krypto-Geschäfte', 'Hohe Sicherheit und rechtliche Stabilität']]
    },
    {
      title: '6. Operating Period and Open Beta',
      paragraphs: [
        { boldPrefix: 'Closed beta:', text: '6 Jahre, in denen stabile Gewinne für das Team und private Partner generiert wurden' },
        { boldPrefix: 'Open beta:', text: 'Seit über 9 Monaten können normale Nutzer mit kleinem Kapital teilnehmen und verdienen' }
      ]
    },
    {
      title: '7. Supported Currencies',
      lists: [[
        'Unterstützt alle wichtigen Kryptowährungen: USDT, USDC, ETH, Solana, Bitcoin',
        'Einzahlungen werden automatisch in USDT für den internen Handel konvertiert',
        'Gewinne werden in Stablecoins gutgeschrieben, um Marktschwankungen abzufedern',
        'Auszahlungen sind nur in USDT oder USDC verfügbar'
      ]]
    },
    {
      title: '8. Withdrawal Processing Time',
      paragraphs: [
        { boldPrefix: 'Bot-Verarbeitung:', text: '3 Sekunden' },
        { boldPrefix: 'Netzwerkzeit:', text: '' },
        { boldPrefix: 'Gesamtauszahlung:', text: 'unter 1 Minute' }
      ],
      lists: [['USDT BEP20 — bis zu 20 Sekunden', 'Ethereum — etwas länger']]
    },
    {
      title: '9. Risk of Losing Funds',
      lists: [[
        'Maximales Risiko pro Trade: 1 % der Einzahlung',
        '25 % der Gewinne verbleiben in der Liquiditätsreserve, um vor "Black-Swan"-Ereignissen zu schützen',
        'Kundengelder sind verschlüsselt und für das Team unzugänglich',
        'Mehrschichtige Sicherheitsmaßnahmen von Experten von Binance und anderen Börsen',
        'Auch bei mehreren Verlusttrades bleibt das Kapital geschützt',
        'Auszahlungen über 10 % des Kontostands ohne Vorwarnung können den Handelsprozess negativ beeinflussen und zu Liquidationen führen',
        'Alle Handelsoperationen erfolgen vollständig in der Verantwortung und im Ermessen des Nutzers'
      ]]
    },
    {
      title: '10. Liquidity Reserve Pool',
      lists: [['25 % der Gewinne werden täglich zurückgelegt', 'Der Pool übersteigt aktuelle Investitionen: 53 Mio. $ vs. 48 Mio. $']]
    },
    {
      title: '11. Trading Strategies',
      paragraphs: [
        'Syntrix nutzt:',
        'Strategien werden kontinuierlich überwacht, verbessert oder ausgemustert, wenn die Performance nachlässt.'
      ],
      lists: [[
        'Smart Money Concepts (SMC)',
        'ICT-Strategien',
        'Liquiditäts- und Orderbuch-Analyse',
        'Elliott-Wellen-Analyse',
        'Kombinierte technische Analyse'
      ]]
    },
    {
      title: '12. Trade Frequency and Win Rate',
      lists: [[
        { boldPrefix: 'Trade-Dauer:', text: '30–60 Minuten' },
        { boldPrefix: 'Durchschnittliche Trades:', text: '~1 pro Stunde' },
        { boldPrefix: 'Trefferquote:', text: '90 %+' }
      ]]
    },
    {
      title: '13. Risk of Consecutive Losses',
      lists: [[
        'Maximale aufeinanderfolgende Verluste: 2 Stop-Loss-Trades',
        'Nach 3 Verlusttrades pausiert der Bot und überprüft Strategien',
        'Die Liquiditätsreserve stellt sicher, dass Investoren auch bei kurzfristigen Drawdowns weiterhin Gewinne erhalten'
      ]]
    },
    {
      title: '14. Market Volatility',
      lists: [[
        'Volatilität beschleunigt Trades und erhöht die Profitabilität',
        'Krypto-Märkte eignen sich ideal für Scalping und kurzfristige Trades'
      ]]
    },
    {
      title: '15. Using Syntrix as a Wallet',
      lists: [[
        'Ein- und Auszahlungen: unter 1 Minute',
        'Mittel jederzeit verfügbar',
        'Passives tägliches Einkommen gemäß gewähltem Plan',
        'Volle Sicherheit und Zugänglichkeit der Assets'
      ]]
    },
    {
      title: '16. Risk Per Trade',
      paragraphs: [{ text: 'Risikomanagement:', semibold: true }, { text: 'Profitpotenzial:', semibold: true }],
      lists: [[
        'Immer 1 % Risiko pro Trade',
        'Mindest-Risiko/Rendite: 1:5'
      ], [
        'Potentieller Gewinn pro Trade: 5–17 %',
        'Trefferquote: 90 %+'
      ]]
    },
    {
      title: '17. Referral Program',
      lists: [[
        'Dreistufiges Programm: 4 % / 3 % / 2 % der Empfehlungsgewinne',
        'Maximales passives Einkommen aus Empfehlungen: 9 %'
      ]]
    },
    {
      title: '18. Pricing Plans',
      lists: [[
        { boldPrefix: 'Bronze:', text: '$10–$99 (0,5 % täglich)' },
        { boldPrefix: 'Silver:', text: '$100–$499 (1 % täglich)' },
        { boldPrefix: 'Gold:', text: '$500–$999 (2 % täglich)' },
        { boldPrefix: 'Platinum:', text: '$1000–$4999 (3 % täglich)' },
        { boldPrefix: 'Diamond:', text: '$5000–$19999 (5 % täglich)' },
        { boldPrefix: 'Black:', text: '$20000–$100000 (7 % täglich)' },
        { boldPrefix: 'Sonderpläne:', text: 'Einzahlungen > $100.000 (8 %+ täglicher Profit)' }
      ]]
    },
    {
      title: '19. Additional Questions',
      paragraphs: [
        { text: 'Allgemeine Informationen:', semibold: true },
        { text: 'Sicherheitssystem:', semibold: true },
        { text: 'Rechtliches & Compliance:', semibold: true },
        { text: 'Nutzungsbedingungen und Einschränkungen:', semibold: true },
        { text: 'Jegliche Form von Missbrauch, Ausbeutung oder Manipulation des Syntrix-Systems oder seines Empfehlungsprogramms ist strikt verboten. Wird dies festgestellt, kann das Benutzerkonto ohne Vorwarnung dauerhaft gesperrt werden.', indent: true },
        { text: 'Telegram-Sicherheit:', semibold: true }
      ],
      lists: [
        [
          'Schließen einer Einzahlung: Der Investor kann alle Mittel abheben; die Einzahlung schließt; der Bot stoppt die Gewinnproduktion',
          'Gebühren: Es fallen nur Netzwerktransaktionsgebühren an',
          'Börsen: Binance und Bybit, Trades laufen über Bot-API; das Verbinden eigener APIs ist verboten'
        ],
        [
          'Verschlüsselung: AES-256, RSA-4096, SHA-512-Hashes',
          'DDoS-Schutz, globale Backup-Server, mehrstufige Authentifizierung',
          'Bot-Ausfall: Die Liquiditätsreserve gibt automatisch alle Investitionen und Gewinne zurück'
        ],
        [
          'Lizenz: Syntrix Algo Systems LLC, Dubai; lizenziert für algorithmische Krypto-Trading-Bots',
          'Kein Finanzpyramidensystem: Volle Transparenz bei Transaktionen, garantierte Prozentsätze, nachverfolgbare Trades',
          'Unterschied zu Staking und Mining: Gelder werden nie gesperrt, passives Einkommen, keine Mining- oder Stromkosten'
        ],
        [
          'Aktiviere 2FA',
          'Nutze eine registrierte SIM-Karte',
          'Lege während der Registrierung eine geheime Frage und Antwort fest – so kann das Konto wiederhergestellt werden, falls Telefon oder SIM verloren gehen'
        ]
      ]
    }
  ]
}
