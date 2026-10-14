import { db } from './db';
import { Transaction, DecisionRecord } from './types';
import { formatINR, calculateFinancialMetrics } from './financialAnalysis';

export type VoiceLanguageMode = 'en' | 'bilingual' | 'hi';

export interface VoiceAssistantResponse {
  query: string;
  language: VoiceLanguageMode;
  spokenText: string;
  spokenTextHindi?: string;
  spokenTextEnglish?: string;
  visualData?: {
    type: 'summary' | 'transaction_list' | 'decision' | 'educational' | 'metric';
    title: string;
    items?: Array<{ label: string; value: string; badge?: string }>;
    rawEntity?: any;
  };
  suggestedQuestions: string[];
}

/**
 * Checks if the text contains Devanagari characters (Hindi script)
 */
export function containsDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Checks if the text contains common Hinglish (Romanized Hindi) words
 */
export function containsHinglishKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  const hinglishTerms = [
    'kya', 'kaise', 'kitna', 'kitne', 'kitni', 'hai', 'hain',
    'batao', 'bataiye', 'samjhao', 'samjhaiye', 'aaj', 'paisa',
    'rokad', 'rokda', 'sabse', 'zyada', 'jyada', 'adhik', 'khatra',
    'gadbad', 'kharcha', 'kharch', 'kisko', 'kaunse', 'kaunsa',
    'pramaan', 'saboot', 'namaste', 'shukriya', 'dhanyawad',
    'tankhwah', 'vetan', 'karo', 'kariye', 'dikhao', 'dikhaiye'
  ];

  return hinglishTerms.some((term) => new RegExp(`\\b${term}\\b`, 'i').test(lower));
}

/**
 * Detects whether the query should be treated as Bilingual (Hindi/Hinglish) or English
 */
export function detectLanguageMode(query: string, requestedLanguage?: VoiceLanguageMode): VoiceLanguageMode {
  if (requestedLanguage === 'bilingual' || requestedLanguage === 'hi') {
    return requestedLanguage;
  }
  if (requestedLanguage === 'en') {
    return 'en';
  }

  // Auto-detect based on query content
  if (containsDevanagari(query) || containsHinglishKeywords(query)) {
    return 'bilingual';
  }

  return 'en';
}

