/**
 * Service de parsing CSV côté frontend
 * Parse les fichiers BoursoBank et CIC directement dans le navigateur
 */

// Détection automatique du délimiteur
const detectDelimiter = (firstLine) => {
  const delimiters = [';', ',', '\t', '|'];
  let maxCount = 0;
  let detectedDelimiter = ';';
  
  delimiters.forEach(delimiter => {
    const count = (firstLine.match(new RegExp('\\' + delimiter, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      detectedDelimiter = delimiter;
    }
  });
  
  return detectedDelimiter;
};

// Parser une ligne CSV en tenant compte des guillemets
const parseCSVLine = (line, delimiter) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// Détection du format de banque
const detectBankFormat = (headers) => {
  const headerLower = headers.map(h => {
    // Normaliser les caractères (enlever accents et caractères spéciaux)
    return h.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
      .replace(/[^a-z0-9]/g, ''); // Garder seulement lettres et chiffres
  });
  
  // BoursoBank: dateOp, dateVal, label, categoryParent
  const boursoSignature = ['dateop', 'dateval', 'label', 'categoryparent', 'accountnum'];
  const boursoMatch = boursoSignature.filter(sig => 
    headerLower.some(h => h.includes(sig))
  ).length;
  
  // CIC: Date, Date de valeur, Libellé, Débit, Crédit, Solde
  // Chercher 'date' ET ('debit' OU 'dit') ET ('credit' OU 'dit') ET 'solde'
  const cicSignature = ['date', 'libelle', 'solde'];
  const cicMatch = cicSignature.filter(sig => 
    headerLower.some(h => h.includes(sig))
  ).length;
  
  // Vérifier aussi la présence de colonnes debit/credit (même avec caractères corrompus)
  const hasDebitCredit = headerLower.some(h => h.includes('debit') || h.includes('dit')) &&
                          headerLower.some(h => h.includes('credit') || h.includes('dit'));
  
  console.log('Detection - Headers normalisés:', headerLower);
  console.log('Detection - BoursoBank match:', boursoMatch, '/ CIC match:', cicMatch, '/ Has Debit/Credit:', hasDebitCredit);
  
  if (boursoMatch >= 3) return 'boursobank';
  if (cicMatch >= 2 && hasDebitCredit) return 'cic';
  return 'unknown';
};

// Parser une date française (dd/mm/yyyy ou yyyy-mm-dd)
const parseDate = (dateStr) => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Format yyyy-mm-dd
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return dateStr.split(' ')[0];
  }
  
  // Format dd/mm/yyyy
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  
  return null;
};

// Parser un montant français (-40,00 ou 40,00)
const parseAmount = (amountStr) => {
  if (!amountStr || amountStr.trim() === '') return 0;
  
  // Supprimer les espaces et symboles
  let cleaned = amountStr.replace(/\s+/g, '').replace('€', '');
  
  // Remplacer virgule par point
  cleaned = cleaned.replace(',', '.');
  
  return parseFloat(cleaned) || 0;
};

// Parser un fichier CSV BoursoBank
const parseBoursoBank = (rows, headers, delimiter) => {
  const transactions = [];
  
  // Créer un mapping des colonnes
  const getColumnIndex = (name) => {
    return headers.findIndex(h => 
      h.toLowerCase().replace(/\s+/g, '').includes(name.toLowerCase())
    );
  };
  
  const dateOpIdx = getColumnIndex('dateop');
  const dateValIdx = getColumnIndex('dateval');
  const labelIdx = getColumnIndex('label');
  const amountIdx = getColumnIndex('amount');
  const categoryIdx = getColumnIndex('category');
  const accountNumIdx = getColumnIndex('accountnum');
  
  for (let i = 1; i < rows.length; i++) {
    const row = parseCSVLine(rows[i], delimiter);
    
    if (row.length < headers.length - 2) continue; // Ligne vide ou invalide
    
    const dateOp = row[dateOpIdx] || '';
    const dateVal = row[dateValIdx] || '';
    const date = parseDate(dateOp) || parseDate(dateVal);
    
    if (!date) continue; // Pas de date = ligne invalide
    
    const amount = parseAmount(row[amountIdx]);
    
    const transaction = {
      date: date,
      description: row[labelIdx] || '',
      amount: Math.abs(amount),
      type: amount < 0 ? 'expense' : 'income',
      category: row[categoryIdx] || 'Non catégorisé',
      account: row[accountNumIdx] || '',
      external_id: `bourso_${date}_${row[labelIdx]}_${amount}`.replace(/\s+/g, '_'),
      tags: ['boursobank', 'import']
    };
    
    transactions.push(transaction);
  }
  
  return transactions;
};

