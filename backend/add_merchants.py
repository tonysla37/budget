#!/usr/bin/env python3
"""
Script pour ajouter des merchants aux transactions existantes
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

# Mapping de mots-clés vers merchants
MERCHANT_MAPPING = {
    # Alimentaire
    r'courses': ['Carrefour', 'Auchan', 'Leclerc', 'Intermarché', 'Monoprix'],
    r'carrefour': ['Carrefour'],
    r'auchan': ['Auchan'],
    r'supermarché|supermarche': ['Carrefour', 'Auchan', 'Casino'],
    
    # Restaurants
    r'restaurant': ['Restaurant Le Gourmet', 'Brasserie du Coin', 'La Table Ronde'],
    r'déjeuner|dejeuner|dîner|diner': ['Restaurant Le Gourmet'],
    r'pizza': ['Pizza Hut', 'Domino\'s Pizza'],
    r'burger': ['McDonald\'s', 'Burger King', 'Five Guys'],
    r'kebab': ['Kebab House'],
    r'sushi': ['Sushi Shop', 'Planet Sushi'],
    
    # Transport
    r'train|sncf': ['SNCF'],
    r'essence|carburant': ['Total', 'Shell', 'BP', 'Esso'],
    r'total': ['Total'],
    r'shell': ['Shell'],
    r'métro|metro|bus|navigo|ratp': ['RATP'],
    r'uber|taxi': ['Uber', 'G7 Taxi'],
    r'parking': ['Parking Indigo', 'Q-Park'],
    
    # Loisirs
    r'cinéma|cinema|ugc': ['UGC Ciné', 'Pathé', 'Gaumont'],
    r'théâtre|theatre': ['Théâtre de la Ville'],
    r'concert|spectacle': ['Zénith', 'AccorArena'],
    r'sport|gym|fitness': ['Keep Cool', 'Basic Fit', 'Neoness'],
    r'livre|librairie': ['Fnac', 'Cultura'],
    
    # Services
    r'électricité|electricite|edf': ['EDF'],
    r'eau': ['Veolia'],
    r'internet|box|orange|free': ['Orange', 'Free', 'SFR', 'Bouygues'],
    r'téléphone|telephone|mobile': ['Orange', 'Free', 'SFR', 'Bouygues'],
    r'netflix|streaming': ['Netflix', 'Prime Video', 'Disney+'],
    r'spotify|musique': ['Spotify', 'Deezer', 'Apple Music'],
    
    # Santé
    r'pharmacie': ['Pharmacie du Centre'],
    r'médecin|medecin|docteur': ['Cabinet Médical'],
    r'dentiste': ['Cabinet Dentaire'],
    
    # Revenus
    r'salaire': ['Entreprise XYZ', 'Mon Employeur'],
    r'freelance|prestation': ['Client Freelance'],
}

async def add_merchants_to_transactions():
    """Ajoute des merchants aux transactions qui n'en ont pas"""
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    import re
    
    # Récupérer toutes les transactions
    transactions = await db.transactions.find({}).to_list(None)
    
    updated_count = 0
    
    for transaction in transactions:
        # Si la transaction a déjà un merchant, on saute
        if transaction.get('merchant'):
            continue
            
        description = transaction.get('description', '').lower()
        merchant = None
        
        # Chercher un merchant correspondant
        for pattern, merchants in MERCHANT_MAPPING.items():
            if re.search(pattern, description):
                # Prendre le premier merchant de la liste
                merchant = merchants[0]
                break
        
        # Si on a trouvé un merchant, mettre à jour la transaction
        if merchant:
            await db.transactions.update_one(
                {'_id': transaction['_id']},
                {'$set': {'merchant': merchant}}
            )
            updated_count += 1
            print(f"✓ '{transaction.get('description')}' → {merchant}")
    
    print(f"\n{updated_count} transactions mises à jour avec des merchants")
    client.close()

if __name__ == "__main__":
    asyncio.run(add_merchants_to_transactions())
