"""
Service d'import de transactions depuis fichiers CSV
"""
import csv
import io
from datetime import datetime
from typing import List, Dict, Any, Optional
from decimal import Decimal
import re


class CSVImportService:
    """Service pour importer des transactions depuis un fichier CSV"""
    
    # Mappings possibles pour les colonnes
    DATE_COLUMNS = ['date', 'date operation', 'date_operation', 'dateop', 'dateval', 'date_val', 'datum']
    DESCRIPTION_COLUMNS = ['description', 'libelle', 'libellé', 'label', 'details', 'détails', 'wording']
    AMOUNT_COLUMNS = ['montant', 'amount', 'somme', 'valeur', 'value']
    DEBIT_COLUMNS = ['debit', 'débit', 'sortie', 'dépense', 'expense']
    CREDIT_COLUMNS = ['credit', 'crédit', 'entrée', 'revenu', 'income']
    ACCOUNT_COLUMNS = ['accountnum', 'account_num', 'numero_compte', 'account', 'compte']
    CATEGORY_COLUMNS = ['category', 'categorie', 'catégorie', 'categoryparent']
    
    # Formats spécifiques des banques
    BANK_FORMATS = {
        'boursobank': {
            'headers': ['dateOp', 'dateVal', 'label', 'category', 'categoryParent', 'supplierFound', 'amount', 'comment', 'accountNum', 'accountLabel', 'accountbalance'],
            'date_column': 'dateOp',  # Préférer dateOp car dateVal peut être vide
            'description_column': 'label',
            'amount_column': 'amount',
            'account_column': 'accountNum',
            'category_column': 'category',
            'delimiter': ';'
        },
        'cic': {
            'headers': ['Date', 'Date de valeur', 'Libellé', 'Débit', 'Crédit', 'Solde'],
            'date_column': 'Date',
            'description_column': 'Libellé',
            'debit_column': 'Débit',
            'credit_column': 'Crédit',
            'delimiter': ';'
        }
    }
    
    def __init__(self):
        self.detected_delimiter = None
        self.detected_headers = None
        self.detected_bank = None
        self.column_mapping = {}
    
    def detect_delimiter(self, content: str) -> str:
        """Détecte le délimiteur du CSV (virgule, point-virgule, tabulation)"""
        first_line = content.split('\n')[0]
        
        # Compte les occurrences de chaque délimiteur possible
        delimiters = [',', ';', '\t', '|']
        counts = {d: first_line.count(d) for d in delimiters}
        
        # Prend le délimiteur le plus fréquent
        delimiter = max(counts, key=counts.get)
        
        # Si aucun délimiteur trouvé, par défaut virgule
        if counts[delimiter] == 0:
            delimiter = ','
        
        return delimiter
    
    def detect_encoding(self, file_bytes: bytes) -> str:
        """Détecte l'encodage du fichier (UTF-8, Latin-1, Windows-1252)"""
        # Essaie UTF-8 en premier
        try:
            file_bytes.decode('utf-8')
            return 'utf-8'
        except UnicodeDecodeError:
            pass
        
        # Essaie Latin-1 (ISO-8859-1)
        try:
            file_bytes.decode('latin-1')
            return 'latin-1'
        except UnicodeDecodeError:
            pass
        
        # Par défaut Windows-1252
        return 'cp1252'
    
    def detect_bank_format(self, headers: List[str]) -> Optional[str]:
        """
        Détecte le format de la banque en comparant les en-têtes
        Retourne 'boursobank', 'cic', ou None si format inconnu
        """
        # Normalise les headers pour comparaison
        header_set = set(headers)
        
        # Vérifie BoursoBank (colonnes spécifiques exactes)
        boursobank_signature = {'dateOp', 'dateVal', 'accountLabel', 'categoryParent'}
        if boursobank_signature.issubset(header_set):
            return 'boursobank'
        
        # Vérifie CIC (colonnes en français)
        cic_signature = {'Date', 'Date de valeur', 'Libellé', 'Débit', 'Crédit'}
        if len(cic_signature.intersection(header_set)) >= 4:
            return 'cic'
        
        return None
    
    def normalize_column_name(self, name: str) -> str:
        """Normalise un nom de colonne (minuscules, sans accents, sans espaces)"""
        name = name.lower().strip()
        # Remplace les accents
        replacements = {
            'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
            'à': 'a', 'â': 'a', 'ä': 'a',
            'ù': 'u', 'û': 'u', 'ü': 'u',
            'î': 'i', 'ï': 'i',
            'ô': 'o', 'ö': 'o',
            'ç': 'c'
        }
        for old, new in replacements.items():
            name = name.replace(old, new)
        
        # Remplace espaces et tirets par underscore
        name = re.sub(r'[\s\-]+', '_', name)
        
        return name
    
    def detect_column_mapping(self, headers: List[str]) -> Dict[str, str]:
        """Détecte automatiquement le mapping des colonnes"""
        mapping = {}
        
        # Détecte le format de la banque
        bank_format = self.detect_bank_format(headers)
        self.detected_bank = bank_format
        
        # Si format connu, utilise le mapping spécifique
        if bank_format and bank_format in self.BANK_FORMATS:
            format_spec = self.BANK_FORMATS[bank_format]
            
            # Mapping direct pour les banques connues
            if 'date_column' in format_spec and format_spec['date_column'] in headers:
                mapping['date'] = format_spec['date_column']
            
            if 'description_column' in format_spec and format_spec['description_column'] in headers:
                mapping['description'] = format_spec['description_column']
            
            if 'amount_column' in format_spec and format_spec['amount_column'] in headers:
                mapping['amount'] = format_spec['amount_column']
            
            if 'debit_column' in format_spec and format_spec['debit_column'] in headers:
                mapping['debit'] = format_spec['debit_column']
            
            if 'credit_column' in format_spec and format_spec['credit_column'] in headers:
                mapping['credit'] = format_spec['credit_column']
            
            if 'account_column' in format_spec and format_spec['account_column'] in headers:
                mapping['account'] = format_spec['account_column']
            
            if 'category_column' in format_spec and format_spec['category_column'] in headers:
                mapping['category'] = format_spec['category_column']
            
            return mapping
        
        # Sinon, détection générique (code existant)
        normalized_headers = {self.normalize_column_name(h): h for h in headers}
        
        # Détecte la colonne date
        for pattern in self.DATE_COLUMNS:
            pattern_norm = self.normalize_column_name(pattern)
            if pattern_norm in normalized_headers:
                mapping['date'] = normalized_headers[pattern_norm]
                break
        
        # Détecte la colonne description
        for pattern in self.DESCRIPTION_COLUMNS:
            pattern_norm = self.normalize_column_name(pattern)
            if pattern_norm in normalized_headers:
                mapping['description'] = normalized_headers[pattern_norm]
                break
        
        # Détecte les colonnes montant (soit une seule colonne, soit débit/crédit)
        has_amount = False
        for pattern in self.AMOUNT_COLUMNS:
            pattern_norm = self.normalize_column_name(pattern)
            if pattern_norm in normalized_headers:
                mapping['amount'] = normalized_headers[pattern_norm]
                has_amount = True
                break
        
        if not has_amount:
            # Cherche débit et crédit séparés
            for pattern in self.DEBIT_COLUMNS:
                pattern_norm = self.normalize_column_name(pattern)
                if pattern_norm in normalized_headers:
                    mapping['debit'] = normalized_headers[pattern_norm]
                    break
            
            for pattern in self.CREDIT_COLUMNS:
                pattern_norm = self.normalize_column_name(pattern)
                if pattern_norm in normalized_headers:
                    mapping['credit'] = normalized_headers[pattern_norm]
                    break
        
        # Détecte la colonne numéro de compte
        for pattern in self.ACCOUNT_COLUMNS:
            pattern_norm = self.normalize_column_name(pattern)
            if pattern_norm in normalized_headers:
                mapping['account'] = normalized_headers[pattern_norm]
                break
        
        # Détecte la colonne catégorie
        for pattern in self.CATEGORY_COLUMNS:
            pattern_norm = self.normalize_column_name(pattern)
            if pattern_norm in normalized_headers:
                mapping['category'] = normalized_headers[pattern_norm]
                break
        
        return mapping
    
    def parse_date(self, date_str: str) -> Optional[datetime]:
        """Parse une date avec différents formats possibles"""
        if not date_str or date_str.strip() == '':
            return None
        
        date_str = date_str.strip()
        
        # Formats à essayer
        formats = [
            '%d/%m/%Y',      # 01/12/2025
            '%d-%m-%Y',      # 01-12-2025
            '%Y-%m-%d',      # 2025-12-01 (ISO)
            '%d/%m/%y',      # 01/12/25
            '%d.%m.%Y',      # 01.12.2025
            '%Y/%m/%d',      # 2025/12/01
            '%d %b %Y',      # 01 Dec 2025
            '%d %B %Y',      # 01 December 2025
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        
        return None
    
    def parse_amount(self, amount_str: str) -> Optional[float]:
        """Parse un montant avec différents formats possibles"""
        if not amount_str or amount_str.strip() == '':
            return None
        
        amount_str = amount_str.strip()
        
        # Supprime les espaces (1 000,00 -> 1000,00)
        amount_str = amount_str.replace(' ', '')
        
        # Remplace virgule par point pour les décimales
        # Si format français: 1.234,56 -> 1234.56
        if ',' in amount_str and '.' in amount_str:
            # Format avec les deux: détermine lequel est le séparateur décimal
            comma_pos = amount_str.rfind(',')
            dot_pos = amount_str.rfind('.')
            if comma_pos > dot_pos:
                # Virgule est le séparateur décimal (format français)
                amount_str = amount_str.replace('.', '').replace(',', '.')
            else:
                # Point est le séparateur décimal (format anglo-saxon)
                amount_str = amount_str.replace(',', '')
        elif ',' in amount_str:
            # Seulement virgule: c'est le séparateur décimal
            amount_str = amount_str.replace(',', '.')
        
        # Supprime les symboles monétaires
        amount_str = re.sub(r'[€$£]', '', amount_str)
        
        try:
            return float(amount_str)
        except ValueError:
            return None
    
    def preview_csv(
        self,
        content: str,
        max_rows: int = 10
    ) -> Dict[str, Any]:
        """Prévisualise le contenu du CSV et détecte le format"""
        
        # Supprime le BOM UTF-8 si présent
        if content.startswith('\ufeff'):
            content = content[1:]
        
        delimiter = self.detect_delimiter(content)
        reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)
        
        headers = reader.fieldnames
        # Nettoie les headers (enlève BOM et espaces)
        headers = [h.lstrip('\ufeff').strip() for h in headers]
        
        column_mapping = self.detect_column_mapping(headers)
        
        rows = []
        for i, row in enumerate(reader):
            if i >= max_rows:
                break
            rows.append(row)
        
        return {
            'delimiter': delimiter,
            'headers': headers,
            'column_mapping': column_mapping,
            'detected_bank': self.detected_bank,  # Ajout de la banque détectée
            'preview_rows': rows,
            'total_rows': len(rows)  # Note: seulement les rows preview, pas le total réel
        }
    
    def parse_csv(
        self,
        content: str,
        column_mapping: Optional[Dict[str, str]] = None,
        delimiter: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Parse le CSV et retourne une liste de transactions"""
        
        # Supprime le BOM UTF-8 si présent
        if content.startswith('\ufeff'):
            content = content[1:]
        
        # Détecte le délimiteur si non fourni
        if delimiter is None:
            delimiter = self.detect_delimiter(content)
        
        reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)
        headers = reader.fieldnames
        # Nettoie les headers
        headers = [h.lstrip('\ufeff').strip() for h in headers]
        
        # Utilise le mapping fourni ou détecte automatiquement
        if column_mapping is None:
            column_mapping = self.detect_column_mapping(headers)
        
        transactions = []
        
        for row_num, row in enumerate(reader, start=2):  # Start at 2 (1 is header)
            try:
                transaction = self._parse_row(row, column_mapping)
                if transaction:
                    transaction['csv_row'] = row_num
                    transactions.append(transaction)
            except Exception as e:
                # Log l'erreur mais continue
                print(f"Erreur ligne {row_num}: {e}")
                continue
        
        return transactions
    
    def _parse_row(
        self,
        row: Dict[str, str],
        column_mapping: Dict[str, str]
    ) -> Optional[Dict[str, Any]]:
        """Parse une ligne du CSV en transaction"""
        
        # Parse la date
        if 'date' not in column_mapping:
            return None
        
        date_str = row.get(column_mapping['date'], '').strip()
        
        # Si la date mappée est vide, essaie dateOp (format BoursoBank)
        if not date_str and 'dateOp' in row:
            date_str = row.get('dateOp', '').strip()
        
        date = self.parse_date(date_str)
        if not date:
            return None
        
        # Parse la description
        description = row.get(column_mapping.get('description', ''), '').strip()
        if not description:
            description = 'Transaction importée'
        
        # Parse le montant
        amount = None
        amount_type = None
        
        if 'amount' in column_mapping:
            # Colonne montant unique (positif = crédit, négatif = débit)
            amount_str = row.get(column_mapping['amount'], '')
            amount = self.parse_amount(amount_str)
            if amount is not None:
                amount_type = 'income' if amount > 0 else 'expense'
                amount = abs(amount)
        
        elif 'debit' in column_mapping or 'credit' in column_mapping:
            # Colonnes débit/crédit séparées
            debit_str = row.get(column_mapping.get('debit', ''), '')
            credit_str = row.get(column_mapping.get('credit', ''), '')
            
            debit = self.parse_amount(debit_str)
            credit = self.parse_amount(credit_str)
            
            if credit and credit > 0:
                amount = credit
                amount_type = 'income'
            elif debit and debit > 0:
                amount = debit
                amount_type = 'expense'
        
        if amount is None or amount == 0:
            return None
        
        return {
            'date': date.isoformat(),
            'description': description,
            'amount': amount,
            'type': amount_type
        }
    
    def import_to_database(
        self,
        transactions: List[Dict[str, Any]],
        user_id: str,
        bank_connection_id: Optional[str] = None,
        bank_account_id: Optional[str] = None,
        category_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Prépare les transactions pour l'insertion en base
        (L'insertion réelle sera faite par le router)
        """
        
        prepared_transactions = []
        
        for trans in transactions:
            prepared = {
                'user_id': user_id,
                'date': trans['date'],
                'description': trans['description'],
                'amount': trans['amount'],
                'type': trans['type'],
                'category': category_id,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Ajoute les références bancaires si fournies
            if bank_connection_id:
                prepared['bank_connection_id'] = bank_connection_id
            
            if bank_account_id:
                prepared['bank_account_id'] = bank_account_id
                # Génère un external_id pour éviter les doublons
                date_obj = datetime.fromisoformat(trans['date'])
                date_str = date_obj.date().isoformat()
                external_id = f"{bank_account_id}_{date_str}_{trans['amount']}_{trans['description'][:20]}"
                prepared['external_id'] = external_id
            
            prepared_transactions.append(prepared)
        
        return {
            'transactions': prepared_transactions,
            'count': len(prepared_transactions)
        }
