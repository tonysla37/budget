from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from bson import ObjectId

from app.core.database import get_db
from app.core.encryption import encryption_service
from app.schemas.bank_connection import (
    BankConnectionCreate,
    BankConnectionUpdate,
    BankConnectionResponse,
    BankAccountResponse,
    SyncResult
)
from app.routers.auth import get_current_user

router = APIRouter(
    prefix="/api/bank-connections",
    tags=["Bank Connections"]
)

@router.get("", response_model=List[BankConnectionResponse])
async def get_bank_connections(
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Récupère toutes les connexions bancaires de l'utilisateur"""
    try:
        collection = await db.get_collection("bank_connections")
        user_id = current_user["_id"]
        # Convertir en ObjectId si c'est une string
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        connections = await collection.find({
            "user_id": user_id
        }).to_list(length=100)
        
        # Convertir les ObjectId en string
        for conn in connections:
            conn["id"] = str(conn["_id"])
            del conn["_id"]
            
            # Ne jamais renvoyer les credentials chiffrés
            for field in ["encrypted_username", "encrypted_password", 
                         "encrypted_api_client_id", "encrypted_api_client_secret"]:
                conn.pop(field, None)
        
        return connections
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des connexions: {str(e)}"
        )

@router.post("", response_model=BankConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_bank_connection(
    connection: BankConnectionCreate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Crée une nouvelle connexion bancaire"""
    try:
        user_id = str(current_user["_id"])
        
        # Préparer les données de base
        connection_data = {
            "user_id": user_id,
            "bank": connection.bank,
            "connection_type": connection.connection_type,
            "nickname": connection.nickname,
            "is_active": True,
            "accounts_count": 0,
            "last_sync": None,
            "created_at": datetime.now(),
            "updated_at": datetime.now()
        }
        
        # Chiffrer les credentials selon le type de connexion
        if connection.connection_type == "api":
            if connection.api_client_id:
                connection_data["encrypted_api_client_id"] = encryption_service.encrypt(
                    connection.api_client_id, user_id
                )
            if connection.api_client_secret:
                connection_data["encrypted_api_client_secret"] = encryption_service.encrypt(
                    connection.api_client_secret, user_id
                )
        else:
            if connection.username:
                connection_data["encrypted_username"] = encryption_service.encrypt(
                    connection.username, user_id
                )
            if connection.password:
                connection_data["encrypted_password"] = encryption_service.encrypt(
                    connection.password, user_id
                )
        
        # Insérer dans la base de données
        collection = await db.get_collection("bank_connections")
        result = await collection.insert_one(connection_data)
        connection_data["id"] = str(result.inserted_id)
        
        # Supprimer les credentials chiffrés de la réponse
        for field in ["encrypted_username", "encrypted_password", 
                     "encrypted_api_client_id", "encrypted_api_client_secret"]:
            connection_data.pop(field, None)
        
        return connection_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création de la connexion: {str(e)}"
        )

@router.put("/{connection_id}", response_model=BankConnectionResponse)
async def update_bank_connection(
    connection_id: str,
    updates: BankConnectionUpdate,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Met à jour une connexion bancaire"""
    try:
        user_id = str(current_user["_id"])
        
        # Vérifier que la connexion appartient à l'utilisateur
        collection = await db.get_collection("bank_connections")
        connection = await collection.find_one({
            "_id": ObjectId(connection_id),
            "user_id": user_id
        })
        
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Connexion non trouvée"
            )
        
        # Préparer les mises à jour
        update_data = {"updated_at": datetime.now()}
        
        if updates.nickname is not None:
            update_data["nickname"] = updates.nickname
        if updates.is_active is not None:
            update_data["is_active"] = updates.is_active
        
        # Chiffrer les nouveaux credentials si fournis
        if updates.username:
            update_data["encrypted_username"] = encryption_service.encrypt(
                updates.username, user_id
            )
        if updates.password:
            update_data["encrypted_password"] = encryption_service.encrypt(
                updates.password, user_id
            )
        if updates.api_client_id:
            update_data["encrypted_api_client_id"] = encryption_service.encrypt(
                updates.api_client_id, user_id
            )
        if updates.api_client_secret:
            update_data["encrypted_api_client_secret"] = encryption_service.encrypt(
                updates.api_client_secret, user_id
            )
        
        # Mettre à jour
        await collection.update_one(
            {"_id": ObjectId(connection_id)},
            {"$set": update_data}
        )
        
        # Récupérer la connexion mise à jour
        updated_connection = await collection.find_one(
            {"_id": ObjectId(connection_id)}
        )
        
        updated_connection["id"] = str(updated_connection["_id"])
        del updated_connection["_id"]
        
        # Supprimer les credentials chiffrés
        for field in ["encrypted_username", "encrypted_password", 
                     "encrypted_api_client_id", "encrypted_api_client_secret"]:
            updated_connection.pop(field, None)
        
        return updated_connection
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la mise à jour: {str(e)}"
        )

