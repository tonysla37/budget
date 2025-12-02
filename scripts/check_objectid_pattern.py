#!/usr/bin/env python3
"""
Script de vérification des patterns ObjectId.

Vérifie que tous les appels ObjectId() sont précédés d'une vérification isinstance().
"""

import re
import sys
from pathlib import Path


def check_objectid_pattern(file_path: Path) -> list[str]:
    """
    Vérifie qu'un fichier Python utilise le pattern isinstance avant ObjectId().
    
    Returns:
        Liste des erreurs trouvées
    """
    errors = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Rechercher les appels ObjectId()
    objectid_pattern = r'ObjectId\([^)]+\)'
    
    lines = content.split('\n')
    for i, line in enumerate(lines, start=1):
        # Ignorer les imports
        if 'from bson import ObjectId' in line or 'import ObjectId' in line:
            continue
        
        # Ignorer les commentaires
        if line.strip().startswith('#'):
            continue
        
        # Rechercher ObjectId()
        if re.search(objectid_pattern, line):
            # Vérifier si c'est dans un contexte de vérification isinstance
            # On regarde les 5 lignes précédentes
            context_lines = lines[max(0, i-6):i]
            context = '\n'.join(context_lines)
            
            # Pattern acceptable : isinstance() dans le contexte
            if 'isinstance' not in context:
                # Exceptions : assignation directe depuis _id
                if '_id' in line and '=' in line:
                    continue
                
                # Exception : dans un test
                if 'test_' in str(file_path):
                    continue
                
                errors.append(
                    f"{file_path}:{i}: ObjectId() sans isinstance() - "
                    f"Utiliser le pattern: if isinstance(value, str): value = ObjectId(value)"
                )
    
    return errors


def main():
    """Point d'entrée du script."""
    backend_dir = Path(__file__).parent.parent / 'app'
    
    all_errors = []
    
    # Parcourir tous les fichiers Python dans routers et services
    for pattern in ['routers/**/*.py', 'services/**/*.py']:
        for file_path in backend_dir.glob(pattern):
            if file_path.name == '__init__.py':
                continue
            
            errors = check_objectid_pattern(file_path)
            all_errors.extend(errors)
    
    if all_errors:
        print("❌ Erreurs de pattern ObjectId détectées:")
        for error in all_errors:
            print(f"  {error}")
        print("\n💡 Utilisez le pattern recommandé:")
        print("  if isinstance(value, str):")
        print("      value = ObjectId(value)")
        return 1
    
    print("✅ Tous les patterns ObjectId sont corrects")
    return 0


if __name__ == '__main__':
    sys.exit(main())
