export type Language = 'en' | 'de' | 'es' | 'fr' | 'pt' | 'nl'

export const languages = [
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'de' as const, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es' as const, name: 'Español', flag: '🇪🇸' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷' },
  { code: 'pt' as const, name: 'Português', flag: '🇵🇹' },
  { code: 'nl' as const, name: 'Nederlands', flag: '🇳🇱' }
]

export const translations = {
  en: {
    header: {
      telegramChannel: 'Telegram Channel',
      whitepaper: 'Whitepaper',
      signIn: 'Sign In',
      getStarted: 'Get Started'
    },
    hero: {
      title: 'Automate Your',
      subtitle: 'Crypto Trading',
      description: 'Professional AI-powered trading bot for 24/7 cryptocurrency trading on all major exchanges',
      startTrading: 'Start Trading',
      learnMore: 'Learn More',
      users: 'Over 50,000 users',
      support: '24/7 support',
      uptime: '99.9% uptime'
    },
    whyChoose: {
      title: 'WHY CHOOSE',
      subtitle: 'SYNTRIX?',
      automation: {
        title: 'AUTOMATION 24/7',
        description: 'Syntrix Bot runs nonstop, analyzing markets every second with proven entry models, ensuring stable profits and deposit safety in any market.'
      },
      safety: {
        title: 'DEPOSIT SAFETY',
        description: 'Built-in risk management protects capital; even small losses (−1–2%) are covered from the insurance pool.'
      },
      logic: {
        title: 'SMART TRADING LOGIC',
        description: 'Powered by Smart Money Concepts, ICT, TPO, candlestick patterns, Renko charts, and AI-driven strategy adaptation.'
      },
      liquidity: {
        title: 'HIGH LIQUIDITY',
        description: 'Trade on top exchanges with deep order books ensuring optimal entry and exit prices for maximum profitability.'
      },
      withdrawals: {
        title: 'INSTANT WITHDRAWALS',
        description: 'Access your profits anytime with instant withdrawal processing directly to your wallet or exchange account.'
      },
      transparency: {
        title: 'TRANSPARENCY & CONTROL',
        description: 'Full visibility of all trades, strategies, and performance metrics with detailed analytics and reporting.'
      }
    },
    tariffPlans: {
      title: 'Calculate Your',
      subtitle: 'Profit Instantly',
      depositAmount: 'Deposit amount:',
      timePeriod: 'Time period selection:',
      tariffPlansTitle: 'Tariff Plans',
      selectedPlan: 'Selected Plan:',
      dailyProfit: 'Daily Profit:',
      estimatedProfit: 'Estimated Profit:',
      day: 'Day'
    },
    statistics: {
      title: 'Our Achievements',
      description: 'Numbers that speak to the reliability and efficiency of our platform',
      activeUsers: 'Active users',
      tradingVolume: 'Million trading volume',
      successfulTrades: 'Successful trades',
      support: 'Support without holidays'
    },
    leaderboard: {
      title: 'LEADERBOARD',
      description: 'Top performers in the SYNTRIX ecosystem. Real-time rankings based on deposits and network growth.',
      topInvestors: 'TOP INVESTORS',
      topReferrals: 'TOP REFERRALS',
      rank: 'Rank',
      investorId: 'Investor ID',
      deposit: 'Deposit',
      profit: 'Profit',
      referrerId: 'Referrer ID',
      referrals: 'Referrals',
      networkValue: 'Network Value',
      updatedEvery: 'Updated every',
      hours: '24 hours'
    },
    matrixHero: {
      badge: 'Future Technology',
      title: 'Intelligent Trading with',
      titleBrand: 'SYNTRIX',
      description: 'Powerful system based on Smart Money concepts, ICT, and liquidity strategies. Our bot adapts to the market in real-time, ensuring maximum efficiency.',
      instantResponse: 'Instant Response',
      instantResponseDesc: 'Analysis in milliseconds',
      highAccuracy: 'High Accuracy',
      highAccuracyDesc: 'AI algorithms',
      startNow: 'Start Now',
      aiTitle: 'SYNTRIX AI',
      aiSubtitle: 'Trade with Artificial Intelligence',
      realTime: 'REAL-TIME'
    },
    referral: {
      title: 'REFERRAL SYSTEM',
      description: 'Earn daily profits from your network. Three levels deep, transparent and instant.',
      level1: 'Level 1',
      level1Title: 'Your Friends',
      level1Percent: '4%',
      level2: 'Level 2',
      level2Title: 'Friends of Friends',
      level2Percent: '3%',
      level3: 'Level 3',
      level3Title: 'Third Level',
      level3Percent: '2%',
      dailyFromDeposits: '/daily from their deposits',
      you: 'YOU',
      totalEarnings: 'Total Earnings',
      dailyRate: '/daily',
      passiveIncome: 'Passive Income',
      example: 'Example:',
      exampleAmount: '$1000 per level',
      exampleResult: '$90/day'
    },
    faq: {
      title: 'Frequently Asked Questions',
      subtitle: 'Answers to the most popular questions about our platform',
      questions: {
        q1: {
          question: 'Withdrawals',
          answer: 'SyntrixBot supports instant and unlimited withdrawals in USDT or USDC across all major networks (BEP20, ERC20, TRC20, Solana, etc.). Requests are processed within 1–2 seconds, and funds arrive in 1–2 minutes. Users only need to provide the wallet, network, currency, and amount — the system handles the rest.'
        },
        q2: {
          question: 'Strategy updates',
          answer: 'SyntrixBot applies only proven strategies based on SMC, liquidity mapping, order book analysis, and algorithmic risk management. Systems are backtested for 5–7 years, with risk limited to 1% per trade, and a reserve liquidity pool ensures capital protection. The team continuously tests new assets, and only strategies with a confirmed win rate above 90% are implemented.'
        },
        q3: {
          question: 'Weekend trading',
          answer: 'SyntrixBot operates 24/7 without interruptions. Unlike traditional markets, the crypto market never closes, and the bot\'s algorithms are optimized to leverage weekend volatility, allowing capital to work continuously and generate consistent results.'
        },
        q4: {
          question: 'Supported assets',
          answer: 'SyntrixBot accepts deposits in any cryptocurrency from the top 100 by market capitalization, including USDT, USDC, BTC, ETH, BNB, SOL, and more. All deposits are automatically converted to USDT at the current rate, ensuring stability and protection from volatility. Withdrawals are always processed in USDT or USDC. VIP clients can choose a no-conversion mode, where deposits and withdrawals are possible in the same asset, with profits credited in USDT/USDC.'
        },
        q5: {
          question: 'Concept used',
          answer: 'SyntrixBot follows core principles: prioritizing stability, applying strict risk management, using strategies with high statistical reliability, ensuring full automation, focusing on liquid assets, and leveraging the expertise of former market makers. This approach delivers reliability, predictable outcomes, and sustainable profit.'
        },
        q6: {
          question: 'Referral system availability',
          answer: 'SyntrixBot offers a three-level referral program: 4% from direct referrals, 3% from second-level referrals, and 2% from the third level. The total passive income can reach up to 9%. The program is fully integrated into the platform and runs automatically, enabling additional earnings without extra effort.'
        }
      }
    },
    supportedAssets: {
      title: 'SUPPORTED',
      subtitle: 'ASSETS',
      description: 'MatrixBot accepts deposits in any cryptocurrency from the top 100 by market capitalization, including USDT, USDC, BTC, ETH, BNB, SOL, and more. All deposits are automatically converted to USDT at the current rate, ensuring stability and protection from volatility. Withdrawals are always processed in USDT or USDC. VIP clients can choose a no-conversion mode, where deposits and withdrawals are possible in the same asset, with profits credited in USDT/USDC.',
      popularAssets: 'POPULAR CRYPTOCURRENCIES',
      andMore: '+ 94 more from top 100',
      top100: 'TOP 100 CRYPTOCURRENCIES',
      top100Desc: 'Accept deposits in any crypto from the top 100 by market cap',
      autoConvert: 'AUTO-CONVERSION TO USDT',
      autoConvertDesc: 'All deposits automatically converted at current rate for stability',
      stableWithdrawals: 'STABLE WITHDRAWALS',
      stableWithdrawalsDesc: 'Withdrawals processed in USDT or USDC only',
      vipMode: 'VIP NO-CONVERSION MODE',
      vipModeDesc: 'VIP clients can deposit and withdraw in the same asset'
    },
    finalCTA: {
      title: 'Ready to Start Trading?',
      description: 'Start automated crypto trading today and maximize your profits with AI-powered strategies',
      button: 'JOIN BOT'
    },
    footer: {
      tagline: 'Professional automated cryptocurrency trading platform',
      product: 'Product',
      features: 'Features',
      calculator: 'Calculator',
      faq: 'FAQ',
      documentation: 'Documentation',
      company: 'Company',
      aboutUs: 'About Us',
      blog: 'Blog',
      careers: 'Careers',
      contact: 'Contact',
      socialMedia: 'Social Media',
      copyright: '© 2024 SYNTRIX. All rights reserved.',
      privacyPolicy: 'Privacy Policy',
      termsOfUse: 'Terms of Use'
    }
  },
  de: {
    header: {
      telegramChannel: 'Telegram-Kanal',
      whitepaper: 'Whitepaper',
      signIn: 'Anmelden',
      getStarted: 'Loslegen'
    },
    hero: {
      title: 'Automatisieren Sie Ihr',
      subtitle: 'Krypto-Trading',
      description: 'Professioneller KI-gestützter Trading-Bot für 24/7 Kryptowährungshandel auf allen großen Börsen',
      startTrading: 'Trading starten',
      learnMore: 'Mehr erfahren',
      users: 'Über 50.000 Benutzer',
      support: '24/7 Support',
      uptime: '99,9% Verfügbarkeit'
    },
    whyChoose: {
      title: 'WARUM',
      subtitle: 'SYNTRIX?',
      automation: {
        title: 'AUTOMATISIERUNG 24/7',
        description: 'Syntrix Bot läuft ununterbrochen und analysiert die Märkte jede Sekunde mit bewährten Einstiegsmodellen für stabile Gewinne und Einlagensicherheit.'
      },
      safety: {
        title: 'EINLAGENSICHERHEIT',
        description: 'Integriertes Risikomanagement schützt Ihr Kapital; selbst kleine Verluste (−1–2%) werden aus dem Versicherungspool gedeckt.'
      },
      logic: {
        title: 'INTELLIGENTE HANDELSLOGIK',
        description: 'Angetrieben von Smart Money Concepts, ICT, TPO, Kerzenmuster, Renko-Charts und KI-gesteuerter Strategieanpassung.'
      },
      liquidity: {
        title: 'HOHE LIQUIDITÄT',
        description: 'Handeln Sie an Top-Börsen mit tiefen Orderbüchern für optimale Ein- und Ausstiegspreise und maximale Rentabilität.'
      },
      withdrawals: {
        title: 'SOFORTIGE AUSZAHLUNGEN',
        description: 'Greifen Sie jederzeit auf Ihre Gewinne zu mit sofortiger Auszahlungsabwicklung direkt auf Ihr Wallet oder Börsenkonto.'
      },
      transparency: {
        title: 'TRANSPARENZ & KONTROLLE',
        description: 'Vollständige Sichtbarkeit aller Trades, Strategien und Leistungskennzahlen mit detaillierten Analysen und Berichten.'
      }
    },
    tariffPlans: {
      title: 'Berechnen Sie Ihren',
      subtitle: 'Gewinn sofort',
      depositAmount: 'Einzahlungsbetrag:',
      timePeriod: 'Zeitraumauswahl:',
      tariffPlansTitle: 'Tarifpläne',
      selectedPlan: 'Ausgewählter Plan:',
      dailyProfit: 'Täglicher Gewinn:',
      estimatedProfit: 'Geschätzter Gewinn:',
      day: 'Tag'
    },
    statistics: {
      title: 'Unsere Erfolge',
      description: 'Zahlen, die für die Zuverlässigkeit und Effizienz unserer Plattform sprechen',
      activeUsers: 'Aktive Benutzer',
      tradingVolume: 'Millionen Handelsvolumen',
      successfulTrades: 'Erfolgreiche Trades',
      support: 'Support ohne Feiertage'
    },
    leaderboard: {
      title: 'BESTENLISTE',
      description: 'Top-Performer im SYNTRIX-Ökosystem. Echtzeit-Rankings basierend auf Einlagen und Netzwerkwachstum.',
      topInvestors: 'TOP-INVESTOREN',
      topReferrals: 'TOP-EMPFEHLUNGEN',
      rank: 'Rang',
      investorId: 'Investor-ID',
      deposit: 'Einzahlung',
      profit: 'Gewinn',
      referrerId: 'Empfehler-ID',
      referrals: 'Empfehlungen',
      networkValue: 'Netzwerkwert',
      updatedEvery: 'Aktualisiert alle',
      hours: '24 Stunden'
    },
    matrixHero: {
      badge: 'Zukunftstechnologie',
      title: 'Intelligenter Handel mit',
      titleBrand: 'SYNTRIX',
      description: 'Leistungsstarkes System basierend auf Smart Money Konzepten, ICT und Liquiditätsstrategien. Unser Bot passt sich in Echtzeit an den Markt an und gewährleistet maximale Effizienz.',
      instantResponse: 'Sofortige Reaktion',
      instantResponseDesc: 'Analyse in Millisekunden',
      highAccuracy: 'Hohe Genauigkeit',
      highAccuracyDesc: 'KI-Algorithmen',
      startNow: 'Jetzt starten',
      aiTitle: 'SYNTRIX AI',
      aiSubtitle: 'Handeln Sie mit künstlicher Intelligenz',
      realTime: 'ECHTZEIT'
    },
    referral: {
      title: 'EMPFEHLUNGSSYSTEM',
      description: 'Verdienen Sie tägliche Gewinne aus Ihrem Netzwerk. Drei Ebenen tief, transparent und sofort.',
      level1: 'Ebene 1',
      level1Title: 'Ihre Freunde',
      level1Percent: '4%',
      level2: 'Ebene 2',
      level2Title: 'Freunde von Freunden',
      level2Percent: '3%',
      level3: 'Ebene 3',
      level3Title: 'Dritte Ebene',
      level3Percent: '2%',
      dailyFromDeposits: '/täglich von ihren Einlagen',
      you: 'SIE',
      totalEarnings: 'Gesamtverdienst',
      dailyRate: '/täglich',
      passiveIncome: 'Passives Einkommen',
      example: 'Beispiel:',
      exampleAmount: '$1000 pro Ebene',
      exampleResult: '$90/Tag'
    },
    faq: {
      title: 'Häufig gestellte Fragen',
      subtitle: 'Antworten auf die häufigsten Fragen zu unserer Plattform',
      questions: {
        q1: {
          question: 'Auszahlungen',
          answer: 'SyntrixBot unterstützt sofortige und unbegrenzte Auszahlungen in USDT oder USDC über alle wichtigen Netzwerke (BEP20, ERC20, TRC20, Solana usw.). Anfragen werden innerhalb von 1–2 Sekunden bearbeitet und Gelder treffen in 1–2 Minuten ein. Benutzer müssen nur die Wallet, das Netzwerk, die Währung und den Betrag angeben – das System erledigt den Rest.'
        },
        q2: {
          question: 'Strategie-Updates',
          answer: 'SyntrixBot wendet nur bewährte Strategien an, die auf SMC, Liquiditätsmapping, Orderbuchanalyse und algorithmischem Risikomanagement basieren. Systeme werden 5–7 Jahre lang zurückgetestet, mit einem auf 1% pro Trade begrenzten Risiko, und ein Reserve-Liquiditätspool gewährleistet Kapitalschutz. Das Team testet kontinuierlich neue Assets, und nur Strategien mit einer bestätigten Gewinnrate von über 90% werden implementiert.'
        },
        q3: {
          question: 'Wochenendhandel',
          answer: 'SyntrixBot arbeitet 24/7 ohne Unterbrechungen. Anders als traditionelle Märkte schließt der Kryptomarkt nie, und die Algorithmen des Bots sind optimiert, um die Wochenendvolatilität zu nutzen, sodass das Kapital kontinuierlich arbeiten und konsistente Ergebnisse erzielen kann.'
        },
        q4: {
          question: 'Unterstützte Assets',
          answer: 'SyntrixBot akzeptiert Einzahlungen in jeder Kryptowährung aus den Top 100 nach Marktkapitalisierung, einschließlich USDT, USDC, BTC, ETH, BNB, SOL und mehr. Alle Einzahlungen werden automatisch zum aktuellen Kurs in USDT umgewandelt, um Stabilität und Schutz vor Volatilität zu gewährleisten. Auszahlungen werden immer in USDT oder USDC verarbeitet. VIP-Kunden können einen Nicht-Konvertierungsmodus wählen, bei dem Einzahlungen und Auszahlungen im selben Asset möglich sind, wobei Gewinne in USDT/USDC gutgeschrieben werden.'
        },
        q5: {
          question: 'Verwendetes Konzept',
          answer: 'SyntrixBot folgt Kernprinzipien: Priorisierung von Stabilität, Anwendung strikten Risikomanagements, Verwendung von Strategien mit hoher statistischer Zuverlässigkeit, Gewährleistung vollständiger Automatisierung, Fokus auf liquide Assets und Nutzung der Expertise ehemaliger Market Maker. Dieser Ansatz liefert Zuverlässigkeit, vorhersehbare Ergebnisse und nachhaltigen Gewinn.'
        },
        q6: {
          question: 'Verfügbarkeit des Empfehlungssystems',
          answer: 'SyntrixBot bietet ein dreistufiges Empfehlungsprogramm: 4% von direkten Empfehlungen, 3% von Empfehlungen der zweiten Ebene und 2% von der dritten Ebene. Das gesamte passive Einkommen kann bis zu 9% erreichen. Das Programm ist vollständig in die Plattform integriert und läuft automatisch, wodurch zusätzliche Einnahmen ohne zusätzlichen Aufwand ermöglicht werden.'
        }
      }
    },
    supportedAssets: {
      title: 'UNTERSTÜTZTE',
      subtitle: 'ASSETS',
      description: 'MatrixBot akzeptiert Einzahlungen in jeder Kryptowährung aus den Top 100 nach Marktkapitalisierung, einschließlich USDT, USDC, BTC, ETH, BNB, SOL und mehr. Alle Einzahlungen werden automatisch zum aktuellen Kurs in USDT umgewandelt, um Stabilität und Schutz vor Volatilität zu gewährleisten. Auszahlungen werden immer in USDT oder USDC verarbeitet. VIP-Kunden können einen Nicht-Konvertierungsmodus wählen, bei dem Einzahlungen und Auszahlungen im selben Asset möglich sind, wobei Gewinne in USDT/USDC gutgeschrieben werden.',
      popularAssets: 'BELIEBTE KRYPTOWÄHRUNGEN',
      andMore: '+ 94 weitere aus den Top 100',
      top100: 'TOP 100 KRYPTOWÄHRUNGEN',
      top100Desc: 'Einzahlungen in jeder Krypto aus den Top 100 nach Marktkapitalisierung akzeptieren',
      autoConvert: 'AUTO-UMWANDLUNG IN USDT',
      autoConvertDesc: 'Alle Einzahlungen werden automatisch zum aktuellen Kurs für Stabilität umgewandelt',
      stableWithdrawals: 'STABILE AUSZAHLUNGEN',
      stableWithdrawalsDesc: 'Auszahlungen nur in USDT oder USDC verarbeitet',
      vipMode: 'VIP NICHT-KONVERTIERUNGSMODUS',
      vipModeDesc: 'VIP-Kunden können im selben Asset einzahlen und abheben'
    },
    finalCTA: {
      title: 'Bereit zum Trading zu starten?',
      description: 'Starten Sie noch heute automatisierten Krypto-Handel und maximieren Sie Ihre Gewinne mit KI-gestützten Strategien',
      button: 'BOT BEITRETEN'
    },
    footer: {
      tagline: 'Professionelle automatisierte Kryptowährungs-Handelsplattform',
      product: 'Produkt',
      features: 'Funktionen',
      calculator: 'Rechner',
      faq: 'FAQ',
      documentation: 'Dokumentation',
      company: 'Unternehmen',
      aboutUs: 'Über uns',
      blog: 'Blog',
      careers: 'Karriere',
      contact: 'Kontakt',
      socialMedia: 'Soziale Medien',
      copyright: '© 2024 SYNTRIX. Alle Rechte vorbehalten.',
      privacyPolicy: 'Datenschutzrichtlinie',
      termsOfUse: 'Nutzungsbedingungen'
    }
  },
  es: {
    header: {
      telegramChannel: 'Canal de Telegram',
      whitepaper: 'Whitepaper',
      signIn: 'Iniciar sesión',
      getStarted: 'Comenzar'
    },
    hero: {
      title: 'Automatiza Tu',
      subtitle: 'Trading de Cripto',
      description: 'Bot de trading profesional con IA para operar 24/7 en criptomonedas en todas las principales bolsas',
      startTrading: 'Comenzar a operar',
      learnMore: 'Saber más',
      users: 'Más de 50.000 usuarios',
      support: 'Soporte 24/7',
      uptime: '99,9% disponibilidad'
    },
    whyChoose: {
      title: '¿POR QUÉ ELEGIR',
      subtitle: 'SYNTRIX?',
      automation: {
        title: 'AUTOMATIZACIÓN 24/7',
        description: 'Syntrix Bot funciona sin parar, analizando los mercados cada segundo con modelos de entrada probados para ganancias estables y seguridad de depósito.'
      },
      safety: {
        title: 'SEGURIDAD DE DEPÓSITO',
        description: 'La gestión de riesgos integrada protege el capital; incluso las pequeñas pérdidas (−1–2%) están cubiertas por el fondo de seguro.'
      },
      logic: {
        title: 'LÓGICA DE TRADING INTELIGENTE',
        description: 'Impulsado por Smart Money Concepts, ICT, TPO, patrones de velas, gráficos Renko y adaptación de estrategia con IA.'
      },
      liquidity: {
        title: 'ALTA LIQUIDEZ',
        description: 'Opera en las mejores bolsas con libros de órdenes profundos que garantizan precios óptimos de entrada y salida para máxima rentabilidad.'
      },
      withdrawals: {
        title: 'RETIROS INSTANTÁNEOS',
        description: 'Accede a tus ganancias en cualquier momento con procesamiento instantáneo de retiros directamente a tu wallet o cuenta de exchange.'
      },
      transparency: {
        title: 'TRANSPARENCIA Y CONTROL',
        description: 'Visibilidad completa de todas las operaciones, estrategias y métricas de rendimiento con análisis detallados e informes.'
      }
    },
    tariffPlans: {
      title: 'Calcule Su',
      subtitle: 'Ganancia Instantáneamente',
      depositAmount: 'Monto del depósito:',
      timePeriod: 'Selección de período de tiempo:',
      tariffPlansTitle: 'Planes Tarifarios',
      selectedPlan: 'Plan Seleccionado:',
      dailyProfit: 'Ganancia Diaria:',
      estimatedProfit: 'Ganancia Estimada:',
      day: 'Día'
    },
    statistics: {
      title: 'Nuestros Logros',
      description: 'Números que hablan de la fiabilidad y eficiencia de nuestra plataforma',
      activeUsers: 'Usuarios activos',
      tradingVolume: 'Millones de volumen de trading',
      successfulTrades: 'Trades exitosos',
      support: 'Soporte sin días festivos'
    },
    leaderboard: {
      title: 'TABLA DE CLASIFICACIÓN',
      description: 'Los mejores performers en el ecosistema SYNTRIX. Rankings en tiempo real basados en depósitos y crecimiento de red.',
      topInvestors: 'MEJORES INVERSORES',
      topReferrals: 'MEJORES REFERIDOS',
      rank: 'Rango',
      investorId: 'ID de Inversor',
      deposit: 'Depósito',
      profit: 'Ganancia',
      referrerId: 'ID de Referidor',
      referrals: 'Referidos',
      networkValue: 'Valor de Red',
      updatedEvery: 'Actualizado cada',
      hours: '24 horas'
    },
    matrixHero: {
      badge: 'Tecnología del Futuro',
      title: 'Trading Inteligente con',
      titleBrand: 'SYNTRIX',
      description: 'Sistema potente basado en conceptos de Smart Money, ICT y estrategias de liquidez. Nuestro bot se adapta al mercado en tiempo real, garantizando máxima eficiencia.',
      instantResponse: 'Respuesta Instantánea',
      instantResponseDesc: 'Análisis en milisegundos',
      highAccuracy: 'Alta Precisión',
      highAccuracyDesc: 'Algoritmos de IA',
      startNow: 'Comenzar Ahora',
      aiTitle: 'SYNTRIX AI',
      aiSubtitle: 'Opera con Inteligencia Artificial',
      realTime: 'TIEMPO REAL'
    },
    referral: {
      title: 'SISTEMA DE REFERIDOS',
      description: 'Gana ganancias diarias de tu red. Tres niveles de profundidad, transparente e instantáneo.',
      level1: 'Nivel 1',
      level1Title: 'Tus Amigos',
      level1Percent: '4%',
      level2: 'Nivel 2',
      level2Title: 'Amigos de Amigos',
      level2Percent: '3%',
      level3: 'Nivel 3',
      level3Title: 'Tercer Nivel',
      level3Percent: '2%',
      dailyFromDeposits: '/diario de sus depósitos',
      you: 'TÚ',
      totalEarnings: 'Ganancias Totales',
      dailyRate: '/diario',
      passiveIncome: 'Ingreso Pasivo',
      example: 'Ejemplo:',
      exampleAmount: '$1000 por nivel',
      exampleResult: '$90/día'
    },
    faq: {
      title: 'Preguntas Frecuentes',
      subtitle: 'Respuestas a las preguntas más populares sobre nuestra plataforma',
      questions: {
        q1: {
          question: 'Retiros',
          answer: 'SyntrixBot admite retiros instantáneos e ilimitados en USDT o USDC en todas las redes principales (BEP20, ERC20, TRC20, Solana, etc.). Las solicitudes se procesan en 1–2 segundos y los fondos llegan en 1–2 minutos. Los usuarios solo necesitan proporcionar la wallet, la red, la moneda y el monto: el sistema se encarga del resto.'
        },
        q2: {
          question: 'Actualizaciones de estrategia',
          answer: 'SyntrixBot aplica solo estrategias probadas basadas en SMC, mapeo de liquidez, análisis de libro de órdenes y gestión algorítmica de riesgos. Los sistemas se prueban durante 5–7 años, con riesgo limitado al 1% por operación, y un fondo de liquidez de reserva garantiza la protección del capital. El equipo prueba continuamente nuevos activos, y solo se implementan estrategias con una tasa de éxito confirmada superior al 90%.'
        },
        q3: {
          question: 'Trading de fin de semana',
          answer: 'SyntrixBot opera 24/7 sin interrupciones. A diferencia de los mercados tradicionales, el mercado cripto nunca cierra, y los algoritmos del bot están optimizados para aprovechar la volatilidad del fin de semana, permitiendo que el capital trabaje continuamente y genere resultados consistentes.'
        },
        q4: {
          question: 'Activos compatibles',
          answer: 'SyntrixBot acepta depósitos en cualquier criptomoneda del top 100 por capitalización de mercado, incluyendo USDT, USDC, BTC, ETH, BNB, SOL y más. Todos los depósitos se convierten automáticamente a USDT al tipo actual, garantizando estabilidad y protección contra la volatilidad. Los retiros siempre se procesan en USDT o USDC. Los clientes VIP pueden elegir un modo sin conversión, donde los depósitos y retiros son posibles en el mismo activo, con ganancias acreditadas en USDT/USDC.'
        },
        q5: {
          question: 'Concepto utilizado',
          answer: 'SyntrixBot sigue principios fundamentales: priorizar la estabilidad, aplicar una gestión estricta de riesgos, usar estrategias con alta fiabilidad estadística, garantizar la automatización completa, centrarse en activos líquidos y aprovechar la experiencia de ex creadores de mercado. Este enfoque ofrece fiabilidad, resultados predecibles y ganancias sostenibles.'
        },
        q6: {
          question: 'Disponibilidad del sistema de referidos',
          answer: 'SyntrixBot ofrece un programa de referidos de tres niveles: 4% de referidos directos, 3% de referidos de segundo nivel y 2% del tercer nivel. Los ingresos pasivos totales pueden alcanzar hasta el 9%. El programa está completamente integrado en la plataforma y se ejecuta automáticamente, permitiendo ganancias adicionales sin esfuerzo extra.'
        }
      }
    },
    supportedAssets: {
      title: 'ACTIVOS',
      subtitle: 'COMPATIBLES',
      description: 'MatrixBot acepta depósitos en cualquier criptomoneda del top 100 por capitalización de mercado, incluyendo USDT, USDC, BTC, ETH, BNB, SOL y más. Todos los depósitos se convierten automáticamente a USDT al tipo actual, garantizando estabilidad y protección contra la volatilidad. Los retiros siempre se procesan en USDT o USDC. Los clientes VIP pueden elegir un modo sin conversión, donde los depósitos y retiros son posibles en el mismo activo, con ganancias acreditadas en USDT/USDC.',
      popularAssets: 'CRIPTOMONEDAS POPULARES',
      andMore: '+ 94 más del top 100',
      top100: 'TOP 100 CRIPTOMONEDAS',
      top100Desc: 'Acepta depósitos en cualquier cripto del top 100 por capitalización de mercado',
      autoConvert: 'AUTO-CONVERSIÓN A USDT',
      autoConvertDesc: 'Todos los depósitos se convierten automáticamente al tipo actual para estabilidad',
      stableWithdrawals: 'RETIROS ESTABLES',
      stableWithdrawalsDesc: 'Retiros procesados solo en USDT o USDC',
      vipMode: 'MODO VIP SIN CONVERSIÓN',
      vipModeDesc: 'Los clientes VIP pueden depositar y retirar en el mismo activo'
    },
    finalCTA: {
      title: '¿Listo para Comenzar a Operar?',
      description: 'Comienza el trading automatizado de cripto hoy y maximiza tus ganancias con estrategias impulsadas por IA',
      button: 'UNIRSE AL BOT'
    },
    footer: {
      tagline: 'Plataforma profesional de trading automatizado de criptomonedas',
      product: 'Producto',
      features: 'Características',
      calculator: 'Calculadora',
      faq: 'Preguntas',
      documentation: 'Documentación',
      company: 'Empresa',
      aboutUs: 'Sobre Nosotros',
      blog: 'Blog',
      careers: 'Carreras',
      contact: 'Contacto',
      socialMedia: 'Redes Sociales',
      copyright: '© 2024 SYNTRIX. Todos los derechos reservados.',
      privacyPolicy: 'Política de Privacidad',
      termsOfUse: 'Términos de Uso'
    }
  },
  fr: {
    header: {
      telegramChannel: 'Canal Telegram',
      whitepaper: 'Whitepaper',
      signIn: 'Se connecter',
      getStarted: 'Commencer'
    },
    hero: {
      title: 'Automatisez Votre',
      subtitle: 'Trading Crypto',
      description: 'Bot de trading professionnel alimenté par IA pour le trading 24/7 de cryptomonnaies sur toutes les principales bourses',
      startTrading: 'Commencer à trader',
      learnMore: 'En savoir plus',
      users: 'Plus de 50 000 utilisateurs',
      support: 'Support 24/7',
      uptime: '99,9% disponibilité'
    },
    whyChoose: {
      title: 'POURQUOI CHOISIR',
      subtitle: 'SYNTRIX?',
      automation: {
        title: 'AUTOMATISATION 24/7',
        description: 'Syntrix Bot fonctionne sans arrêt, analysant les marchés chaque seconde avec des modèles d\'entrée éprouvés pour des profits stables et la sécurité des dépôts.'
      },
      safety: {
        title: 'SÉCURITÉ DES DÉPÔTS',
        description: 'La gestion des risques intégrée protège le capital; même les petites pertes (−1–2%) sont couvertes par le fonds d\'assurance.'
      },
      logic: {
        title: 'LOGIQUE DE TRADING INTELLIGENTE',
        description: 'Alimenté par Smart Money Concepts, ICT, TPO, motifs de chandeliers, graphiques Renko et adaptation de stratégie par IA.'
      },
      liquidity: {
        title: 'HAUTE LIQUIDITÉ',
        description: 'Tradez sur les meilleures bourses avec des carnets d\'ordres profonds garantissant des prix d\'entrée et de sortie optimaux pour une rentabilité maximale.'
      },
      withdrawals: {
        title: 'RETRAITS INSTANTANÉS',
        description: 'Accédez à vos profits à tout moment avec un traitement instantané des retraits directement sur votre portefeuille ou compte d\'échange.'
      },
      transparency: {
        title: 'TRANSPARENCE ET CONTRÔLE',
        description: 'Visibilité complète de toutes les transactions, stratégies et métriques de performance avec analyses détaillées et rapports.'
      }
    },
    tariffPlans: {
      title: 'Calculez Votre',
      subtitle: 'Profit Instantanément',
      depositAmount: 'Montant du dépôt:',
      timePeriod: 'Sélection de la période:',
      tariffPlansTitle: 'Plans Tarifaires',
      selectedPlan: 'Plan Sélectionné:',
      dailyProfit: 'Profit Quotidien:',
      estimatedProfit: 'Profit Estimé:',
      day: 'Jour'
    },
    statistics: {
      title: 'Nos Réalisations',
      description: 'Des chiffres qui témoignent de la fiabilité et de l\'efficacité de notre plateforme',
      activeUsers: 'Utilisateurs actifs',
      tradingVolume: 'Millions de volume de trading',
      successfulTrades: 'Trades réussis',
      support: 'Support sans jours fériés'
    },
    leaderboard: {
      title: 'CLASSEMENT',
      description: 'Les meilleurs performers de l\'écosystème SYNTRIX. Classements en temps réel basés sur les dépôts et la croissance du réseau.',
      topInvestors: 'MEILLEURS INVESTISSEURS',
      topReferrals: 'MEILLEURS PARRAINS',
      rank: 'Rang',
      investorId: 'ID Investisseur',
      deposit: 'Dépôt',
      profit: 'Profit',
      referrerId: 'ID Parrain',
      referrals: 'Parrainages',
      networkValue: 'Valeur du Réseau',
      updatedEvery: 'Mis à jour tous les',
      hours: '24 heures'
    },
    matrixHero: {
      badge: 'Technologie du Futur',
      title: 'Trading Intelligent avec',
      titleBrand: 'SYNTRIX',
      description: 'Système puissant basé sur les concepts Smart Money, ICT et les stratégies de liquidité. Notre bot s\'adapte au marché en temps réel, assurant une efficacité maximale.',
      instantResponse: 'Réponse Instantanée',
      instantResponseDesc: 'Analyse en millisecondes',
      highAccuracy: 'Haute Précision',
      highAccuracyDesc: 'Algorithmes IA',
      startNow: 'Commencer Maintenant',
      aiTitle: 'SYNTRIX AI',
      aiSubtitle: 'Tradez avec l\'Intelligence Artificielle',
      realTime: 'TEMPS RÉEL'
    },
    referral: {
      title: 'SYSTÈME DE PARRAINAGE',
      description: 'Gagnez des profits quotidiens de votre réseau. Trois niveaux de profondeur, transparent et instantané.',
      level1: 'Niveau 1',
      level1Title: 'Vos Amis',
      level1Percent: '4%',
      level2: 'Niveau 2',
      level2Title: 'Amis d\'Amis',
      level2Percent: '3%',
      level3: 'Niveau 3',
      level3Title: 'Troisième Niveau',
      level3Percent: '2%',
      dailyFromDeposits: '/jour de leurs dépôts',
      you: 'VOUS',
      totalEarnings: 'Gains Totaux',
      dailyRate: '/jour',
      passiveIncome: 'Revenu Passif',
      example: 'Exemple:',
      exampleAmount: '$1000 par niveau',
      exampleResult: '$90/jour'
    },
    faq: {
      title: 'Questions Fréquemment Posées',
      subtitle: 'Réponses aux questions les plus populaires sur notre plateforme',
      questions: {
        q1: {
          question: 'Retraits',
          answer: 'SyntrixBot prend en charge les retraits instantanés et illimités en USDT ou USDC sur tous les principaux réseaux (BEP20, ERC20, TRC20, Solana, etc.). Les demandes sont traitées en 1–2 secondes et les fonds arrivent en 1–2 minutes. Les utilisateurs n\'ont qu\'à fournir le portefeuille, le réseau, la devise et le montant - le système s\'occupe du reste.'
        },
        q2: {
          question: 'Mises à jour de stratégie',
          answer: 'SyntrixBot applique uniquement des stratégies éprouvées basées sur SMC, le mappage de liquidité, l\'analyse du carnet d\'ordres et la gestion algorithmique des risques. Les systèmes sont testés sur 5–7 ans, avec un risque limité à 1% par transaction, et un pool de liquidité de réserve assure la protection du capital. L\'équipe teste continuellement de nouveaux actifs, et seules les stratégies avec un taux de réussite confirmé supérieur à 90% sont mises en œuvre.'
        },
        q3: {
          question: 'Trading de week-end',
          answer: 'SyntrixBot fonctionne 24/7 sans interruption. Contrairement aux marchés traditionnels, le marché crypto ne ferme jamais, et les algorithmes du bot sont optimisés pour tirer parti de la volatilité du week-end, permettant au capital de travailler en continu et de générer des résultats cohérents.'
        },
        q4: {
          question: 'Actifs pris en charge',
          answer: 'SyntrixBot accepte les dépôts dans n\'importe quelle cryptomonnaie du top 100 par capitalisation boursière, y compris USDT, USDC, BTC, ETH, BNB, SOL et plus encore. Tous les dépôts sont automatiquement convertis en USDT au taux actuel, garantissant stabilité et protection contre la volatilité. Les retraits sont toujours traités en USDT ou USDC. Les clients VIP peuvent choisir un mode sans conversion, où les dépôts et retraits sont possibles dans le même actif, avec des profits crédités en USDT/USDC.'
        },
        q5: {
          question: 'Concept utilisé',
          answer: 'SyntrixBot suit des principes fondamentaux : prioriser la stabilité, appliquer une gestion stricte des risques, utiliser des stratégies avec une fiabilité statistique élevée, assurer une automatisation complète, se concentrer sur les actifs liquides et tirer parti de l\'expertise d\'anciens teneurs de marché. Cette approche offre fiabilité, résultats prévisibles et profit durable.'
        },
        q6: {
          question: 'Disponibilité du système de parrainage',
          answer: 'SyntrixBot offre un programme de parrainage à trois niveaux : 4% des parrainages directs, 3% des parrainages de deuxième niveau et 2% du troisième niveau. Le revenu passif total peut atteindre jusqu\'à 9%. Le programme est entièrement intégré à la plateforme et fonctionne automatiquement, permettant des gains supplémentaires sans effort supplémentaire.'
        }
      }
    },
    supportedAssets: {
      title: 'ACTIFS',
      subtitle: 'PRIS EN CHARGE',
      description: 'MatrixBot accepte les dépôts dans n\'importe quelle cryptomonnaie du top 100 par capitalisation boursière, y compris USDT, USDC, BTC, ETH, BNB, SOL et plus encore. Tous les dépôts sont automatiquement convertis en USDT au taux actuel, garantissant stabilité et protection contre la volatilité. Les retraits sont toujours traités en USDT ou USDC. Les clients VIP peuvent choisir un mode sans conversion, où les dépôts et retraits sont possibles dans le même actif, avec des profits crédités en USDT/USDC.',
      popularAssets: 'CRYPTOMONNAIES POPULAIRES',
      andMore: '+ 94 autres du top 100',
      top100: 'TOP 100 CRYPTOMONNAIES',
      top100Desc: 'Accepte les dépôts dans n\'importe quelle crypto du top 100 par capitalisation',
      autoConvert: 'AUTO-CONVERSION EN USDT',
      autoConvertDesc: 'Tous les dépôts sont automatiquement convertis au taux actuel pour la stabilité',
      stableWithdrawals: 'RETRAITS STABLES',
      stableWithdrawalsDesc: 'Retraits traités uniquement en USDT ou USDC',
      vipMode: 'MODE VIP SANS CONVERSION',
      vipModeDesc: 'Les clients VIP peuvent déposer et retirer dans le même actif'
    },
    finalCTA: {
      title: 'Prêt à Commencer à Trader?',
      description: 'Commencez le trading crypto automatisé aujourd\'hui et maximisez vos profits avec des stratégies alimentées par IA',
      button: 'REJOINDRE LE BOT'
    },
    footer: {
      tagline: 'Plateforme professionnelle de trading automatisé de cryptomonnaies',
      product: 'Produit',
      features: 'Fonctionnalités',
      calculator: 'Calculateur',
      faq: 'FAQ',
      documentation: 'Documentation',
      company: 'Entreprise',
      aboutUs: 'À Propos',
      blog: 'Blog',
      careers: 'Carrières',
      contact: 'Contact',
      socialMedia: 'Réseaux Sociaux',
      copyright: '© 2024 SYNTRIX. Tous droits réservés.',
      privacyPolicy: 'Politique de Confidentialité',
      termsOfUse: 'Conditions d\'Utilisation'
    }
  },
  pt: {
    header: {
      telegramChannel: 'Canal do Telegram',
      whitepaper: 'Whitepaper',
      signIn: 'Entrar',
      getStarted: 'Começar'
    },
    hero: {
      title: 'Automatize Seu',
      subtitle: 'Trading de Cripto',
      description: 'Bot de trading profissional com IA para negociação 24/7 de criptomoedas em todas as principais exchanges',
      startTrading: 'Começar a negociar',
      learnMore: 'Saiba mais',
      users: 'Mais de 50.000 usuários',
      support: 'Suporte 24/7',
      uptime: '99,9% disponibilidade'
    },
    whyChoose: {
      title: 'POR QUE ESCOLHER',
      subtitle: 'SYNTRIX?',
      automation: {
        title: 'AUTOMAÇÃO 24/7',
        description: 'Syntrix Bot funciona sem parar, analisando mercados a cada segundo com modelos de entrada comprovados para lucros estáveis e segurança de depósito.'
      },
      safety: {
        title: 'SEGURANÇA DE DEPÓSITO',
        description: 'Gestão de risco integrada protege o capital; até pequenas perdas (−1–2%) são cobertas pelo fundo de seguro.'
      },
      logic: {
        title: 'LÓGICA DE TRADING INTELIGENTE',
        description: 'Alimentado por Smart Money Concepts, ICT, TPO, padrões de candlestick, gráficos Renko e adaptação de estratégia com IA.'
      },
      liquidity: {
        title: 'ALTA LIQUIDEZ',
        description: 'Negocie nas melhores exchanges com livros de ordens profundos garantindo preços ótimos de entrada e saída para máxima lucratividade.'
      },
      withdrawals: {
        title: 'SAQUES INSTANTÂNEOS',
        description: 'Acesse seus lucros a qualquer momento com processamento instantâneo de saques diretamente para sua carteira ou conta de exchange.'
      },
      transparency: {
        title: 'TRANSPARÊNCIA E CONTROLE',
        description: 'Visibilidade completa de todas as negociações, estratégias e métricas de desempenho com análises detalhadas e relatórios.'
      }
    },
    tariffPlans: {
      title: 'Calcule Seu',
      subtitle: 'Lucro Instantaneamente',
      depositAmount: 'Valor do depósito:',
      timePeriod: 'Seleção de período de tempo:',
      tariffPlansTitle: 'Planos Tarifários',
      selectedPlan: 'Plano Selecionado:',
      dailyProfit: 'Lucro Diário:',
      estimatedProfit: 'Lucro Estimado:',
      day: 'Dia'
    },
    statistics: {
      title: 'Nossas Conquistas',
      description: 'Números que falam sobre a confiabilidade e eficiência de nossa plataforma',
      activeUsers: 'Usuários ativos',
      tradingVolume: 'Milhões de volume de trading',
      successfulTrades: 'Trades bem-sucedidos',
      support: 'Suporte sem feriados'
    },
    leaderboard: {
      title: 'RANKING',
      description: 'Melhores performers no ecossistema SYNTRIX. Rankings em tempo real baseados em depósitos e crescimento de rede.',
      topInvestors: 'MELHORES INVESTIDORES',
      topReferrals: 'MELHORES INDICAÇÕES',
      rank: 'Posição',
      investorId: 'ID do Investidor',
      deposit: 'Depósito',
      profit: 'Lucro',
      referrerId: 'ID do Indicador',
      referrals: 'Indicações',
      networkValue: 'Valor da Rede',
      updatedEvery: 'Atualizado a cada',
      hours: '24 horas'
    },
    matrixHero: {
      badge: 'Tecnologia do Futuro',
      title: 'Trading Inteligente com',
      titleBrand: 'SYNTRIX',
      description: 'Sistema poderoso baseado em conceitos Smart Money, ICT e estratégias de liquidez. Nosso bot se adapta ao mercado em tempo real, garantindo máxima eficiência.',
      instantResponse: 'Resposta Instantânea',
      instantResponseDesc: 'Análise em milissegundos',
      highAccuracy: 'Alta Precisão',
      highAccuracyDesc: 'Algoritmos de IA',
      startNow: 'Começar Agora',
      aiTitle: 'SYNTRIX AI',
      aiSubtitle: 'Negocie com Inteligência Artificial',
      realTime: 'TEMPO REAL'
    },
    referral: {
      title: 'SISTEMA DE INDICAÇÃO',
      description: 'Ganhe lucros diários da sua rede. Três níveis de profundidade, transparente e instantâneo.',
      level1: 'Nível 1',
      level1Title: 'Seus Amigos',
      level1Percent: '4%',
      level2: 'Nível 2',
      level2Title: 'Amigos de Amigos',
      level2Percent: '3%',
      level3: 'Nível 3',
      level3Title: 'Terceiro Nível',
      level3Percent: '2%',
      dailyFromDeposits: '/dia de seus depósitos',
      you: 'VOCÊ',
      totalEarnings: 'Ganhos Totais',
      dailyRate: '/dia',
      passiveIncome: 'Renda Passiva',
      example: 'Exemplo:',
      exampleAmount: '$1000 por nível',
      exampleResult: '$90/dia'
    },
    faq: {
      title: 'Perguntas Frequentes',
      subtitle: 'Respostas às perguntas mais populares sobre nossa plataforma',
      questions: {
        q1: {
          question: 'Saques',
          answer: 'SyntrixBot suporta saques instantâneos e ilimitados em USDT ou USDC em todas as principais redes (BEP20, ERC20, TRC20, Solana, etc.). As solicitações são processadas em 1–2 segundos e os fundos chegam em 1–2 minutos. Os usuários precisam apenas fornecer a carteira, rede, moeda e valor — o sistema cuida do resto.'
        },
        q2: {
          question: 'Atualizações de estratégia',
          answer: 'SyntrixBot aplica apenas estratégias comprovadas baseadas em SMC, mapeamento de liquidez, análise de livro de ordens e gestão algorítmica de risco. Os sistemas são testados por 5–7 anos, com risco limitado a 1% por negociação, e um pool de liquidez de reserva garante a proteção do capital. A equipe testa continuamente novos ativos, e apenas estratégias com taxa de sucesso confirmada acima de 90% são implementadas.'
        },
        q3: {
          question: 'Negociação de fim de semana',
          answer: 'SyntrixBot opera 24/7 sem interrupções. Ao contrário dos mercados tradicionais, o mercado cripto nunca fecha, e os algoritmos do bot são otimizados para aproveitar a volatilidade do fim de semana, permitindo que o capital trabalhe continuamente e gere resultados consistentes.'
        },
        q4: {
          question: 'Ativos suportados',
          answer: 'SyntrixBot aceita depósitos em qualquer criptomoeda do top 100 por capitalização de mercado, incluindo USDT, USDC, BTC, ETH, BNB, SOL e mais. Todos os depósitos são automaticamente convertidos para USDT à taxa atual, garantindo estabilidade e proteção contra volatilidade. Os saques são sempre processados em USDT ou USDC. Clientes VIP podem escolher um modo sem conversão, onde depósitos e saques são possíveis no mesmo ativo, com lucros creditados em USDT/USDC.'
        },
        q5: {
          question: 'Conceito usado',
          answer: 'SyntrixBot segue princípios fundamentais: priorizar estabilidade, aplicar gestão rigorosa de risco, usar estratégias com alta confiabilidade estatística, garantir automação completa, focar em ativos líquidos e aproveitar a experiência de ex-formadores de mercado. Esta abordagem oferece confiabilidade, resultados previsíveis e lucro sustentável.'
        },
        q6: {
          question: 'Disponibilidade do sistema de indicação',
          answer: 'SyntrixBot oferece um programa de indicação de três níveis: 4% de indicações diretas, 3% de indicações de segundo nível e 2% do terceiro nível. A renda passiva total pode chegar até 9%. O programa está totalmente integrado à plataforma e funciona automaticamente, permitindo ganhos adicionais sem esforço extra.'
        }
      }
    },
    supportedAssets: {
      title: 'ATIVOS',
      subtitle: 'SUPORTADOS',
      description: 'MatrixBot aceita depósitos em qualquer criptomoeda do top 100 por capitalização de mercado, incluindo USDT, USDC, BTC, ETH, BNB, SOL e mais. Todos os depósitos são automaticamente convertidos para USDT à taxa atual, garantindo estabilidade e proteção contra volatilidade. Os saques são sempre processados em USDT ou USDC. Clientes VIP podem escolher um modo sem conversão, onde depósitos e saques são possíveis no mesmo ativo, com lucros creditados em USDT/USDC.',
      popularAssets: 'CRIPTOMOEDAS POPULARES',
      andMore: '+ 94 mais do top 100',
      top100: 'TOP 100 CRIPTOMOEDAS',
      top100Desc: 'Aceita depósitos em qualquer cripto do top 100 por capitalização de mercado',
      autoConvert: 'AUTO-CONVERSÃO PARA USDT',
      autoConvertDesc: 'Todos os depósitos são automaticamente convertidos à taxa atual para estabilidade',
      stableWithdrawals: 'SAQUES ESTÁVEIS',
      stableWithdrawalsDesc: 'Saques processados apenas em USDT ou USDC',
      vipMode: 'MODO VIP SEM CONVERSÃO',
      vipModeDesc: 'Clientes VIP podem depositar e sacar no mesmo ativo'
    },
    finalCTA: {
      title: 'Pronto para Começar a Negociar?',
      description: 'Comece o trading automatizado de cripto hoje e maximize seus lucros com estratégias alimentadas por IA',
      button: 'JUNTAR-SE AO BOT'
    },
    footer: {
      tagline: 'Plataforma profissional de trading automatizado de criptomoedas',
      product: 'Produto',
      features: 'Recursos',
      calculator: 'Calculadora',
      faq: 'Perguntas',
      documentation: 'Documentação',
      company: 'Empresa',
      aboutUs: 'Sobre Nós',
      blog: 'Blog',
      careers: 'Carreiras',
      contact: 'Contato',
      socialMedia: 'Redes Sociais',
      copyright: '© 2024 SYNTRIX. Todos os direitos reservados.',
      privacyPolicy: 'Política de Privacidade',
      termsOfUse: 'Termos de Uso'
    }
  },
  nl: {
    header: {
      telegramChannel: 'Telegram-kanaal',
      whitepaper: 'Whitepaper',
      signIn: 'Inloggen',
      getStarted: 'Beginnen'
    },
    hero: {
      title: 'Automatiseer Uw',
      subtitle: 'Crypto Trading',
      description: 'Professionele AI-aangedreven trading bot voor 24/7 cryptocurrency handel op alle grote exchanges',
      startTrading: 'Start met handelen',
      learnMore: 'Meer informatie',
      users: 'Meer dan 50.000 gebruikers',
      support: '24/7 ondersteuning',
      uptime: '99,9% uptime'
    },
    whyChoose: {
      title: 'WAAROM KIEZEN VOOR',
      subtitle: 'SYNTRIX?',
      automation: {
        title: 'AUTOMATISERING 24/7',
        description: 'Syntrix Bot draait non-stop en analyseert markten elke seconde met bewezen instapmodellen voor stabiele winsten en depositoveiligheid.'
      },
      safety: {
        title: 'DEPOSITOVEILIGHEID',
        description: 'Ingebouwd risicobeheer beschermt kapitaal; zelfs kleine verliezen (−1–2%) worden gedekt uit het verzekeringsfonds.'
      },
      logic: {
        title: 'SLIMME HANDELSLOGICA',
        description: 'Aangedreven door Smart Money Concepts, ICT, TPO, candlestick patronen, Renko charts en AI-gestuurde strategie aanpassing.'
      },
      liquidity: {
        title: 'HOGE LIQUIDITEIT',
        description: 'Handel op top exchanges met diepe orderboeken die optimale in- en uitstapprijzen garanderen voor maximale winstgevendheid.'
      },
      withdrawals: {
        title: 'DIRECTE OPNAMES',
        description: 'Toegang tot uw winsten op elk moment met directe opnameverwerking rechtstreeks naar uw wallet of exchange account.'
      },
      transparency: {
        title: 'TRANSPARANTIE & CONTROLE',
        description: 'Volledige zichtbaarheid van alle trades, strategieën en prestatiemetrics met gedetailleerde analyses en rapportage.'
      }
    },
    tariffPlans: {
      title: 'Bereken Uw',
      subtitle: 'Winst Direct',
      depositAmount: 'Depositobedrag:',
      timePeriod: 'Tijdperiodeselectie:',
      tariffPlansTitle: 'Tariefplannen',
      selectedPlan: 'Geselecteerd Plan:',
      dailyProfit: 'Dagelijkse Winst:',
      estimatedProfit: 'Geschatte Winst:',
      day: 'Dag'
    },
    statistics: {
      title: 'Onze Prestaties',
      description: 'Cijfers die spreken over de betrouwbaarheid en efficiëntie van ons platform',
      activeUsers: 'Actieve gebruikers',
      tradingVolume: 'Miljoen handelsvolume',
      successfulTrades: 'Succesvolle trades',
      support: 'Support zonder feestdagen'
    },
    leaderboard: {
      title: 'RANGLIJST',
      description: 'Top performers in het SYNTRIX ecosysteem. Real-time rankings gebaseerd op deposito\'s en netwerkgroei.',
      topInvestors: 'TOP INVESTEERDERS',
      topReferrals: 'TOP VERWIJZERS',
      rank: 'Rang',
      investorId: 'Investeerder ID',
      deposit: 'Deposito',
      profit: 'Winst',
      referrerId: 'Verwijzer ID',
      referrals: 'Verwijzingen',
      networkValue: 'Netwerkwaarde',
      updatedEvery: 'Bijgewerkt elke',
      hours: '24 uur'
    },
    matrixHero: {
      badge: 'Toekomsttechnologie',
      title: 'Intelligent Handelen met',
      titleBrand: 'SYNTRIX',
      description: 'Krachtig systeem gebaseerd op Smart Money concepten, ICT en liquiditeitsstrategieën. Onze bot past zich in real-time aan de markt aan en zorgt voor maximale efficiëntie.',
      instantResponse: 'Directe Respons',
      instantResponseDesc: 'Analyse in milliseconden',
      highAccuracy: 'Hoge Nauwkeurigheid',
      highAccuracyDesc: 'AI-algoritmen',
      startNow: 'Nu Beginnen',
      aiTitle: 'SYNTRIX AI',
      aiSubtitle: 'Handel met Kunstmatige Intelligentie',
      realTime: 'REAL-TIME'
    },
    referral: {
      title: 'VERWIJZINGSSYSTEEM',
      description: 'Verdien dagelijkse winsten van uw netwerk. Drie niveaus diep, transparant en direct.',
      level1: 'Niveau 1',
      level1Title: 'Uw Vrienden',
      level1Percent: '4%',
      level2: 'Niveau 2',
      level2Title: 'Vrienden van Vrienden',
      level2Percent: '3%',
      level3: 'Niveau 3',
      level3Title: 'Derde Niveau',
      level3Percent: '2%',
      dailyFromDeposits: '/dag van hun deposito\'s',
      you: 'JIJ',
      totalEarnings: 'Totale Inkomsten',
      dailyRate: '/dag',
      passiveIncome: 'Passief Inkomen',
      example: 'Voorbeeld:',
      exampleAmount: '$1000 per niveau',
      exampleResult: '$90/dag'
    },
    faq: {
      title: 'Veelgestelde Vragen',
      subtitle: 'Antwoorden op de meest populaire vragen over ons platform',
      questions: {
        q1: {
          question: 'Opnames',
          answer: 'SyntrixBot ondersteunt directe en onbeperkte opnames in USDT of USDC op alle belangrijke netwerken (BEP20, ERC20, TRC20, Solana, etc.). Aanvragen worden binnen 1–2 seconden verwerkt en fondsen arriveren in 1–2 minuten. Gebruikers hoeven alleen de wallet, het netwerk, de valuta en het bedrag op te geven — het systeem regelt de rest.'
        },
        q2: {
          question: 'Strategie-updates',
          answer: 'SyntrixBot past alleen bewezen strategieën toe op basis van SMC, liquiditeitskartering, orderboekenanalyse en algoritmisch risicobeheer. Systemen worden 5–7 jaar getest, met risico beperkt tot 1% per transactie, en een reserve liquiditeitspool zorgt voor kapitaalbescherming. Het team test voortdurend nieuwe activa, en alleen strategieën met een bevestigd winstpercentage boven 90% worden geïmplementeerd.'
        },
        q3: {
          question: 'Weekendhandel',
          answer: 'SyntrixBot werkt 24/7 zonder onderbrekingen. In tegenstelling tot traditionele markten sluit de cryptomarkt nooit, en de algoritmen van de bot zijn geoptimaliseerd om weekendvolatiliteit te benutten, waardoor kapitaal continu kan werken en consistente resultaten kan genereren.'
        },
        q4: {
          question: 'Ondersteunde activa',
          answer: 'SyntrixBot accepteert deposito\'s in elke cryptocurrency uit de top 100 per marktkapitalisatie, inclusief USDT, USDC, BTC, ETH, BNB, SOL en meer. Alle deposito\'s worden automatisch omgezet naar USDT tegen het huidige tarief, wat stabiliteit en bescherming tegen volatiliteit garandeert. Opnames worden altijd verwerkt in USDT of USDC. VIP-klanten kunnen een niet-conversie-modus kiezen, waarbij deposito\'s en opnames mogelijk zijn in hetzelfde actief, met winsten gecrediteerd in USDT/USDC.'
        },
        q5: {
          question: 'Gebruikt concept',
          answer: 'SyntrixBot volgt kernprincipes: prioriteit geven aan stabiliteit, strikt risicobeheer toepassen, strategieën gebruiken met hoge statistische betrouwbaarheid, volledige automatisering garanderen, focussen op liquide activa en profiteren van de expertise van voormalige marktmakers. Deze aanpak levert betrouwbaarheid, voorspelbare resultaten en duurzame winst.'
        },
        q6: {
          question: 'Beschikbaarheid van het verwijzingssysteem',
          answer: 'SyntrixBot biedt een verwijzingsprogramma met drie niveaus: 4% van directe verwijzingen, 3% van verwijzingen op het tweede niveau en 2% van het derde niveau. Het totale passieve inkomen kan oplopen tot 9%. Het programma is volledig geïntegreerd in het platform en werkt automatisch, waardoor extra inkomsten mogelijk zijn zonder extra inspanning.'
        }
      }
    },
    supportedAssets: {
      title: 'ONDERSTEUNDE',
      subtitle: 'ACTIVA',
      description: 'MatrixBot accepteert deposito\'s in elke cryptocurrency uit de top 100 per marktkapitalisatie, inclusief USDT, USDC, BTC, ETH, BNB, SOL en meer. Alle deposito\'s worden automatisch omgezet naar USDT tegen het huidige tarief, wat stabiliteit en bescherming tegen volatiliteit garandeert. Opnames worden altijd verwerkt in USDT of USDC. VIP-klanten kunnen een niet-conversie-modus kiezen, waarbij deposito\'s en opnames mogelijk zijn in hetzelfde actief, met winsten gecrediteerd in USDT/USDC.',
      popularAssets: 'POPULAIRE CRYPTOCURRENCIES',
      andMore: '+ 94 meer uit top 100',
      top100: 'TOP 100 CRYPTOCURRENCIES',
      top100Desc: 'Accepteer deposito\'s in elke crypto uit de top 100 per marktkapitalisatie',
      autoConvert: 'AUTO-CONVERSIE NAAR USDT',
      autoConvertDesc: 'Alle deposito\'s worden automatisch omgezet tegen het huidige tarief voor stabiliteit',
      stableWithdrawals: 'STABIELE OPNAMES',
      stableWithdrawalsDesc: 'Opnames alleen verwerkt in USDT of USDC',
      vipMode: 'VIP NIET-CONVERSIE-MODUS',
      vipModeDesc: 'VIP-klanten kunnen in hetzelfde actief storten en opnemen'
    },
    finalCTA: {
      title: 'Klaar om te Beginnen met Handelen?',
      description: 'Start vandaag nog met geautomatiseerde crypto trading en maximaliseer uw winsten met AI-aangedreven strategieën',
      button: 'SLUIT AAN BIJ BOT'
    },
    footer: {
      tagline: 'Professioneel geautomatiseerd cryptocurrency handelsplatform',
      product: 'Product',
      features: 'Functies',
      calculator: 'Calculator',
      faq: 'Veelgestelde vragen',
      documentation: 'Documentatie',
      company: 'Bedrijf',
      aboutUs: 'Over Ons',
      blog: 'Blog',
      careers: 'Carrières',
      contact: 'Contact',
      socialMedia: 'Sociale Media',
      copyright: '© 2024 SYNTRIX. Alle rechten voorbehouden.',
      privacyPolicy: 'Privacybeleid',
      termsOfUse: 'Gebruiksvoorwaarden'
    }
  }
}