// Parser un fichier CSV CIC
const parseCIC = (rows, headers, delimiter) => {
  const transactions = [];
  
  // Pour CIC, utiliser les indices de colonnes directement car les headers ont des caractères corrompus
  // Format CIC: Date;Date de valeur;Débit;Crédit;Libellé;Solde
  // Indices:    0    1              2      3       4        5
  
  const dateIdx = 0;
  const debitIdx = 2;
  const creditIdx = 3;
  const libelleIdx = 4;
  
  console.log('CIC Parser - Headers:', headers);
  console.log('CIC Parser - Indices des colonnes (fixes):', {
    date: dateIdx,
    libelle: libelleIdx,
    debit: debitIdx,
    credit: creditIdx
  });
  
  console.log('CIC Parser - Nombre de lignes à parser:', rows.length);
  
  for (let i = 1; i < rows.length; i++) {
    const row = parseCSVLine(rows[i], delimiter);
    
    // Log des premières lignes
    if (i <= 3) {
      console.log(`CIC Parser - Ligne ${i}:`, row);
    }
    
    if (row.length < 3) continue; // Ligne vide ou invalide
    
    const date = parseDate(row[dateIdx]);
    if (!date) {
      if (i <= 3) console.log(`CIC Parser - Date invalide à la ligne ${i}:`, row[dateIdx]);
      continue;
    }
    
    const debitStr = row[debitIdx] || '';
    const creditStr = row[creditIdx] || '';
    
    // Log de debug
    if (i <= 3) {
      console.log(`CIC Parser - Ligne ${i} - Débit: "${debitStr}", Crédit: "${creditStr}"`);
    }
    
    // Dans le format CIC:
    // - Colonne "Crédit" = REVENUS (argent qui arrive : salaires, virements, crédits CB)
    // - Colonne "Débit" = DÉPENSES (argent qui sort : chèques, prélèvements, retraits)
    // Note: Les montants en Débit peuvent être négatifs (ex: -53,00)
    let amount = 0;
    let type = 'expense';
    
    if (creditStr && creditStr.trim() !== '') {
      // Il y a un crédit → c'est un REVENU
      amount = parseAmount(creditStr);
      type = 'income';
    } else if (debitStr && debitStr.trim() !== '') {
      // Il y a un débit → c'est une DÉPENSE
      amount = parseAmount(debitStr);
      type = 'expense';
    } else {
      continue; // Pas de montant, ligne invalide
    }
    
    const description = row[libelleIdx] || '';
    
    const transaction = {
      date: date,
      description: description,
      amount: Math.abs(amount),
      type: type,
      category: 'Non catégorisé',
      account: '',
      external_id: `cic_${date}_${description}_${amount}`.replace(/\s+/g, '_'),
      tags: ['cic', 'import']
    };
    
    // Log de debug pour les 3 premières transactions
    if (transactions.length < 3) {
      console.log('CIC Transaction parsed:', transaction);
    }
    
    transactions.push(transaction);
  }
  
  console.log('CIC Parser - Total transactions:', transactions.length);
  
  return transactions;
};

/**
 * Parse un fichier CSV
 * @param {File} file - Fichier CSV à parser
 * @returns {Promise<Object>} - Résultat avec transactions et métadonnées
 */
export const parseCSVFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        let content = e.target.result;
        
        // Supprimer le BOM UTF-8 si présent
        if (content.charCodeAt(0) === 0xFEFF) {
          content = content.substring(1);
        }
        
        // Séparer en lignes
        const lines = content.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          reject(new Error('Fichier CSV vide ou invalide'));
          return;
        }
        
        // Détecter le délimiteur
        const delimiter = detectDelimiter(lines[0]);
        
        // Parser l'en-tête
        let headers = parseCSVLine(lines[0], delimiter);
        
        // Supprimer le BOM du premier header si présent
        if (headers[0] && headers[0].charCodeAt(0) === 0xFEFF) {
          headers[0] = headers[0].substring(1);
        }
        
        // Détecter le format
        const bankFormat = detectBankFormat(headers);
        
        // Parser les transactions selon le format
        let transactions = [];
        if (bankFormat === 'boursobank') {
          transactions = parseBoursoBank(lines, headers, delimiter);
        } else if (bankFormat === 'cic') {
          transactions = parseCIC(lines, headers, delimiter);
        } else {
          reject(new Error('Format de banque non reconnu. Formats supportés : BoursoBank, CIC'));
          return;
        }
        
        resolve({
          success: true,
          filename: file.name,
          detected_bank: bankFormat,
          total_transactions: transactions.length,
          transactions: transactions,
          preview: transactions.slice(0, 10)
        });
        
      } catch (error) {
        reject(new Error(`Erreur lors du parsing: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    // Lire le fichier en texte UTF-8
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * Importer des transactions parsées vers le backend
 * @param {Array} transactions - Tableau de transactions
 * @param {String} bankConnectionId - ID de la connexion bancaire (optionnel)
 * @param {String} bankAccountId - ID du compte bancaire (optionnel)
 * @param {String} categoryId - ID de la catégorie par défaut (optionnel)
 */
export const importTransactions = async (transactions, bankConnectionId = null, bankAccountId = null, categoryId = null) => {
  // Cette fonction sera appelée par le service bankService
  // pour envoyer les transactions au backend via l'API normale
  return {
    transactions,
    bankConnectionId,
    bankAccountId,
    categoryId
  };
};
