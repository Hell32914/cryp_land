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
        { boldPrefix: 'Bronze:', text: '$10–$99 (0.30% daily)' },
        { boldPrefix: 'Silver:', text: '$100–$499 (0.50% daily)' },
        { boldPrefix: 'Gold:', text: '$500–$999 (0.80% daily)' },
        { boldPrefix: 'Platinum:', text: '$1000–$4999 (1.00% daily)' },
        { boldPrefix: 'Diamond:', text: '$5000–$19999 (1.30% daily)' },
        { boldPrefix: 'Black:', text: '$20000–$100000 (1.70% daily)' },
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
        { boldPrefix: 'Bronze:', text: '$10–$99 (0,30 % täglich)' },
        { boldPrefix: 'Silver:', text: '$100–$499 (0,50 % täglich)' },
        { boldPrefix: 'Gold:', text: '$500–$999 (0,80 % täglich)' },
        { boldPrefix: 'Platinum:', text: '$1000–$4999 (1,00 % täglich)' },
        { boldPrefix: 'Diamond:', text: '$5000–$19999 (1,30 % täglich)' },
        { boldPrefix: 'Black:', text: '$20000–$100000 (1,70 % täglich)' },
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

export const spanishWhitepaperContent: WhitepaperContent = {
  title: 'WhitePaper de Syntrix',
  sections: [
    {
      title: '1. Introducción',
      paragraphs: [
        'Syntrix es un bot de trading de nueva generación, construido sobre Smart Money Concepts (SMC), análisis de liquidez, análisis del libro de órdenes y estrategias institucionales de gestión de riesgos. Syntrix entrega rendimiento consistente en un mercado impredecible mediante un algoritmo comprobado y en continua optimización.',
        'Syntrix también puede usarse como wallet con ingresos pasivos:',
        'Syntrix combina la confiabilidad bancaria, la velocidad de un scalper y la transparencia de la blockchain.'
      ],
      lists: [
        [
          'Los activos están disponibles salvo que estén en margen dentro de una operación abierta',
          'Velocidad de retiro: procesados por el bot en hasta 3 segundos, más el tiempo de la red',
          'Almacenamiento seguro y transparente: verificación de transacciones a nivel blockchain'
        ]
      ]
    },
    {
      title: '2. Problemas del trading tradicional',
      paragraphs: [
        'Desafíos del trading tradicional:',
        'Soluciones de Syntrix:',
        'Cálculo de ejemplo:',
        'Particularidades del trading:'
      ],
      lists: [
        [
          'Requiere años de experiencia para generar ingresos estables',
          'Necesita monitoreo 24/7 para evitar oportunidades perdidas',
          'Las emociones suelen llevar a malas decisiones',
          'Los errores pueden provocar pérdida de capital'
        ],
        [
          'Ingreso pasivo totalmente automatizado',
          'Estrategias probadas durante 5-10 años con tasa de aciertos superior al 90 %',
          'Gestión de riesgo estricta: máximo 1 % de riesgo por trade'
        ],
        [
          'Capital del bot: $1,000,000',
          'Riesgo por trade: $10,000 (1 %)',
          'Relación riesgo/recompensa: 1:5',
          'Una pérdida de $10,000 se compensa con la siguiente operación rentable de $50,000',
          'Máximas pérdidas consecutivas: 2',
          'Máximas ganancias consecutivas: hasta 17'
        ],
        [
          'Opera únicamente pares de criptomonedas',
          'Duración de cada trade: 30-60 minutos',
          'Trades por día: 17-30'
        ]
      ]
    },
    {
      title: '3. Seguridad y pool de liquidez',
      paragraphs: [
        'Syntrix protege a los inversionistas mediante un sistema de seguridad de tres niveles:',
        { text: '1. 50 % de las ganancias — pagos a clientes', semibold: true },
        { text: '2. 25 % de las ganancias — pool de reserva de liquidez', semibold: true },
        { text: '3. 25 % de las ganancias — equipo y desarrollo', semibold: true }
      ],
      lists: [
        [
          'La mitad de las ganancias diarias se distribuye a los inversionistas',
          'Syntrix entrega rendimiento constante mediante algoritmos comprobados y en mejora continua'
        ],
        [
          'Los fondos se guardan en una wallet cifrada, inaccesible para el equipo',
          'El pool de reserva supera las inversiones actuales: $53M frente a $48M'
        ],
        [
          'El 25 % del beneficio neto después de los pagos a inversionistas se retiene',
          'Los fondos se destinan a salarios, dividendos, desarrollo del bot y crecimiento del ecosistema',
          'Crea una situación ganadora para inversionistas y equipo'
        ]
      ]
    },
    {
      title: '4. Quién desarrolló Syntrix',
      paragraphs: [
        'Syntrix está desarrollado por un equipo de más de 40 especialistas: desarrolladores, expertos en ciberseguridad y soporte. El liderazgo incluye ex empleados de grandes firmas de market making y exchanges como Binance, OKX y MEX.',
        { text: 'Los creadores de mercado son profesionales que gestionan la liquidez en los exchanges:', semibold: true },
        'Syntrix aprovecha entre 5 y 10 años de experiencia en trading, IT y ciberseguridad. El equipo compacto (~50 personas) incluye ejecutivos con experiencia construyendo infraestructura para grandes exchanges.'
      ],
      lists: [
        [
          'Generan y equilibran órdenes para casar oferta y demanda',
          'Mantienen la profundidad del libro de órdenes y la estabilidad del trading',
          'Desarrollan protocolos internos y aseguran la plataforma'
        ]
      ]
    },
    {
      title: '5. Registro y jurisdicción',
      paragraphs: [
        'Syntrix está registrado en Dubái como Syntrix Algo Systems LLC.',
        { text: 'Motivos para registrarse en Dubái:', semibold: true },
        'Aproximadamente el 80 % del equipo está basado en Dubái; el resto trabaja de forma remota alrededor del mundo.'
      ],
      lists: [[
        'Cero impuestos para negocios de criptomonedas',
        'Alta seguridad y estabilidad legal'
      ]]
    },
    {
      title: '6. Período operativo y beta abierta',
      paragraphs: [
        { boldPrefix: 'Beta cerrada:', text: '6 años generando ganancias estables para el equipo y socios privados' },
        { boldPrefix: 'Beta abierta:', text: 'Más de 9 meses permitiendo a usuarios con capital pequeño participar y ganar' }
      ]
    },
    {
      title: '7. Monedas compatibles',
      lists: [[
        'Soporta las principales criptomonedas: USDT, USDC, ETH, Solana, Bitcoin',
        'Los depósitos se convierten automáticamente a USDT para el trading interno',
        'Las ganancias se acreditan en stablecoins para protegerse de la volatilidad',
        'Los retiros solo están disponibles en USDT o USDC'
      ]]
    },
    {
      title: '8. Procesamiento de retiros',
      paragraphs: [
        { boldPrefix: 'Procesamiento del bot:', text: '3 segundos' },
        { boldPrefix: 'Tiempo de red:', text: '' },
        { boldPrefix: 'Retiro total:', text: 'menos de 1 minuto' }
      ],
      lists: [[
        'USDT BEP20 — hasta 20 segundos',
        'Ethereum — un poco más'
      ]]
    },
    {
      title: '9. Riesgo de pérdida de capital',
      lists: [[
        'Riesgo máximo por trade: 1 % del depósito',
        '25 % de las ganancias se retienen en la reserva de liquidez para proteger frente a eventos “cisne negro”',
        'Los fondos de los clientes están cifrados y el equipo no puede acceder a ellos',
        'Se implementan múltiples capas de seguridad por expertos de Binance y otros exchanges',
        'Incluso durante rachas de pérdidas consecutivas, el capital del inversionista está protegido',
        'Retiros superiores al 10 % del balance sin aviso previo pueden afectar el proceso de trading y activar liquidaciones',
        'Todas las operaciones se ejecutan bajo la plena discreción y responsabilidad del usuario'
      ]]
    },
    {
      title: '10. Pool de reserva de liquidez',
      lists: [[
        'El 25 % de las ganancias se reserva diariamente',
        'El pool supera las inversiones actuales: $53M frente a $48M'
      ]]
    },
    {
      title: '11. Estrategias de trading',
      paragraphs: [
        'Syntrix utiliza:',
        'Las estrategias se monitorean continuamente, se mejoran o se descartan si pierden rendimiento.'
      ],
      lists: [[
        'Smart Money Concepts (SMC)',
        'Estrategias ICT',
        'Análisis de liquidez y libro de órdenes',
        'Análisis de ondas de Elliott',
        'Análisis técnico combinado'
      ]]
    },
    {
      title: '12. Frecuencia de trading y tasa de aciertos',
      lists: [[
        { boldPrefix: 'Duración de cada trade:', text: '30-60 minutos' },
        { boldPrefix: 'Trades promedio:', text: '~1 por hora' },
        { boldPrefix: 'Tasa de aciertos:', text: '90%+' }
      ]]
    },
    {
      title: '13. Riesgo de pérdidas consecutivas',
      lists: [[
        'Máximas pérdidas consecutivas: 2 stop-loss',
        'Tras 3 trades perdedores consecutivos, el bot detiene el trading y revisa las estrategias',
        'La reserva de liquidez asegura que los clientes sigan recibiendo ganancias incluso ante drawdowns cortos'
      ]]
    },
    {
      title: '14. Volatilidad del mercado',
      lists: [[
        'La volatilidad acelera los trades y aumenta la rentabilidad',
        'Los mercados cripto son ideales para scalping y operaciones de corto plazo'
      ]]
    },
    {
      title: '15. Usar Syntrix como wallet',
      lists: [[
        'Depósitos y retiros: menos de 1 minuto',
        'Fondos disponibles en cualquier momento',
        'Ingreso diario pasivo según el plan elegido',
        'Seguridad completa y accesibilidad de los activos'
      ]]
    },
    {
      title: '16. Riesgo por trade',
      paragraphs: [
        { text: 'Gestión de riesgos:', semibold: true },
        { text: 'Potencial de ganancias:', semibold: true }
      ],
      lists: [
        [
          'Siempre 1 % de riesgo por trade',
          'Relación mínimo riesgo/recompensa: 1:5'
        ],
        [
          'Ganancia potencial por trade: 5-17 %',
          'Tasa de aciertos: 90%+'
        ]
      ]
    },
    {
      title: '17. Programa de referidos',
      lists: [[
        'Programa de tres niveles: 4 % / 3 % / 2 % sobre las ganancias de referidos',
        'Ingreso pasivo total de los tres niveles: 9 %'
      ]]
    },
    {
      title: '18. Planes de precios',
      lists: [[
        { boldPrefix: 'Bronze:', text: '$10–$99 (0.30 % diario)' },
        { boldPrefix: 'Silver:', text: '$100–$499 (0.50 % diario)' },
        { boldPrefix: 'Gold:', text: '$500–$999 (0.80 % diario)' },
        { boldPrefix: 'Platinum:', text: '$1000–$4999 (1.00 % diario)' },
        { boldPrefix: 'Diamond:', text: '$5000–$19999 (1.30 % diario)' },
        { boldPrefix: 'Black:', text: '$20000–$100000 (1.70 % diario)' },
        { boldPrefix: 'Planes personalizados:', text: 'depósitos > $100000 (8 %+ de ganancia diaria)' }
      ]]
    },
    {
      title: '19. Otras preguntas',
      paragraphs: [
        { text: 'Información general:', semibold: true },
        'Cualquier abuso, explotación o manipulación del sistema Syntrix o de su programa de referidos está estrictamente prohibido. Si se detecta, la cuenta podrá suspenderse permanentemente sin previo aviso.',
        { text: 'Sistema de seguridad:', semibold: true },
        { text: 'Aspectos legales y cumplimiento:', semibold: true },
        { text: 'Términos de uso y restricciones:', semibold: true },
        { text: 'Seguridad en Telegram:', semibold: true }
      ],
      lists: [
        [
          'Cerrar un depósito: el inversionista puede retirar todos los fondos; el depósito se cierra y el bot deja de generar ganancias',
          'Comisiones: solo aplican las tarifas de transacción de la red',
          'Exchanges: Binance y Bybit, trades a través de la API del bot; conectar APIs personales está prohibido'
        ],
        [
          'Cifrado: AES-256, RSA-4096, SHA-512',
          'Protección DDoS, servidores de respaldo globales, autenticación multinivel',
          'Falla del bot: la reserva de liquidez devuelve automáticamente todas las inversiones y ganancias'
        ],
        [
          'Licencia: Syntrix Algo Systems LLC, Dubái; licencia para bots de trading algorítmico de cripto',
          'No es una pirámide: transacciones transparentes, porcentajes garantizados, trades rastreables',
          'Diferencia con staking y mining: los fondos nunca se bloquean, ingreso pasivo sin hardware ni costos de electricidad'
        ],
        [
          'Activa 2FA',
          'Usa una SIM registrada',
          'Configura una pregunta y respuesta secreta durante el registro para recuperar la cuenta si pierdes el teléfono o la SIM'
        ]
      ]
    }
  ]
}

