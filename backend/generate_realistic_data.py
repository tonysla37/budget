#!/usr/bin/env python3
"""
Script pour générer 6 mois de données de transactions réalistes pour un cadre standard
"""
import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
import random

# Salaire mensuel d'un cadre standard
SALAIRE_MENSUEL = 3200

# Catégories et leurs sous-catégories avec merchants et montants typiques
CATEGORIES_DATA = {
    "Alimentation": {
        "Courses": {
            "merchants": ["Carrefour", "Auchan", "Leclerc", "Lidl", "Monoprix", "Franprix", "Intermarché"],
            "montant_min": 15,
            "montant_max": 120,
            "frequence_par_mois": 12  # ~3 fois par semaine
        },
        "Restaurant": {
            "merchants": ["McDonald's", "KFC", "Burger King", "Subway", "Starbucks", "Paul", "La Mie Câline", 
                         "Pizza Hut", "Domino's", "Sushi Shop", "Big Mamma", "Hippopotamus", "Flunch"],
            "montant_min": 8,
            "montant_max": 65,
            "frequence_par_mois": 8
        }
    },
    "Transport": {
        "Essence": {
            "merchants": ["Total", "Shell", "BP", "Esso", "Intermarché"],
            "montant_min": 40,
            "montant_max": 80,
            "frequence_par_mois": 4
        },
        "Métro/Bus": {
            "merchants": ["RATP", "Navigo", "Ile-de-France Mobilités"],
            "montant_min": 75,
            "montant_max": 85,
            "frequence_par_mois": 1  # Abonnement mensuel
        }
    },
    "Logement": {
        "Loyer": {
            "merchants": ["Virement loyer"],
            "montant_min": 950,
            "montant_max": 950,
            "frequence_par_mois": 1
        },
        "Électricité": {
            "merchants": ["EDF", "Engie", "Total Energie"],
            "montant_min": 45,
            "montant_max": 85,
            "frequence_par_mois": 1
        },
        "Eau": {
            "merchants": ["Veolia", "Suez"],
            "montant_min": 25,
            "montant_max": 35,
            "frequence_par_mois": 0.33  # Tous les 3 mois
        }
    },
    "Loisirs": {
        "Cinéma": {
            "merchants": ["UGC", "Pathé", "Gaumont", "MK2"],
            "montant_min": 12,
            "montant_max": 28,
            "frequence_par_mois": 2
        },
        "Sport": {
            "merchants": ["Keep Cool", "Basic Fit", "Neoness", "L'Orange Bleue", "Décathlon"],
            "montant_min": 15,
            "montant_max": 50,
            "frequence_par_mois": 3
        },
        "Streaming": {
            "merchants": ["Netflix", "Prime Video", "Disney+", "Spotify", "Deezer"],
            "montant_min": 8,
            "montant_max": 16,
            "frequence_par_mois": 1
        }
    },
    "Santé": {
        "Pharmacie": {
            "merchants": ["Pharmacie", "Pharmacie du Centre", "Pharmacie Lafayette"],
            "montant_min": 8,
            "montant_max": 45,
            "frequence_par_mois": 2
        },
        "Médecin": {
            "merchants": ["Cabinet médical", "Doctolib"],
            "montant_min": 25,
            "montant_max": 60,
            "frequence_par_mois": 0.5
        }
    },
    "Achats": {
        "Vêtements": {
            "merchants": ["Zara", "H&M", "Uniqlo", "Décathlon", "Kiabi", "Celio"],
            "montant_min": 25,
            "montant_max": 150,
            "frequence_par_mois": 2
        },
        "High-tech": {
            "merchants": ["Fnac", "Darty", "Boulanger", "Amazon", "Apple Store"],
            "montant_min": 30,
            "montant_max": 800,
            "frequence_par_mois": 0.5
        },
        "Livres": {
            "merchants": ["Fnac", "Cultura", "Amazon", "Decitre"],
            "montant_min": 10,
            "montant_max": 35,
            "frequence_par_mois": 1
        }
    },
    "Services": {
        "Internet": {
            "merchants": ["Orange", "Free", "SFR", "Bouygues"],
            "montant_min": 25,
            "montant_max": 45,
            "frequence_par_mois": 1
        },
        "Mobile": {
            "merchants": ["Orange", "Free", "SFR", "Bouygues", "RED", "Sosh"],
            "montant_min": 10,
            "montant_max": 30,
            "frequence_par_mois": 1
        },
        "Assurance": {
            "merchants": ["AXA", "Allianz", "MAIF", "MAAF"],
            "montant_min": 45,
            "montant_max": 85,
            "frequence_par_mois": 1
        }
    }
}