@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bank_connection(
    connection_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Supprime une connexion bancaire"""
    try:
        user_id = str(current_user["_id"])
        
        # Vérifier que la connexion appartient à l'utilisateur
        collection = await db.get_collection("bank_connections")
        result = await collection.delete_one({
            "_id": ObjectId(connection_id),
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Connexion non trouvée"
            )
        
        # Supprimer également les comptes associés
        accounts_collection = await db.get_collection("bank_accounts")
        await accounts_collection.delete_many({
            "connection_id": connection_id,
            "user_id": user_id
        })
        
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la suppression: {str(e)}"
        )

@router.post("/{connection_id}/sync", response_model=SyncResult)
async def sync_bank_connection(
    connection_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Synchronise une connexion bancaire (récupère comptes et transactions)"""
    user_id = str(current_user["_id"])
    
    # Récupérer la connexion
    connections_collection = await db.get_collection("bank_connections")
    connection = await connections_collection.find_one({
        "_id": ObjectId(connection_id),
        "user_id": user_id
    })
    
    if not connection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Connexion non trouvée"
        )
    
    if not connection.get("is_active"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connexion désactivée"
        )
    
    # Déchiffrer les credentials
    credentials = {}
    if connection.get("connection_type") == "api":
        if connection.get("encrypted_api_client_id"):
            credentials["client_id"] = encryption_service.decrypt(
                connection["encrypted_api_client_id"], user_id
            )
        if connection.get("encrypted_api_client_secret"):
            credentials["client_secret"] = encryption_service.decrypt(
                connection["encrypted_api_client_secret"], user_id
            )
    else:
        if connection.get("encrypted_username"):
            credentials["username"] = encryption_service.decrypt(
                connection["encrypted_username"], user_id
            )
        if connection.get("encrypted_password"):
            credentials["password"] = encryption_service.decrypt(
                connection["encrypted_password"], user_id
            )
    
    # Importer et utiliser le connecteur approprié
    bank = connection.get("bank")
    connection_type = connection.get("connection_type")
    
    if bank == "boursobank":
        if connection_type == "mock":
            from app.services.boursobank import BoursobankMockConnector
            connector = BoursobankMockConnector()
        else:
            from app.services.boursobank import BoursobankConnector
            connector = BoursobankConnector()
    elif bank == "cic":
        if connection_type == "mock":
            from app.services.cic import CICMockConnector
            connector = CICMockConnector()
        else:
            from app.services.cic import CICConnector
            connector = CICConnector()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Banque non supportée: {bank}"
        )
    
    # Se connecter et récupérer les données
    try:
        login_success = await connector.login(
            credentials.get("username", ""),
            credentials.get("password", "")
        )
        
        if not login_success:
            connector.close()
            return SyncResult(
                success=False,
                error="Échec de la connexion: identifiants invalides"
            )
        
        accounts = await connector.get_accounts()
        new_transactions_count = 0
        
        # Sauvegarder les comptes
        accounts_collection = await db.get_collection("bank_accounts")
        transactions_collection = await db.get_collection("transactions")
        
        for account in accounts:
            # Vérifier si le compte existe déjà
            existing_account = await accounts_collection.find_one({
                "connection_id": connection_id,
                "external_id": account["id"]
            })
            
            account_data = {
                "connection_id": connection_id,
                "user_id": user_id,
                "external_id": account["id"],
                "name": account["name"],
                "account_type": account["type"],
                "balance": account["balance"],
                "currency": account.get("currency", "EUR"),
                "iban": account.get("iban"),
                "is_active": True,
                "last_sync": datetime.now(),
                "updated_at": datetime.now()
            }
            
            if existing_account:
                await accounts_collection.update_one(
                    {"_id": existing_account["_id"]},
                    {"$set": account_data}
                )
            else:
                account_data["created_at"] = datetime.now()
                await accounts_collection.insert_one(account_data)
            
            # Récupérer les transactions
            transactions = await connector.get_transactions(account["id"])
            
            # Sauvegarder les transactions
            for trans in transactions:
                # Vérifier si la transaction existe déjà
                existing_trans = await transactions_collection.find_one({
                    "user_id": user_id,
                    "bank_connection_id": connection_id,
                    "external_id": f"{account['id']}_{trans['date']}_{trans['amount']}"
                })
                
                if not existing_trans:
                    # Déterminer le type en fonction du signe
                    is_expense = trans["amount"] < 0
                    transaction_data = {
                        "user_id": user_id,
                        "bank_connection_id": connection_id,
                        "external_id": f"{account['id']}_{trans['date']}_{trans['amount']}",
                        "amount": abs(trans["amount"]),  # Toujours en valeur absolue
                        "description": trans["description"],
                        "date": datetime.fromisoformat(trans["date"]),
                        "type": "expense" if is_expense else "income",
                        "category": None,  # Sera catégorisé par les règles
                        "created_at": datetime.now(),
                        "updated_at": datetime.now()
                    }
                    await transactions_collection.insert_one(transaction_data)
                    new_transactions_count += 1
        
        # Mettre à jour la connexion
        await connections_collection.update_one(
            {"_id": ObjectId(connection_id)},
            {
                "$set": {
                    "last_sync": datetime.now(),
                    "accounts_count": len(accounts)
                }
            }
        )
        
        connector.close()
        
        return SyncResult(
            success=True,
            new_transactions=new_transactions_count,
            updated_accounts=len(accounts)
        )
        
    except Exception as e:
        connector.close()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la synchronisation: {str(e)}"
        )

@router.get("/{connection_id}/accounts", response_model=List[BankAccountResponse])
async def get_bank_accounts(
    connection_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Récupère les comptes d'une connexion bancaire"""
    try:
        user_id = str(current_user["_id"])
        
        collection = await db.get_collection("bank_accounts")
        accounts = await collection.find({
            "connection_id": connection_id,
            "user_id": user_id
        }).to_list(length=100)
        
        for account in accounts:
            account["id"] = str(account["_id"])
            del account["_id"]
        
        return accounts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération des comptes: {str(e)}"
        )