export function handleVoiceQuery(query: string, requestedLanguage?: VoiceLanguageMode): VoiceAssistantResponse {
  const normalized = query.trim().toLowerCase();
  const language = detectLanguageMode(query, requestedLanguage);
  const isBilingual = language === 'bilingual' || language === 'hi';

  // Load latest data from SQLite
  const txRows = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all() as any[];
  const transactions: Transaction[] = txRows.map((r) => ({
    ...r,
    risk_factors: JSON.parse(r.risk_factors || '[]'),
  }));

  const decisionRows = db.prepare('SELECT * FROM decisions ORDER BY created_at DESC').all() as any[];
  const decisions: DecisionRecord[] = decisionRows.map((r) => ({
    ...r,
    evidence: JSON.parse(r.evidence || '[]'),
  }));

  const metrics = calculateFinancialMetrics(transactions);

  // 1. QUERY: Greeting & Identity
  if (
    normalized.includes('namaste') ||
    normalized.includes('नमस्ते') ||
    normalized.includes('hello') ||
    normalized.includes('kaise ho') ||
    normalized.includes('who are you') ||
    normalized.includes('aap kaun ho') ||
    normalized.includes('tum kaun ho')
  ) {
    const spokenEn =
      "Hello! I'm FINOVA's financial intelligence voice assistant. I analyze transactions, explain risk anomalies, and verify cryptographic SHA-256 decision records directly grounded in your SQLite ledger. How can I assist your compliance review today?";
    const spokenBilingual =
      "Namaste! Main FINOVA ka AI Financial Voice Assistant hoon. Main aapke ledger ke transactions ka cash flow, high risk anomalies aur SHA-256 blockchain verification reports bilingual Hindi aur English dono me bata sakta hoon. Aap aaj kya dekhna chahenge?";
    const spokenHindi =
      "नमस्ते! मैं फिनोवा का एआई वित्तीय वॉयस असिस्टेंट हूँ। मैं आपके बहीखाते के लेन-देन, कैश फ्लो, जोखिम विसंगतियों और ब्लॉकचेन सत्यापन की पूरी जानकारी हिंदी और अंग्रेज़ी दोनों में दे सकता हूँ। आप क्या जानना चाहेंगे?";

    return {
      query,
      language,
      spokenText: isBilingual ? spokenBilingual : spokenEn,
      spokenTextHindi: spokenHindi,
      spokenTextEnglish: spokenEn,
      visualData: {
        type: 'educational',
        title: isBilingual ? 'FINOVA Voice Intelligence (द्विभाषी वॉयस असिस्टेंट)' : 'FINOVA Voice Intelligence Platform',
        items: [
          { label: isBilingual ? 'Bilingual Support (भाषा)' : 'Supported Modes', value: 'English + Hindi / Hinglish' },
          { label: isBilingual ? 'Ledger Status (बहीखाता स्थिति)' : 'Ledger Status', value: `${transactions.length} Transactions Loaded`, badge: 'Active' },
          { label: isBilingual ? 'Verification (सत्यापन)' : 'Blockchain Anchors', value: `${decisions.length} Immutable Proofs` },
          { label: isBilingual ? 'Voice Personas (आवाज़)' : 'Voice Personas', value: 'Swara & Madhur (Hindi/Eng) + ElevenLabs' },
        ],
      },
      suggestedQuestions: isBilingual
        ? [
            'आज का नेट कैश फ्लो कितना है?',
            'कौनसे transactions में high risk है?',
            'Blockchain verification hash कैसे काम करता है?',
            'Salary का कुल खर्च बताओ',
          ]
        : [
            'Give me a summary of net cash flow.',
            'Which transactions need attention?',
            'Explain the highest-risk transaction.',
            'What does the verification hash prove?',
          ],
    };
  }

  // 2. QUERY: Net Cash Flow / Rokad / Inflow / Outflow
  if (
    normalized.includes('cash flow') ||
    normalized.includes('net flow') ||
    normalized.includes('inflow') ||
    normalized.includes('outflow') ||
    normalized.includes('rokad') ||
    normalized.includes('rokda') ||
    normalized.includes('paisa') ||
    normalized.includes('कैश फ्लो') ||
    normalized.includes('रोकड़') ||
    normalized.includes('आवक') ||
    normalized.includes('बचत')
  ) {
    const isPositive = metrics.netCashFlow >= 0;
    const spokenEn = `The current net cash flow is ${isPositive ? 'positive' : 'negative'} at ${formatINR(
      metrics.netCashFlow
    )}. Total credits stand at ${formatINR(metrics.totalCredits)}, while debits total ${formatINR(metrics.totalDebits)} across ${
      transactions.length
    } recorded transactions.`;

    const spokenBilingual = `Namaste! Aapka net cash flow ${isPositive ? 'positive' : 'negative'} hai, kul ${formatINR(
      metrics.netCashFlow
    )}. Total credits ${formatINR(metrics.totalCredits)} hain aur total debits ${formatINR(metrics.totalDebits)} hain, jo ledger ke ${
      transactions.length
    } recorded transactions me darj hain.`;

    const spokenHindi = `नमस्ते! आपका नेट कैश फ्लो ${isPositive ? 'धनात्मक' : 'ऋणात्मक'} है, कुल ${formatINR(
      metrics.netCashFlow
    )}। कुल क्रेडिट ${formatINR(metrics.totalCredits)} और कुल डेबिट ${formatINR(metrics.totalDebits)} हैं, जो बहीखाते के ${
      transactions.length
    } लेन-देन में दर्ज हैं।`;

    return {
      query,
      language,
      spokenText: isBilingual ? spokenBilingual : spokenEn,
      spokenTextHindi: spokenHindi,
      spokenTextEnglish: spokenEn,
      visualData: {
        type: 'metric',
        title: isBilingual ? 'Net Cash Flow Summary (नेट कैश फ्लो विवरण)' : 'Net Cash Flow Summary',
        items: [
          { label: isBilingual ? 'Net Cash Flow (शुद्ध रोकड़)' : 'Net Cash Flow', value: formatINR(metrics.netCashFlow), badge: isPositive ? 'Positive (सरप्लस)' : 'Deficit (घाटा)' },
          { label: isBilingual ? 'Total Inflow (कुल आवक / क्रेडिट)' : 'Total Inflow (Credits)', value: formatINR(metrics.totalCredits) },
          { label: isBilingual ? 'Total Outflow (कुल निकासी / डेबिट)' : 'Total Outflow (Debits)', value: formatINR(metrics.totalDebits) },
          { label: isBilingual ? 'Average Transaction (औसत लेन-देन)' : 'Average Transaction', value: formatINR(metrics.averageAmount) },
        ],
      },
      suggestedQuestions: isBilingual
        ? [
            'कौनसे transactions में high risk है?',
            'सबसे बड़ा transaction समझाइए',
            'Blockchain verification hash कैसे काम करता है?',
          ]
        : [
            'Which transactions need attention?',
            'Explain the highest-risk transaction.',
            'Summarize today’s financial activity.',
          ],
    };
  }

  // 3. QUERY: Explain highest-risk transaction / Sabse bada risk
  if (
    normalized.includes('highest') ||
    normalized.includes('highest-risk') ||
    normalized.includes('highest risk') ||
    normalized.includes('sabse bada') ||
    normalized.includes('sabse zyada') ||
    normalized.includes('sabse jyada') ||
    normalized.includes('sabse adhik') ||
    normalized.includes('सबसे बड़ा') ||
    normalized.includes('सबसे ज्यादा') ||
    normalized.includes('सबसे अधिक')
  ) {
    const sorted = [...transactions].sort((a, b) => b.risk_score - a.risk_score);
    const top = sorted[0];

    if (!top) {
      const spokenEn = 'There are no transactions in the ledger to evaluate.';
      const spokenBilingual = 'Ledger me evaluate karne ke liye filhal koi transaction moujood nahi hai.';
      const spokenHindi = 'बहीखाते में मूल्यांकन करने के लिए कोई लेन-देन उपलब्ध नहीं है।';
      return {
        query,
        language,
        spokenText: isBilingual ? spokenBilingual : spokenEn,
        spokenTextHindi: spokenHindi,
        spokenTextEnglish: spokenEn,
        suggestedQuestions: isBilingual ? ['डेमो डेटा लोड करें', 'आज का सारांश बताओ'] : ['Load demo data', 'Summarize today’s financial activity.'],
      };
    }

    const spokenEn = `The highest-risk transaction is reference ${top.id} of ${formatINR(
      top.amount
    )} with counterparty ${top.counterparty}. It received a risk score of ${top.risk_score} out of 100. Primary factors include ${top.risk_factors.join(
      ', '
    ) || 'elevated value above threshold'}. The recommended action is ${
      top.risk_score >= 80 ? 'an immediate executive hold' : 'secondary documentation review'
    }.`;

    const spokenBilingual = `Sabse zyada risk wala transaction reference ${top.id} hai, jo ${top.counterparty} ke saath ${formatINR(
      top.amount
    )} ka hai. Iska risk score 100 me se ${top.risk_score} hai. Iske mukhya risk factors hain: ${top.risk_factors.join(
      ', '
    ) || 'threshold se zyada value'}. Hamari sifarish hai ki is transaction par ${
      top.risk_score >= 80 ? 'tatkal executive hold lagaya jaye' : 'secondary documentation review kiya jaye'
    }.`;

    const spokenHindi = `सबसे अधिक जोखिम वाला लेन-देन संदर्भ ${top.id} है, जो ${top.counterparty} के साथ ${formatINR(
      top.amount
    )} का है। इसका जोखिम स्कोर 100 में से ${top.risk_score} है। मुख्य कारण: ${top.risk_factors.join(
      ', '
    ) || 'सीमा से अधिक मूल्य'}। इस पर ${
      top.risk_score >= 80 ? 'तत्काल रोक लगाने' : 'दस्तावेज़ पुनरीक्षण'
    } की सिफारिश की जाती है।`;

    return {
      query,
      language,
      spokenText: isBilingual ? spokenBilingual : spokenEn,
      spokenTextHindi: spokenHindi,
      spokenTextEnglish: spokenEn,
      visualData: {
        type: 'decision',
        title: isBilingual ? `Deep-Dive: ${top.id} (गहन जोखिम विश्लेषण)` : `Deep-Dive: ${top.id}`,
        items: [
          { label: isBilingual ? 'Counterparty (संबंधित पक्ष)' : 'Counterparty', value: top.counterparty },
          { label: isBilingual ? 'Amount (राशि)' : 'Amount', value: formatINR(top.amount) },
          { label: isBilingual ? 'Risk Score (जोखिम स्कोर)' : 'Risk Score', value: `${top.risk_score} / 100`, badge: top.risk_level.toUpperCase() },
          { label: isBilingual ? 'Category (श्रेणी)' : 'Category', value: top.category },
          { label: isBilingual ? 'Primary Trigger (मुख्य कारण)' : 'Primary Trigger', value: top.risk_factors[0] || 'High value anomaly' },
        ],
      },
      suggestedQuestions: isBilingual
        ? [
            'कौनसे transactions में high risk है?',
            'Blockchain verification hash कैसे काम करता है?',
            'आज का नेट कैश फ्लो सारांश बताओ',
          ]
        : [
            'Which transactions need attention?',
            'What does the verification hash prove?',
            'Summarize today’s financial activity.',
          ],
    };
  }

  // 4. QUERY: Attention / High Risk / Flagged transactions
  if (
    normalized.includes('attention') ||
    normalized.includes('flagged') ||
    normalized.includes('high risk') ||
    normalized.includes('high-risk') ||
    normalized.includes('problem') ||
    normalized.includes('khatra') ||
    normalized.includes('gadbad') ||
    normalized.includes('anomal') ||
    normalized.includes('जोखिम') ||
    normalized.includes('खतरा') ||
    normalized.includes('गड़बड़') ||
    normalized.includes('सचेत')
  ) {
    const flagged = transactions.filter((t) => t.risk_level === 'high' || t.risk_level === 'critical');
    if (flagged.length === 0) {
      const spokenEn = 'All transactions currently meet normal compliance parameters. No high or critical risk items require immediate intervention.';
      const spokenBilingual = 'Sabhi transactions normal compliance parameters ke anuroop hain. Koi bhi high ya critical risk transaction tatkal karyawahi ke liye pending nahi hai.';
      const spokenHindi = 'सभी लेन-देन वर्तमान में सामान्य अनुपालन मानकों के अनुरूप हैं। किसी भी उच्च या गंभीर जोखिम वाले लेन-देन पर तत्काल कार्रवाई की आवश्यकता नहीं है।';

      return {
        query,
        language,
        spokenText: isBilingual ? spokenBilingual : spokenEn,
        spokenTextHindi: spokenHindi,
        spokenTextEnglish: spokenEn,
        visualData: {
          type: 'summary',
          title: isBilingual ? 'Risk Posture: Normal (जोखिम स्थिति: सामान्य)' : 'Risk Posture: Normal',
          items: [{ label: isBilingual ? 'High-Risk Count (उच्च जोखिम संख्या)' : 'High-Risk Count', value: '0' }],
        },
        suggestedQuestions: isBilingual
          ? ['आज का नेट कैश फ्लो कितना है?', 'Blockchain verification hash क्या साबित करता है?']
          : ['Summarize today’s financial activity.', 'What does the verification hash prove?'],
      };
    }

    const first = flagged[0];
    const spokenEn = `There are ${flagged.length} transactions requiring compliance attention. The most urgent is transaction ${first.id} to ${first.counterparty} for ${formatINR(first.amount)}, which holds a risk score of ${first.risk_score} out of 100 categorized as ${first.risk_level}.`;

    const spokenBilingual = `Aapke ledger me kul ${flagged.length} transactions compliance attention mang rahe hain. Sabse urgent transaction ${first.id} hai jo ${first.counterparty} ko ${formatINR(first.amount)} ka bheja gaya tha, jiska risk score 100 me se ${first.risk_score} hai aur yeh ${first.risk_level} category me hai.`;

    const spokenHindi = `आपके बहीखाते में कुल ${flagged.length} लेन-देन अनुपालन ध्यान की मांग कर रहे हैं। सबसे संवेदनशील लेन-देन ${first.id} है जो ${first.counterparty} को ${formatINR(first.amount)} का है, जिसका जोखिम स्कोर 100 में से ${first.risk_score} है।`;

    return {
      query,
      language,
      spokenText: isBilingual ? spokenBilingual : spokenEn,
      spokenTextHindi: spokenHindi,
      spokenTextEnglish: spokenEn,
      visualData: {
        type: 'transaction_list',
        title: isBilingual ? 'High-Risk Items Requiring Attention (ध्यान देने योग्य संवेदनशील लेन-देन)' : 'High-Risk Items Requiring Attention',
        items: flagged.map((t) => ({
          label: `${t.id} - ${t.counterparty}`,
          value: formatINR(t.amount),
          badge: `${t.risk_level.toUpperCase()} (${t.risk_score})`,
        })),
      },
      suggestedQuestions: isBilingual
        ? [
            'सबसे ज्यादा risk वाला transaction समझाइए',
            'Blockchain hash verification क्या साबित करता है?',
            'आज का नेट कैश फ्लो सारांश बताओ',
          ]
        : [
            'Explain the highest-risk transaction.',
            'What does the verification hash prove?',
            'Give me a summary of net cash flow.',
          ],
    };
  }

  // 5. QUERY: Blockchain Verification / SHA-256 Hash Explanation / Saboot
  if (
    normalized.includes('hash') ||
    normalized.includes('blockchain') ||
    normalized.includes('prove') ||
    normalized.includes('proof') ||
    normalized.includes('verification') ||
    normalized.includes('verify') ||
    normalized.includes('pramaan') ||
    normalized.includes('saboot') ||
    normalized.includes('tamper') ||
    normalized.includes('ब्लॉकचेन') ||
    normalized.includes('हैश') ||
    normalized.includes('सत्यापन') ||
    normalized.includes('सबूत')
  ) {
    const verifiedCount = decisions.filter(
      (d) => d.verification_status === 'locally_verified' || d.verification_status === 'onchain_verified'
    ).length;

    const spokenEn = `In this platform, the SHA-256 cryptographic hash creates an immutable digital fingerprint of canonical decision parameters, including risk score, evidence, and timestamps. If any party attempts to alter the decision data after creation, the recalculated hash fails to match, proving tampering. Currently, ${verifiedCount} decision records are cryptographically verified in your local ledger.`;

    const spokenBilingual = `FINOVA platform me, SHA-256 cryptographic hash har decision ka ek immutable digital fingerprint banata hai — jisme risk score, evidence aur timestamps shamil hain. Agar koi bhi data me badlaav karne ki koshish karega, toh recalculated hash match nahi hoga, aur tampering saabit ho jayegi. Vartaman me aapke local ledger me ${verifiedCount} decision records poori tarah cryptographically verified hain.`;

    const spokenHindi = `फिनोवा में, SHA-256 क्रिप्टोग्राफ़िक हैश प्रत्येक निर्णय का एक अपरिवर्तनीय डिजिटल फ़िंगरप्रिंट बनाता है। यदि कोई भी डेटा में अनधिकृत बदलाव का प्रयास करता है, तो पुनर्गणित हैश मेल नहीं खाएगा और छेड़छाड़ साबित हो जाएगी। वर्तमान में आपके बहीखाते में ${verifiedCount} निर्णय पूरी तरह सत्यापित हैं।`;

    return {
      query,
      language,
      spokenText: isBilingual ? spokenBilingual : spokenEn,
      spokenTextHindi: spokenHindi,
      spokenTextEnglish: spokenEn,
      visualData: {
        type: 'educational',
        title: isBilingual ? 'Cryptographic Hash Architecture (ब्लॉकचेन हैश सत्यापन वास्तुकला)' : 'Cryptographic Hash Verification Architecture',
        items: [
          { label: isBilingual ? 'Algorithm (एल्गोरिदम)' : 'Algorithm', value: 'Canonical SHA-256 (Deterministic JSON)' },
          { label: isBilingual ? 'Active Verified Records (सत्यापित रिकॉर्ड्स)' : 'Active Verified Records', value: `${verifiedCount} Records` },
          { label: isBilingual ? 'Tamper Detection (छेड़छाड़ पहचान)' : 'Tamper Detection', value: 'Bit-level payload recalculation' },
          { label: isBilingual ? 'Ledger Proof (बहीखाता प्रमाण)' : 'Ledger Proof', value: 'Locally cryptographically anchored' },
        ],
      },
      suggestedQuestions: isBilingual
        ? [
            'सबसे ज्यादा risk वाला transaction समझाइए',
            'कौनसे transactions में high risk है?',
            'आज का नेट कैश फ्लो सारांश बताओ',
          ]
        : [
            'Explain the highest-risk transaction.',
            'Which transactions need attention?',
            'Give me a summary of net cash flow.',
          ],
    };
  }

  // 6. QUERY: Salary & Payroll Overview / Vetan / Tankhwah
  if (
    normalized.includes('salary') ||
    normalized.includes('salaries') ||
    normalized.includes('payroll') ||
    normalized.includes('vetan') ||
    normalized.includes('tankhwah') ||
    normalized.includes('वेतन') ||
    normalized.includes('सैलरी') ||
    normalized.includes('पेरोल')
  ) {
    const salaryTxs = transactions.filter((t) => t.category.toLowerCase().includes('salary'));
    const totalSalary = salaryTxs.reduce((sum, t) => sum + t.amount, 0);

    const spokenEn = `Salary expenditures total ${formatINR(totalSalary)} across ${salaryTxs.length} payroll transactions recorded in the ledger.`;
    const spokenBilingual = `Aapke ledger me salary aur payroll ka kul kharcha ${formatINR(
      totalSalary
    )} hai, jo kul ${salaryTxs.length} recorded payroll transactions me darj hai.`;
    const spokenHindi = `आपके बहीखाते में वेतन और पेरोल का कुल व्यय ${formatINR(
      totalSalary
    )} है, जो कुल ${salaryTxs.length} दर्ज लेन-देन में शामिल है।`;

    return {
      query,
      language,
      spokenText: isBilingual ? spokenBilingual : spokenEn,
      spokenTextHindi: spokenHindi,
      spokenTextEnglish: spokenEn,
      visualData: {
        type: 'metric',
        title: isBilingual ? 'Payroll & Salaries Overview (वेतन और पेरोल सारांश)' : 'Payroll & Salaries Overview',
        items: [
          { label: isBilingual ? 'Total Salary Outflow (कुल वेतन व्यय)' : 'Total Salary Outflow', value: formatINR(totalSalary) },
          { label: isBilingual ? 'Payroll Count (पेरोल लेन-देन संख्या)' : 'Payroll Count', value: `${salaryTxs.length} Transactions` },
        ],
      },
      suggestedQuestions: isBilingual
        ? ['आज का नेट कैश फ्लो कितना है?', 'कौनसे transactions में high risk है?']
        : ['Summarize today’s financial activity.', 'Which transactions need attention?'],
    };
  }

  // 7. DEFAULT / GENERAL SUMMARY:
  const topRisk = transactions.filter((t) => t.risk_level === 'high' || t.risk_level === 'critical').length;
  const spokenEn = `Here is your financial executive overview. A total of ${transactions.length} transactions have been recorded with aggregate value of ${formatINR(
    metrics.totalTransactionValue
  )}. Net cash flow is ${formatINR(metrics.netCashFlow)}. There ${topRisk === 1 ? 'is' : 'are'} ${topRisk} elevated risk item${
    topRisk === 1 ? '' : 's'
  } flagged for review, and ${decisions.length} verified decision certificates exist on record.`;

  const spokenBilingual = `Namaste! Yeh raha aapka financial executive overview. Ledger me kul ${
    transactions.length
  } transactions darj hain jinki kul rashi ${formatINR(
    metrics.totalTransactionValue
  )} hai. Net cash flow ${formatINR(metrics.netCashFlow)} positive hai. Samiksha ke liye ${topRisk} elevated risk item${
    topRisk === 1 ? '' : 's'
  } flagged hain, aur ${decisions.length} verified decision certificates surakshit hain.`;

  const spokenHindi = `नमस्ते! यह आपकी वित्तीय कार्यकारी सारांश रिपोर्ट है। बहीखाते में कुल ${formatINR(
    metrics.totalTransactionValue
  )} मूल्य के ${transactions.length} लेन-देन दर्ज हैं। नेट कैश फ्लो ${formatINR(metrics.netCashFlow)} है। समीक्षा के लिए ${topRisk} उच्च जोखिम वाले लेन-देन चिह्नित हैं, और ${decisions.length} सत्यापित निर्णय प्रमाण पत्र दर्ज हैं।`;

  return {
    query,
    language,
    spokenText: isBilingual ? spokenBilingual : spokenEn,
    spokenTextHindi: spokenHindi,
    spokenTextEnglish: spokenEn,
    visualData: {
      type: 'summary',
      title: isBilingual ? 'FINOVA Intelligence Summary (वित्तीय सारांश रिपोर्ट)' : 'FINOVA Intelligence Summary',
      items: [
        { label: isBilingual ? 'Total Transactions (कुल लेन-देन)' : 'Total Transactions', value: transactions.length.toString() },
        { label: isBilingual ? 'Total Volume (कुल राशि)' : 'Total Volume', value: formatINR(metrics.totalTransactionValue) },
        { label: isBilingual ? 'Net Cash Flow (शुद्ध रोकड़)' : 'Net Cash Flow', value: formatINR(metrics.netCashFlow) },
        { label: isBilingual ? 'High Risk Flags (उच्च जोखिम)' : 'High Risk Flags', value: topRisk.toString(), badge: topRisk > 0 ? 'Action Needed' : 'Normal' },
        { label: isBilingual ? 'Verified Decisions (सत्यापित निर्णय)' : 'Verified Decisions', value: decisions.length.toString() },
      ],
    },
    suggestedQuestions: isBilingual
      ? [
          'आज का नेट कैश फ्लो कितना है?',
          'कौनसे transactions में high risk है?',
          'सबसे ज्यादा risk वाला transaction समझाइए',
          'Blockchain verification hash कैसे काम करता है?',
        ]
      : [
          'Which transactions need attention?',
          'Explain the highest-risk transaction.',
          'What does the verification hash prove?',
          'Give me a summary of net cash flow.',
        ],
  };
}
