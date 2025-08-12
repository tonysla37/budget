import bcrypt

# Le mot de passe en clair
password = "password123"
# Le hash stocké dans test_data.json
hashed = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"

print(f"Mot de passe en clair: {password}")
print(f"Hash: {hashed}")

try:
    # Vérifier si le mot de passe correspond au hash
    result = bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    print(f"Résultat de la vérification: {result}")
except Exception as e:
    print(f"Erreur lors de la vérification: {e}")

# Générer un nouveau hash pour le mot de passe
try:
    new_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    print(f"Nouveau hash généré: {new_hash.decode('utf-8')}")
    
    # Vérifier le nouveau hash
    result = bcrypt.checkpw(password.encode('utf-8'), new_hash)
    print(f"Vérification du nouveau hash: {result}")
except Exception as e:
    print(f"Erreur lors de la génération du hash: {e}") 