# Descriptions réalistes par type de transaction
DESCRIPTIONS = {
    "Courses": [
        "Courses hebdomadaires", "Courses du weekend", "Courses alimentaires", 
        "Supermarché", "Courses de la semaine", "Provisions"
    ],
    "Restaurant": [
        "Déjeuner", "Dîner restaurant", "Fast-food", "Pause déjeuner", 
        "Restaurant avec amis", "Sortie restaurant", "Brunch", "Petit-déjeuner", "Café"
    ],
    "Essence": [
        "Plein d'essence", "Carburant", "Station service", "Essence voiture"
    ],
    "Métro/Bus": [
        "Pass Navigo", "Abonnement transport", "Forfait mensuel transport"
    ],
    "Loyer": [
        "Loyer mensuel", "Loyer appartement"
    ],
    "Électricité": [
        "Facture électricité", "EDF mensuel", "Électricité"
    ],
    "Eau": [
        "Facture eau", "Eau trimestrielle"
    ],
    "Cinéma": [
        "Séance cinéma", "Film", "Cinéma", "Place de cinéma"
    ],
    "Sport": [
        "Salle de sport", "Abonnement sport", "Fitness", "Équipement sport"
    ],
    "Streaming": [
        "Abonnement Netflix", "Abonnement streaming", "Spotify Premium", "Disney+"
    ],
    "Pharmacie": [
        "Médicaments", "Pharmacie", "Produits pharmaceutiques"
    ],
    "Médecin": [
        "Consultation médecin", "Visite médicale", "Docteur"
    ],
    "Vêtements": [
        "Vêtements", "Shopping vêtements", "Habits", "Nouvelle garde-robe"
    ],
    "High-tech": [
        "Électronique", "Gadget", "Accessoire tech", "Matériel informatique"
    ],
    "Livres": [
        "Livre", "Romans", "Bande dessinée", "Lecture"
    ],
    "Internet": [
        "Box internet", "Abonnement internet", "Fibre optique"
    ],
    "Mobile": [
        "Forfait mobile", "Abonnement téléphone", "Forfait 4G"
    ],
    "Assurance": [
        "Assurance habitation", "Assurance auto", "Prime d'assurance"
    ]
}

async def generate_realistic_data():
    """Génère 6 mois de données réalistes"""
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = client[settings.MONGODB_DB_NAME]
    
    # Récupérer les collections
    users_collection = db.users
    categories_collection = db.categories
    transactions_collection = db.transactions
    
    # Récupérer l'utilisateur
    user = await users_collection.find_one({})
    if not user:
        print("❌ Aucun utilisateur trouvé")
        client.close()
        return
    
    print(f"✓ Utilisateur trouvé: {user.get('email')}")
    
    # Récupérer toutes les catégories
    categories = {}
    async for category in categories_collection.find({"user_id": user["_id"]}):
        categories[category["name"]] = category
    
    print(f"✓ {len(categories)} catégories trouvées")
    
    # Supprimer les anciennes transactions
    result = await transactions_collection.delete_many({"user_id": user["_id"]})
    print(f"✓ {result.deleted_count} anciennes transactions supprimées")
    
    # Générer les transactions sur 6 mois
    transactions = []
    now = datetime.utcnow()
    
    # Pour chaque mois (6 mois en arrière)
    for month_offset in range(6):
        target_month = now - timedelta(days=30 * month_offset)
        month_start = datetime(target_month.year, target_month.month, 1)
        
        if target_month.month == 12:
            month_end = datetime(target_month.year + 1, 1, 1)
        else:
            month_end = datetime(target_month.year, target_month.month + 1, 1)
        
        print(f"\n📅 Génération pour {target_month.strftime('%B %Y')}...")
        
        # Salaire en début de mois
        salary_date = month_start + timedelta(days=1)
        transactions.append({
            "user_id": user["_id"],
            "date": salary_date,
            "amount": SALAIRE_MENSUEL,
            "description": "Salaire mensuel",
            "merchant": "Entreprise XYZ",
            "is_expense": False,
            "category_id": categories.get("Salaire", {}).get("_id"),
            "created_at": datetime.utcnow()
        })
        
        # Générer les dépenses pour chaque catégorie
        for parent_name, subcategories in CATEGORIES_DATA.items():
            if parent_name not in categories:
                continue
                
            for subcat_name, config in subcategories.items():
                if subcat_name not in categories:
                    continue
                
                # Nombre de transactions ce mois
                num_transactions = int(config["frequence_par_mois"])
                
                # Ajouter de la variation (parfois +/- 1 transaction)
                variation = random.choice([-1, 0, 0, 1])
                num_transactions = max(0, num_transactions + variation)
                
                for _ in range(num_transactions):
                    # Date aléatoire dans le mois
                    days_in_month = (month_end - month_start).days
                    random_day = random.randint(1, days_in_month - 1)
                    transaction_date = month_start + timedelta(days=random_day)
                    
                    # Montant aléatoire dans la fourchette
                    amount = round(random.uniform(config["montant_min"], config["montant_max"]), 2)
                    
                    # Merchant et description aléatoires
                    merchant = random.choice(config["merchants"])
                    description = random.choice(DESCRIPTIONS.get(subcat_name, [subcat_name]))
                    
                    transactions.append({
                        "user_id": user["_id"],
                        "date": transaction_date,
                        "amount": amount,
                        "description": description,
                        "merchant": merchant,
                        "is_expense": True,
                        "category_id": categories[subcat_name]["_id"],
                        "created_at": datetime.utcnow()
                    })
        
        month_expenses = sum(t["amount"] for t in transactions if t["is_expense"] and month_start <= t["date"] < month_end)
        print(f"  → {len([t for t in transactions if month_start <= t['date'] < month_end])} transactions")
        print(f"  → Dépenses: {month_expenses:.2f}€")
        print(f"  → Économies: {SALAIRE_MENSUEL - month_expenses:.2f}€")
    
    # Insérer toutes les transactions
    if transactions:
        await transactions_collection.insert_many(transactions)
        print(f"\n✅ {len(transactions)} transactions créées avec succès!")
        
        # Statistiques globales
        total_income = sum(t["amount"] for t in transactions if not t["is_expense"])
        total_expenses = sum(t["amount"] for t in transactions if t["is_expense"])
        print(f"\n📊 Statistiques sur 6 mois:")
        print(f"  • Revenus totaux: {total_income:.2f}€")
        print(f"  • Dépenses totales: {total_expenses:.2f}€")
        print(f"  • Économies: {total_income - total_expenses:.2f}€")
        print(f"  • Taux d'épargne: {((total_income - total_expenses) / total_income * 100):.1f}%")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(generate_realistic_data())
