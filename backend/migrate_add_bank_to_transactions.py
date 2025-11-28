"""
Script de migration pour ajouter bank_connection_id aux transactions existantes.
Ce script attribue les transactions à une connexion bancaire par défaut.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

MONGODB_URI = "mongodb://localhost:27017"
DB_NAME = "budget_db"

async def migrate():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print("🔄 Début de la migration...")
    
    # Récupérer toutes les connexions bancaires
    connections = await db.bank_connections.find().to_list(length=100)
    
    if not connections:
        print("⚠️  Aucune connexion bancaire trouvée. Créez d'abord une connexion bancaire.")
        return
    
    print(f"✅ {len(connections)} connexion(s) bancaire(s) trouvée(s):")
    for i, conn in enumerate(connections, 1):
        print(f"  {i}. {conn.get('nickname', conn.get('bank'))} ({conn.get('bank')})")
    
    # Demander quelle connexion utiliser par défaut
    choice = input(f"\nQuelle connexion utiliser pour les transactions existantes ? (1-{len(connections)}, ou 0 pour ignorer): ")
    
    if choice == "0":
        print("❌ Migration annulée.")
        return
    
    try:
        index = int(choice) - 1
        selected_connection = connections[index]
        connection_id = str(selected_connection["_id"])
    except (ValueError, IndexError):
        print("❌ Choix invalide.")
        return
    
    print(f"\n🔄 Attribution des transactions à: {selected_connection.get('nickname', selected_connection.get('bank'))}")
    
    # Compter les transactions sans bank_connection_id
    count_without = await db.transactions.count_documents({
        "bank_connection_id": {"$exists": False}
    })
    
    if count_without == 0:
        print("✅ Toutes les transactions ont déjà un bank_connection_id.")
        return
    
    print(f"📊 {count_without} transaction(s) à mettre à jour...")
    
    # Mettre à jour toutes les transactions sans bank_connection_id
    result = await db.transactions.update_many(
        {"bank_connection_id": {"$exists": False}},
        {"$set": {"bank_connection_id": connection_id}}
    )
    
    print(f"✅ Migration terminée: {result.modified_count} transaction(s) mise(s) à jour.")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate())