export const frenchWhitepaperContent: WhitepaperContent = {
  title: 'Livre Blanc de Syntrix',
  sections: [
    {
      title: '1. Introduction',
      paragraphs: [
        "Syntrix est un bot de trading nouvelle génération, basé sur les Smart Money Concepts (SMC), l'analyse de la liquidité, l'analyse du carnet d'ordres et des stratégies institutionnelles de gestion des risques. Syntrix assure des performances constantes sur un marché imprévisible grâce à un algorithme éprouvé et en optimisation continue.",
        'Syntrix peut aussi être utilisé comme wallet générant des revenus passifs :',
        "Syntrix combine la fiabilité bancaire, la vitesse d'un scalper et la transparence de la blockchain."
      ],
      lists: [
        [
          'Les actifs restent accessibles sauf s\'ils sont utilisés en marge dans une position ouverte',
          "Vitesse de retrait : traitée par le bot en jusqu'à 3 secondes, plus le temps réseau",
          'Stockage sûr et transparent : vérification blockchain des transactions'
        ]
      ]
    },
    {
      title: '2. Problèmes du trading traditionnel',
      paragraphs: [
        'Défis du trading traditionnel :',
        'Solutions Syntrix :',
        'Exemple de calcul :',
        'Particularités du trading :'
      ],
      lists: [
        [
          'Requiert des années d\'expérience pour générer un revenu stable',
          'Nécessite une surveillance 24/7 pour ne pas manquer d\'opportunités',
          'Les émotions conduisent souvent à de mauvaises décisions',
          'Les erreurs peuvent entraîner des pertes de capital'
        ],
        [
          'Revenu passif totalement automatisé',
          'Stratégies éprouvées pendant 5 à 10 ans avec un taux de réussite supérieur à 90 %',
          'Gestion du risque stricte : maximum 1 % de risque par trade'
        ],
        [
          'Capital du bot : 1 000 000 $',
          'Risque par trade : 10 000 $ (1 %)',
          'Ratio risque/rendement : 1:5',
          'Une perte de 10 000 $ est compensée par le prochain trade rentable de 50 000 $',
          'Pertes consécutives maximales : 2',
          'Gains consécutifs maximaux : jusqu\'à 17'
        ],
        [
          'Ne traite que des paires de cryptomonnaies',
          'Durée de chaque trade : 30 à 60 minutes',
          'Trades par jour : 17 à 30'
        ]
      ]
    },
    {
      title: '3. Sécurité et pool de liquidité',
      paragraphs: [
        'Syntrix protège les investisseurs via un système de sécurité en trois niveaux :',
        { text: '1. 50 % des gains — paiements aux clients', semibold: true },
        { text: '2. 25 % des gains — pool de réserve de liquidité', semibold: true },
        { text: '3. 25 % des gains — équipe et développement', semibold: true }
      ],
      lists: [
        [
          'La moitié des bénéfices quotidiens est distribuée aux investisseurs',
          'Syntrix fournit une performance constante grâce à des algorithmes optimisés'
        ],
        [
          'Les fonds sont conservés dans un wallet chiffré, inaccessible à l\'équipe',
          'Le pool de réserve dépasse les investissements actuels : 53 M$ contre 48 M$'
        ],
        [
          '25 % du bénéfice net après paiements aux investisseurs est mis de côté',
          'Les fonds vont aux salaires, dividendes, développement du bot et expansion de l\'écosystème',
          'Crée une situation gagnante pour investisseurs et équipe'
        ]
      ]
    },
    {
      title: '4. Qui a développé Syntrix',
      paragraphs: [
        'Syntrix est développé par une équipe de plus de 40 spécialistes : développeurs, experts en cybersécurité et support. La direction inclut d\'anciens employés de grandes firmes de market making et d\'exchanges comme Binance, OKX et MEX.',
        { text: 'Les créateurs de marché sont des professionnels qui gèrent la liquidité sur les exchanges :', semibold: true },
        'Syntrix mobilise 5 à 10 ans d\'expérience en trading, IT et cybersécurité. L\'équipe compacte (~50 personnes) comprend des cadres ayant construit l\'infrastructure pour de grands exchanges.'
      ],
      lists: [
        [
          'Génèrent et équilibrent les ordres pour aligner l\'offre et la demande',
          'Maintiennent la profondeur du carnet d\'ordres et la stabilité du trading',
          'Développent des protocoles internes et assurent la sécurité de la plateforme'
        ]
      ]
    },
    {
      title: '5. Enregistrement et juridiction',
      paragraphs: [
        'Syntrix est enregistré à Dubaï sous Syntrix Algo Systems LLC.',
        { text: 'Motifs de l\'enregistrement à Dubaï :', semibold: true },
        'Environ 80 % de l\'équipe est basé à Dubaï ; le reste travaille à distance dans le monde entier.'
      ],
      lists: [
        [
          'Zéro taxation pour les entreprises crypto',
          'Haute sécurité et stabilité juridique'
        ]
      ]
    },
    {
      title: '6. Période d\'opération et bêta ouverte',
      paragraphs: [
        { boldPrefix: 'Bêta fermée :', text: '6 ans générant des gains stables pour l\'équipe et les partenaires privés' },
        { boldPrefix: 'Bêta ouverte :', text: 'Plus de 9 mois permettant aux utilisateurs à petit capital de participer et de gagner' }
      ]
    },
    {
      title: '7. Devises compatibles',
      lists: [
        [
          'Prend en charge les principales cryptomonnaies : USDT, USDC, ETH, Solana, Bitcoin',
          'Les dépôts sont convertis automatiquement en USDT pour le trading interne',
          'Les gains sont crédités en stablecoins pour se protéger contre la volatilité',
          'Les retraits ne sont disponibles qu\'en USDT ou USDC'
        ]
      ]
    },
    {
      title: '8. Traitement des retraits',
      paragraphs: [
        { boldPrefix: 'Traitement par le bot :', text: '3 secondes' },
        { boldPrefix: 'Temps réseau :', text: '' },
        { boldPrefix: 'Retrait total :', text: 'moins d\'une minute' }
      ],
      lists: [
        [
          'USDT BEP20 — jusqu\'à 20 secondes',
          'Ethereum — un peu plus'
        ]
      ]
    },
    {
      title: '9. Risque de perte de capital',
      lists: [
        [
          'Risque maximum par trade : 1 % du dépôt',
          '25 % des gains sont retenus dans la réserve de liquidité pour se protéger contre les événements « cygne noir »',
          'Les fonds clients sont chiffrés et l\'équipe ne peut pas y accéder',
          'Plusieurs couches de sécurité sont mises en place par des experts de Binance et d\'autres exchanges',
          'Même pendant des séries de pertes consécutives, le capital de l\'investisseur reste protégé',
          'Les retraits supérieurs à 10 % du solde sans préavis peuvent perturber le trading et déclencher des liquidations',
          'Toutes les opérations sont exécutées sous la pleine discrétion et responsabilité de l\'utilisateur'
        ]
      ]
    },
    {
      title: '10. Pool de réserve de liquidité',
      lists: [
        [
          '25 % des gains sont réservés quotidiennement',
          'Le pool dépasse les investissements actuels : 53 M$ vs 48 M$'
        ]
      ]
    },
    {
      title: '11. Stratégies de trading',
      paragraphs: [
        'Syntrix utilise :',
        'Les stratégies sont surveillées en continu, améliorées ou écartées si leur performance baisse.'
      ],
      lists: [
        [
          'Smart Money Concepts (SMC)',
          'Stratégies ICT',
          'Analyse de la liquidité et du carnet d\'ordres',
          "Analyse des vagues d'Elliott",
          'Analyse technique combinée'
        ]
      ]
    },
    {
      title: '12. Fréquence de trading et taux de réussite',
      lists: [
        [
          { boldPrefix: 'Durée de chaque trade :', text: '30-60 minutes' },
          { boldPrefix: 'Trades moyens :', text: '~1 par heure' },
          { boldPrefix: 'Taux de réussite :', text: '90%+' }
        ]
      ]
    },
    {
      title: '13. Risque de pertes consécutives',
      lists: [
        [
          'Pertes consécutives maximales : 2 stop-loss',
          'Après 3 trades perdants consécutifs, le bot arrête le trading et revoit les stratégies',
          'La réserve de liquidité garantit que les clients continuent de recevoir des gains même pendant de courts drawdowns'
        ]
      ]
    },
    {
      title: '14. Volatilité du marché',
      lists: [
        [
          'La volatilité accélère les trades et augmente la rentabilité',
          'Les marchés crypto sont idéaux pour le scalping et les trades court terme'
        ]
      ]
    },
    {
      title: '15. Utiliser Syntrix comme wallet',
      lists: [
        [
          'Dépôts et retraits : moins d\'une minute',
          'Fonds disponibles à tout moment',
          'Revenu passif quotidien selon le plan choisi',
          'Sécurité complète et accessibilité des actifs'
        ]
      ]
    },
    {
      title: '16. Risque par trade',
      paragraphs: [
        { text: 'Gestion des risques :', semibold: true },
        { text: 'Potentiel de gains :', semibold: true }
      ],
      lists: [
        [
          'Toujours 1 % de risque par trade',
          'Ratio risque/rendement minimum : 1:5'
        ],
        [
          'Gain potentiel par trade : 5-17 %',
          'Taux de réussite : 90%+'
        ]
      ]
    },
    {
      title: '17. Programme de parrainage',
      lists: [
        [
          'Programme à trois niveaux : 4 % / 3 % / 2 % sur les gains des parrainés',
          'Revenu passif total des trois niveaux : 9 %'
        ]
      ]
    },
    {
      title: '18. Plans tarifaires',
      lists: [
        [
          { boldPrefix: 'Bronze :', text: '$10–$99 (0,30 % par jour)' },
          { boldPrefix: 'Silver :', text: '$100–$499 (0,50 % par jour)' },
          { boldPrefix: 'Gold :', text: '$500–$999 (0,80 % par jour)' },
          { boldPrefix: 'Platinum :', text: '$1000–$4999 (1,00 % par jour)' },
          { boldPrefix: 'Diamond :', text: '$5000–$19999 (1,30 % par jour)' },
          { boldPrefix: 'Black :', text: '$20000–$100000 (1,70 % par jour)' },
          { boldPrefix: 'Plans personnalisés :', text: 'dépôts > $100000 (8 %+ de gains quotidiens)' }
        ]
      ]
    },
    {
      title: '19. Autres questions',
      paragraphs: [
        { text: 'Informations générales :', semibold: true },
        'Tout abus, exploitation ou manipulation du système Syntrix ou de son programme de parrainage est strictement interdit. En cas de détection, le compte peut être suspendu définitivement sans préavis.',
        { text: 'Système de sécurité :', semibold: true },
        { text: 'Aspects juridiques et conformité :', semibold: true },
        { text: 'Conditions d\'utilisation et restrictions :', semibold: true },
        { text: 'Sécurité sur Telegram :', semibold: true }
      ],
      lists: [
        [
          'Clôturer un dépôt : l\'investisseur peut retirer tous les fonds ; le dépôt se ferme et le bot cesse de générer des gains',
          "Commissions : seules les frais réseau s'appliquent",
          'Exchanges : Binance et Bybit, trades via l\'API du bot ; connecter ses propres API est interdit'
        ],
        [
          'Chiffrement : AES-256, RSA-4096, SHA-512',
          'Protection DDoS, serveurs de secours mondiaux, authentification multi-niveau',
          'Défaillance du bot : la réserve de liquidité rembourse automatiquement tous les investissements et gains'
        ],
        [
          'Licence : Syntrix Algo Systems LLC, Dubaï ; licence pour bots de trading algorithmique crypto',
          'Pas une pyramide financière : transactions transparentes, pourcentages garantis, trades traçables',
          'Différence avec staking et mining : les fonds ne sont jamais bloqués, revenu passif sans matériel ni coûts d\'électricité'
        ],
        [
          'Activez la 2FA',
          'Utilisez une SIM enregistrée',
          'Configurez une question et réponse secrète pendant l\'inscription pour récupérer le compte en cas de perte du téléphone ou de la SIM'
        ]
      ]
    }
  ]
}

