"""
Router pour l'import de transactions depuis fichiers CSV
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Form
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

from app.core.database import get_db
from app.routers.auth import get_current_user
from app.services.csv_import import CSVImportService

router = APIRouter(prefix="/api/import", tags=["import"])


@router.post("/preview")
async def preview_csv_file(
    file: UploadFile = File(...),
    current_user: Dict = Depends(get_current_user)
):
    """
    Prévisualise un fichier CSV avant import
    Détecte automatiquement le format et les colonnes
    """
    
    # Vérifie le type de fichier
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400,
            detail="Le fichier doit être au format CSV"
        )
    
    # Lit le contenu du fichier
    content_bytes = await file.read()
    
    # Détecte l'encodage
    csv_service = CSVImportService()
    encoding = csv_service.detect_encoding(content_bytes)
    
    try:
        content = content_bytes.decode(encoding)
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur de décodage du fichier: {str(e)}"
        )
    
    # Prévisualise le CSV
    try:
        preview = csv_service.preview_csv(content, max_rows=10)
        return {
            "success": True,
            "filename": file.filename,
            "encoding": encoding,
            **preview
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur lors de la lecture du CSV: {str(e)}"
        )


@router.post("/parse")
async def parse_csv_file(
    file: UploadFile = File(...),
    column_mapping: Optional[str] = Form(None),  # JSON string
    delimiter: Optional[str] = Form(None),
    current_user: Dict = Depends(get_current_user)
):
    """
    Parse le fichier CSV complet et retourne toutes les transactions
    """
    
    # Lit le contenu
    content_bytes = await file.read()
    csv_service = CSVImportService()
    encoding = csv_service.detect_encoding(content_bytes)
    content = content_bytes.decode(encoding)
    
    # Parse le column_mapping si fourni
    import json
    mapping = None
    if column_mapping:
        try:
            mapping = json.loads(column_mapping)
        except:
            pass
    
    # Parse le CSV
    try:
        transactions = csv_service.parse_csv(
            content,
            column_mapping=mapping,
            delimiter=delimiter
        )
        
        return {
            "success": True,
            "transactions": transactions,
            "count": len(transactions)
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur lors du parsing du CSV: {str(e)}"
        )


@router.post("/execute")
async def import_csv_transactions(
    file: UploadFile = File(...),
    bank_connection_id: Optional[str] = Form(None),
    bank_account_id: Optional[str] = Form(None),
    category_id: Optional[str] = Form(None),
    column_mapping: Optional[str] = Form(None),
    delimiter: Optional[str] = Form(None),
    current_user: Dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Importe les transactions du CSV dans la base de données
    """
    
    user_id = current_user["_id"]
    if isinstance(user_id, str):
        user_id = ObjectId(user_id)
    
    # Lit et parse le fichier
    content_bytes = await file.read()
    csv_service = CSVImportService()
    encoding = csv_service.detect_encoding(content_bytes)
    content = content_bytes.decode(encoding)
    
    # Parse le column_mapping
    import json
    mapping = None
    if column_mapping:
        try:
            mapping = json.loads(column_mapping)
        except:
            pass
    
    # Parse le CSV
    try:
        transactions = csv_service.parse_csv(
            content,
            column_mapping=mapping,
            delimiter=delimiter
        )
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Erreur lors du parsing: {str(e)}"
        )
    
    if not transactions:
        raise HTTPException(
            status_code=400,
            detail="Aucune transaction valide trouvée dans le fichier"
        )
    
    # Prépare les transactions pour insertion
    bank_conn_id_obj = ObjectId(bank_connection_id) if bank_connection_id else None
    bank_acc_id_obj = ObjectId(bank_account_id) if bank_account_id else None
    category_id_obj = ObjectId(category_id) if category_id else None
    
    prepared = csv_service.import_to_database(
        transactions,
        user_id=str(user_id),
        bank_connection_id=str(bank_conn_id_obj) if bank_conn_id_obj else None,
        bank_account_id=str(bank_acc_id_obj) if bank_acc_id_obj else None,
        category_id=str(category_id_obj) if category_id_obj else None
    )
    
    # Insère les transactions
    transactions_collection = await db.get_collection("transactions")
    rules_collection = await db.get_collection("rules")
    
    # Récupérer toutes les règles actives une seule fois
    active_rules = await rules_collection.find({
        "user_id": user_id,
        "is_active": True
    }).to_list(length=None)
    
    inserted_count = 0
    skipped_count = 0
    errors = []
    
    for trans_data in prepared['transactions']:
        try:
            # Convertit les IDs en ObjectId
            trans_data['user_id'] = user_id
            if bank_conn_id_obj:
                trans_data['bank_connection_id'] = bank_conn_id_obj
            if bank_acc_id_obj:
                trans_data['bank_account_id'] = bank_acc_id_obj
            if category_id_obj:
                trans_data['category'] = category_id_obj
            
            # Convertit la date ISO en datetime
            trans_data['date'] = datetime.fromisoformat(trans_data['date'])
            trans_data['created_at'] = datetime.now()
            trans_data['updated_at'] = datetime.now()
            
            # Vérifie si la transaction existe déjà (si external_id présent)
            if 'external_id' in trans_data:
                existing = await transactions_collection.find_one({
                    'user_id': user_id,
                    'external_id': trans_data['external_id']
                })
                
                if existing:
                    skipped_count += 1
                    continue
            
            # Applique les règles AVANT l'insertion
            description = trans_data.get('description', '').upper()
            transaction_date = trans_data['date']
            
            for rule in active_rules:
                pattern = rule['pattern'].upper()
                match_type = rule['match_type']
                
                # Vérifier la période d'application
                if rule.get('start_date'):
                    start_date = rule['start_date'] if isinstance(rule['start_date'], datetime) else datetime.fromisoformat(rule['start_date'])
                    if transaction_date < start_date:
                        continue
                
                if rule.get('end_date'):
                    end_date = rule['end_date'] if isinstance(rule['end_date'], datetime) else datetime.fromisoformat(rule['end_date'])
                    if transaction_date > end_date:
                        continue
                
                # Vérifier les exceptions
                exceptions = rule.get('exceptions', [])
                is_exception = False
                for exception_pattern in exceptions:
                    if exception_pattern.upper() in description:
                        is_exception = True
                        break
                
                if is_exception:
                    continue
                
                # Vérifier le match
                matched = False
                if match_type == 'contains':
                    matched = pattern in description
                elif match_type == 'starts_with':
                    matched = description.startswith(pattern)
                elif match_type == 'ends_with':
                    matched = description.endswith(pattern)
                elif match_type == 'exact':
                    matched = description == pattern
                
                if matched:
                    # Appliquer la catégorie de la règle
                    trans_data['category_id'] = rule['category_id']
                    break  # Première règle qui match
            
            # Insère la transaction
            await transactions_collection.insert_one(trans_data)
            inserted_count += 1
            
        except Exception as e:
            errors.append({
                'description': trans_data.get('description', 'Unknown'),
                'error': str(e)
            })
    
    return {
        "success": True,
        "imported": inserted_count,
        "skipped": skipped_count,
        "errors": errors,
        "total_processed": len(prepared['transactions'])
    }