export const italianWhitepaperContent: WhitepaperContent = {
  title: 'Whitepaper di Syntrix',
  sections: [
    {
      title: '1. Introduzione',
      paragraphs: [
        'Syntrix è un bot di trading di nuova generazione, costruito su Smart Money Concepts (SMC), analisi della liquidità, analisi del book e strategie istituzionali di gestione dei rischi. Syntrix offre performance costanti anche in mercati imprevedibili grazie a un algoritmo collaudato costantemente ottimizzato.',
        'Syntrix può essere usato anche come wallet che genera reddito passivo:',
        'Syntrix unisce affidabilità bancaria, velocità da scalper e trasparenza blockchain.'
      ],
      lists: [
        [
          'Gli asset restano accessibili salvo che siano usati come margine in un trade aperto',
          'Velocità di prelievo: processata dal bot in fino a 3 secondi, più il tempo della rete',
          'Custodia sicura e trasparente: verifica blockchain delle transazioni'
        ]
      ]
    },
    {
      title: '2. Problemi del trading tradizionale',
      paragraphs: [
        'Sfide del trading tradizionale:',
        'Soluzioni Syntrix:',
        'Esempio di calcolo:',
        'Particolarità del trading:'
      ],
      lists: [
        [
          'Richiede anni di esperienza per avere reddito stabile',
          'Serve monitoraggio 24/7 per non perdere opportunità',
          'Le emozioni portano spesso a decisioni errate',
          'Gli errori possono causare perdite di capitale'
        ],
        [
          'Reddito passivo completamente automatizzato',
          'Strategie testate per 5-10 anni con oltre il 90 % di successo',
          'Gestione del rischio rigorosa: max 1 % per trade'
        ],
        [
          'Capitale del bot: 1.000.000 $',
          'Rischio per trade: 10.000 $ (1 %)',
          'Rapporto rischio/ricompensa: 1:5',
          'Una perdita di 10.000 $ viene compensata dal trade successivo da 50.000 $',
          'Perdite consecutive massime: 2',
          'Massimi guadagni consecutivi: fino a 17'
        ],
        [
          'Opera solo coppie cripto',
          'Durata di ogni trade: 30-60 minuti',
          'Trades giornalieri: 17-30'
        ]
      ]
    },
    {
      title: '3. Sicurezza e pool di liquidità',
      paragraphs: [
        'Syntrix protegge gli investitori con un sistema di sicurezza su tre livelli:',
        { text: '1. 50 % dei profitti — pagamenti ai clienti', semibold: true },
        { text: '2. 25 % dei profitti — pool di riserva di liquidità', semibold: true },
        { text: '3. 25 % dei profitti — team e sviluppo', semibold: true }
      ],
      lists: [
        [
          'La metà dei profitti giornalieri viene distribuita agli investitori',
          'Syntrix mantiene performance costanti grazie ad algoritmi ottimizzati'
        ],
        [
          'I fondi sono custoditi in un wallet crittografato, inaccessibile al team',
          'Il pool di riserva supera gli investimenti attuali: 53 M$ contro 48 M$'
        ],
        [
          'Il 25 % del profitto netto dopo i pagamenti agli investitori viene messo da parte',
          'I fondi finanziano stipendi, dividendi, sviluppo del bot e crescita dell\'ecosistema',
          'Crea una situazione vantaggiosa per investitori e team'
        ]
      ]
    },
    {
      title: '4. Chi ha sviluppato Syntrix',
      paragraphs: [
        'Syntrix è sviluppato da un team di oltre 40 specialisti: sviluppatori, esperti di cybersecurity e supporto. Il management include ex dipendenti di grandi market-maker ed exchange come Binance, OKX e MEX.',
        { text: 'I market maker gestiscono la liquidità sugli exchange:', semibold: true },
        'Syntrix sfrutta 5-10 anni di esperienza in trading, IT e cybersecurity. Il team leggero (~50 persone) include dirigenti che hanno costruito infrastrutture per grandi exchange.'
      ],
      lists: [
        [
          'Generano e bilanciano ordini per far incontrare domanda e offerta',
          'Mantengono profondità del book e stabilità del trading',
          'Sviluppano protocolli interni e assicurano la piattaforma'
        ]
      ]
    },
    {
      title: '5. Registrazione e giurisdizione',
      paragraphs: [
        'Syntrix è registrato a Dubai come Syntrix Algo Systems LLC.',
        { text: 'Motivi per la registrazione a Dubai:', semibold: true },
        'Circa l\'80 % del team è a Dubai, il resto lavora da remoto nel mondo.'
      ],
      lists: [
        [
          'Zero tasse per le società crypto',
          'Alta sicurezza e stabilità legale'
        ]
      ]
    },
    {
      title: '6. Periodo operativo e beta aperta',
      paragraphs: [
        { boldPrefix: 'Beta chiusa:', text: '6 anni di profitti stabili per il team e partner privati' },
        { boldPrefix: 'Beta aperta:', text: 'Oltre 9 mesi in cui utenti con piccolo capitale partecipano e guadagnano' }
      ]
    },
    {
      title: '7. Valute supportate',
      lists: [
        [
          'Supporta le principali crypto: USDT, USDC, ETH, Solana, Bitcoin',
          'I depositi vengono convertiti automaticamente in USDT per il trading interno',
          'I profitti vengono accreditati in stablecoin per proteggersi dalla volatilità',
          'I prelievi sono disponibili solo in USDT o USDC'
        ]
      ]
    },
    {
      title: '8. Elaborazione dei prelievi',
      paragraphs: [
        { boldPrefix: 'Elaborazione del bot:', text: '3 secondi' },
        { boldPrefix: 'Tempo di rete:', text: '' },
        { boldPrefix: 'Prelievo totale:', text: 'meno di 1 minuto' }
      ],
      lists: [
        [
          'USDT BEP20 — fino a 20 secondi',
          'Ethereum — leggermente più lungo'
        ]
      ]
    },
    {
      title: '9. Rischio di perdita di capitale',
      lists: [
        [
          'Rischio massimo per trade: 1 % del deposito',
          '25 % dei profitti trattenuti nella riserva di liquidità per proteggersi da eventi “cigno nero”',
          'I fondi dei clienti sono crittografati e il team non vi accede',
          'Più livelli di sicurezza implementati da esperti di Binance e altri exchange',
          'Anche durante serie di perdite, il capitale resta protetto',
          'Prelievi superiori al 10 % del saldo senza preavviso possono influire sul trading e attivare liquidazioni',
          'Tutte le operazioni si eseguono sotto la piena discrezione e responsabilità dell\'utente'
        ]
      ]
    },
    {
      title: '10. Pool di riserva di liquidità',
      lists: [
        [
          'Il 25 % dei profitti viene accantonato quotidianamente',
          'Il pool supera gli investimenti attuali: 53 M$ contro 48 M$'
        ]
      ]
    },
    {
      title: '11. Strategie di trading',
      paragraphs: [
        'Syntrix utilizza:',
        'Le strategie sono continuamente monitorate, migliorate o eliminate se perdono performance.'
      ],
      lists: [
        [
          'Smart Money Concepts (SMC)',
          'Strategie ICT',
          'Analisi di liquidità e book',
          'Analisi delle onde di Elliott',
          'Analisi tecnica combinata'
        ]
      ]
    },
    {
      title: '12. Frequenza di trading e tasso di successo',
      lists: [
        [
          { boldPrefix: 'Durata di ogni trade:', text: '30-60 minuti' },
          { boldPrefix: 'Trade medi:', text: '~1 all\'ora' },
          { boldPrefix: 'Tasso di successo:', text: '90%+' }
        ]
      ]
    },
    {
      title: '13. Rischio di perdite consecutive',
      lists: [
        [
          'Perdite consecutive massime: 2 stop-loss',
          'Dopo 3 trade in perdita consecutivi, il bot ferma il trading e rivede le strategie',
          'La riserva di liquidità garantisce che gli investitori ricevano ancora profitti durante drawdown brevi'
        ]
      ]
    },
    {
      title: '14. Volatilità del mercato',
      lists: [
        [
          'La volatilità accelera i trade e aumenta la redditività',
          'I mercati crypto sono ideali per scalping e operazioni di breve termine'
        ]
      ]
    },
    {
      title: '15. Usare Syntrix come wallet',
      lists: [
        [
          'Depositi e prelievi: meno di 1 minuto',
          'Fondi disponibili sempre',
          'Reddito passivo giornaliero in base al piano scelto',
          'Sicurezza totale e accessibilità degli asset'
        ]
      ]
    },
    {
      title: '16. Rischio per trade',
      paragraphs: [
        { text: 'Gestione del rischio:', semibold: true },
        { text: 'Potenziale di profitto:', semibold: true }
      ],
      lists: [
        [
          'Sempre 1 % di rischio per trade',
          'Rapporto rischio/ricompensa minimo: 1:5'
        ],
        [
          'Profitto potenziale per trade: 5-17 %',
          'Tasso di successo: 90%+'
        ]
      ]
    },
    {
      title: '17. Programma di referral',
      lists: [
        [
          'Programma a tre livelli: 4 % / 3 % / 2 % sui guadagni dei referral',
          'Reddito passivo totale dai tre livelli: 9 %'
        ]
      ]
    },
    {
      title: '18. Piani tariffari',
      lists: [
        [
          { boldPrefix: 'Bronze:', text: '$10–$99 (0.30 % giornaliero)' },
          { boldPrefix: 'Silver:', text: '$100–$499 (0.50 % giornaliero)' },
          { boldPrefix: 'Gold:', text: '$500–$999 (0.80 % giornaliero)' },
          { boldPrefix: 'Platinum:', text: '$1000–$4999 (1.00 % giornaliero)' },
          { boldPrefix: 'Diamond:', text: '$5000–$19999 (1.30 % giornaliero)' },
          { boldPrefix: 'Black:', text: '$20000–$100000 (1.70 % giornaliero)' },
          { boldPrefix: 'Piani personalizzati:', text: 'depositi > $100000 (8 %+ di profitti quotidiani)' }
        ]
      ]
    },
    {
      title: '19. Altre domande',
      paragraphs: [
        { text: 'Informazioni generali:', semibold: true },
        'Qualsiasi abuso, sfruttamento o manipolazione del sistema Syntrix o del programma referral è proibito. In caso di rilevamento, l\'account può essere sospeso definitivamente senza preavviso.',
        { text: 'Sistema di sicurezza:', semibold: true },
        { text: 'Aspetti legali e conformità:', semibold: true },
        { text: 'Termini di utilizzo e restrizioni:', semibold: true },
        { text: 'Sicurezza su Telegram:', semibold: true }
      ],
      lists: [
        [
          'Chiudere un deposito: l\'investitore può ritirare tutti i fondi; il deposito si chiude e il bot interrompe i guadagni',
          'Commissioni: si applicano solo le fee di rete',
          'Exchange: Binance e Bybit, trades via API del bot; collegare API personali è vietato'
        ],
        [
          'Crittografia: AES-256, RSA-4096, SHA-512',
          'Protezione DDoS, server di backup globali, autenticazione multi-livello',
          'Fallimento del bot: la riserva di liquidità rimborsa automaticamente investimenti e profitti'
        ],
        [
          'Licenza: Syntrix Algo Systems LLC, Dubai; autorizzata per bot di trading algoritmico crypto',
          'Non è una piramide: transazioni trasparenti, percentuali garantite, trade tracciabili',
          'Differenza da staking/mining: fondi mai bloccati, reddito passivo senza hardware né costi elettrici'
        ],
        [
          'Attiva la 2FA',
          'Usa una SIM registrata',
          'Configura una domanda/risposta segreta durante la registrazione per recuperare l\'account se perdi telefono o SIM'
        ]
      ]
    }
  ]
}

export const dutchWhitepaperContent: WhitepaperContent = {
  title: 'Whitepaper van Syntrix',
  sections: [
    {
      title: '1. Introductie',
      paragraphs: [
        'Syntrix is een tradingbot van de volgende generatie, gebouwd op Smart Money Concepts (SMC), liquiditeitsanalyse, orderboek-analyse en institutionele risicobeheerstrategieën. Syntrix levert consistente prestaties in onvoorspelbare markten dankzij een bewezen en continu geoptimaliseerd algoritme.',
        'Syntrix kan ook worden gebruikt als wallet die passief inkomen genereert:',
        'Syntrix combineert bankniveau betrouwbaarheid, scalper snelheid en blockchain transparantie.'
      ],
      lists: [
        [
          'Activa blijven beschikbaar tenzij ze als margin in een open trade zitten',
          'Opnamesnelheid: verwerkt door de bot binnen 3 seconden plus netwerktijd',
          'Veilige opslag en transparantie: blockchain-verificatie van transacties'
        ]
      ]
    },
    {
      title: '2. Problemen bij traditioneel handelen',
      paragraphs: [
        'Uitdagingen bij traditioneel handelen:',
        'Syntrix-oplossingen:',
        'Voorbeeldberekening:',
        'Specifieke handelskenmerken:'
      ],
      lists: [
        [
          'Vereist jaren aan marktkennis om stabiele inkomsten te genereren',
          'Moet 24/7 gemonitord worden om kansen niet te missen',
          'Emoties leiden vaak tot slechte beslissingen',
          'Fouten kunnen tot kapitaalverlies leiden'
        ],
        [
          'Volledig geautomatiseerd passief inkomen',
          'Strategieën zijn 5–10 jaar backtested met een slagingspercentage boven 90%',
          'Strikt risicobeheer: maximaal 1% risico per trade'
        ],
        [
          'Botkapitaal: $1.000.000',
          'Risico per trade: $10.000 (1%)',
          'Risk/Reward ratio: 1:5',
          'Een verlies van $10.000 wordt gecompenseerd door de volgende winstgevende trade van $50.000',
          'Maximaal twee opeenvolgende verliezen',
          'Maximaal zeventien opeenvolgende winstgevende trades'
        ],
        [
          'Handelt alleen in cryptoparen',
          'Duur van een trade: 30–60 minuten',
          'Trades per dag: 17–30'
        ]
      ]
    },
    {
      title: '3. Beveiliging en liquiditeitspool',
      paragraphs: [
        'Syntrix beschermt investeerders via een drieledig beveiligingssysteem:',
        { text: '1. 50% van de winst — uitbetalingen aan klanten', semibold: true },
        { text: '2. 25% van de winst — liquiditeitsreserve', semibold: true },
        { text: '3. 25% van de winst — team en ontwikkeling', semibold: true }
      ],
      lists: [
        [
          'De helft van de dagelijkse winst wordt uitbetaald aan investeerders',
          'Syntrix levert consistente performance via bewezen en continu geoptimaliseerde algoritmes'
        ],
        [
          'Fondsen worden bewaard in een versleutelde wallet, ontoegankelijk voor het team',
          'De reservepool is groter dan de actieve investeringen: $53M vs $48M'
        ],
        [
          '25% van de nettowinst na uitbetalingen blijft in het systeem',
          'Fondsen vloeien naar salarissen, dividenden, botontwikkeling en groei van het ecosysteem',
          'Het creëert een win-winsituatie voor investeerders en het team'
        ]
      ]
    },
    {
      title: '4. Wie ontwikkelde Syntrix',
      paragraphs: [
        'Syntrix is ontwikkeld door een team van meer dan 40 specialisten, waaronder ontwikkelaars, cyberbeveiligingsexperts en supportmedewerkers. De leiding bestaat uit voormalige medewerkers van grote market makers en exchanges zoals Binance, OKX en MEX.',
        { text: 'Market makers zijn professionals die de liquiditeit op beurzen beheren:', semibold: true },
        'Syntrix benut 5–10 jaar ervaring in trading, IT en cybersecurity. Het compacte team (~50 mensen) bevat C-level experts die infrastructuur voor grote exchanges bouwden.'
      ],
      lists: [[
        'Creëren en balanceren van orders om vraag en aanbod te matchen',
        'Onderhouden van diepte in het orderboek en handelsstabiliteit',
        'Ontwikkelen van interne protocollen en waarborgen van platformbeveiliging'
      ]]
    },
    {
      title: '5. Registratie en jurisdictie',
      paragraphs: [
        'Syntrix is geregistreerd in Dubai als Syntrix Algo Systems LLC.',
        { text: 'Redenen voor registratie in Dubai:', semibold: true },
        'Ongeveer 80% van het team is gevestigd in Dubai, de rest werkt wereldwijd op afstand.'
      ],
      lists: [['Geen belastingen voor crypto bedrijven', 'Hoog beveiligingsniveau en wettelijke stabiliteit']]
    },
    {
      title: '6. Operationele periode en open beta',
      paragraphs: [
        { boldPrefix: 'Closed beta:', text: '6 jaar met stabiele winsten voor het team en private partners' },
        { boldPrefix: 'Open beta:', text: 'Meer dan 9 maanden waarin gewone gebruikers met klein kapitaal kunnen deelnemen en verdienen' }
      ]
    },
    {
      title: '7. Ondersteunde valuta',
      lists: [[
        'Ondersteunt alle grote cryptocurrencies: USDT, USDC, ETH, Solana, Bitcoin',
        'Stortingen worden automatisch omgezet naar USDT voor interne handel',
        'Winst wordt gecrediteerd in stablecoins om marktschommelingen te dempen',
        'Opnames zijn enkel mogelijk in USDT of USDC'
      ]]
    },
    {
      title: '8. Uitbetalingsverwerking',
      paragraphs: [
        { boldPrefix: 'Bot verwerking:', text: '3 seconden' },
        { boldPrefix: 'Netwerk tijd:', text: '' },
        { boldPrefix: 'Totale opname:', text: 'minder dan 1 minuut' }
      ],
      lists: [['USDT BEP20 — tot 20 seconden', 'Ethereum — iets langer']]
    },
    {
      title: '9. Risico op kapitaalverlies',
      lists: [[
        'Maximaal risico per trade: 1% van de storting',
        '25% van de winst wordt vastgehouden in de liquiditeitsreserve om te beschermen tegen black swan events',
        'Klantengelden zijn versleuteld en ontoegankelijk voor het team',
        'Meerdere beveiligingslagen worden toegepast door experts van Binance en andere exchanges',
        'Zelfs tijdens verliesreeksen blijft het kapitaal beschermd',
        'Opnames van meer dan 10% van het saldo zonder voorafgaande melding kunnen de handel beïnvloeden en tot liquidatie leiden',
        'Alle handelsactiviteiten vinden plaats onder volledige eigen verantwoordelijkheid en discretie van de gebruiker'
      ]]
    },
    {
      title: '10. Liquiditeitsreservepool',
      lists: [['25% van de winsten wordt dagelijks gereserveerd', 'De pool overstijgt de huidige investeringen: $53M vs $48M']]
    },
    {
      title: '11. Handelsstrategieën',
      paragraphs: ['Syntrix gebruikt:', 'Strategieën worden continu gemonitord, verbeterd of uitgesloten als de performance daalt.'],
      lists: [[
        'Smart Money Concepts (SMC)',
        'ICT strategieën',
        'Liquiditeits- en orderboek analyse',
        'Elliott Wave analyse',
        'Gecombineerde technische analyse'
      ]]
    },
    {
      title: '12. Handelsfrequentie en slagingspercentage',
      lists: [[
        { boldPrefix: 'Duur van een trade:', text: '30–60 minuten' },
        { boldPrefix: 'Gemiddeld aantal trades:', text: '~1 per uur' },
        { boldPrefix: 'Winrate:', text: '90%+' }
      ]]
    },
    {
      title: '13. Risico van opeenvolgende verliezen',
      lists: [[
        'Maximaal twee verliestrades achter elkaar voordat de bot pauzeert',
        'Na drie verliestrades stopt de bot en herzien strategieën',
        'De liquiditeitsreserve garandeert dat klanten toch winsten ontvangen tijdens kortdurende drawdowns'
      ]]
    },
    {
      title: '14. Marktvolatiliteit',
      lists: [[
        'Volatiliteit versnelt trades en vergroot de winstgevendheid',
        'Cryptomarkten zijn ideaal voor scalping en korte termijn trades'
      ]]
    },
    {
      title: '15. Syntrix gebruiken als wallet',
      lists: [[
        'Stortingen en opnames: binnen 1 minuut',
        'Fondsen zijn altijd beschikbaar',
        'Passief dagelijkse inkomsten volgens het gekozen plan',
        'Volledige beveiliging en toegang tot de activa'
      ]]
    },
    {
      title: '16. Risico per trade',
      paragraphs: [{ text: 'Risicomanagement:', semibold: true }, { text: 'Winstpotentieel:', semibold: true }],
      lists: [[
        'Altijd 1% risico per trade',
        'Minimale Risk/Reward: 1:5'
      ], [
        'Potentiële winst per trade: 5–17%',
        'Winrate: 90%+'
      ]]
    },
    {
      title: '17. Referralprogramma',
      lists: [[
        'Driedelig programma: 4% / 3% / 2% van referralwinsten',
        'Totale passieve inkomsten via referrals: 9%'
      ]]
    },
    {
      title: '18. Prijsplannen',
      lists: [[
        { boldPrefix: 'Bronze:', text: '$10–$99 (0,30% per dag)' },
        { boldPrefix: 'Silver:', text: '$100–$499 (0,50% per dag)' },
        { boldPrefix: 'Gold:', text: '$500–$999 (0,80% per dag)' },
        { boldPrefix: 'Platinum:', text: '$1000–$4999 (1,00% per dag)' },
        { boldPrefix: 'Diamond:', text: '$5000–$19999 (1,30% per dag)' },
        { boldPrefix: 'Black:', text: '$20000–$100000 (1,70% per dag)' },
        { boldPrefix: 'Aangepaste plannen:', text: 'stortingen > $100000 (8%+ per dag)' }
      ]]
    },
    {
      title: '19. Overige vragen',
      paragraphs: [
        { text: 'Algemene informatie:', semibold: true },
        'Misbruik, exploitatie of manipulatie van het Syntrix-systeem of het referralprogramma is streng verboden. Bij constatering kan het account zonder waarschuwing worden opgeschort.',
        { text: 'Beveiligingssysteem:', semibold: true },
        { text: 'Juridisch & compliance:', semibold: true },
        { text: 'Gebruiksvoorwaarden en beperkingen:', semibold: true },
        { text: 'Telegram beveiliging:', semibold: true }
      ],
      lists: [
        [
          'Een storting sluiten: de investeerder kan alle fondsen opnemen; de storting sluit en de bot stopt met winst genereren',
          'Kosten: alleen blockchain netwerkfees zijn van toepassing',
          'Exchanges: Binance en Bybit, trades via bot-API; persoonlijke API-koppelingen zijn verboden'
        ],
        [
          'Encryptie: AES-256, RSA-4096, SHA-512 hashing',
          'DDoS-bescherming, wereldwijde backup-servers, multi-level authenticatie',
          'Botuitval: liquiditeitsreserve keert automatisch alle investeringen en winsten terug'
        ],
        [
          'Licentie: Syntrix Algo Systems LLC, Dubai; gelicentieerd voor algorithmische crypto trading bots',
          'Geen financieel piramidespel: volledige transparantie, gegarandeerde percentages, traceerbare trades',
          'Verschil met staking en mining: fondsen worden nooit vastgezet, passief inkomen zonder hardware of stroomkosten'
        ],
        [
          'Schakel 2FA in',
          'Gebruik een geregistreerde simkaart',
          'Stel een geheime vraag en antwoord in tijdens registratie om het account terug te halen bij verlies van telefoon of SIM'
        ]
      ]
    }
  ]
}
