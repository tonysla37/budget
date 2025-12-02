# 🔐 Identifiants de Test

## Compte de test par défaut

```
Email    : test@example.com
Password : test
```

## Informations importantes

- Ces identifiants sont utilisés pour le développement et les tests
- Le mot de passe est volontairement simple pour faciliter les tests
- **Ne pas modifier** sans raison valable

## Changer le mot de passe

Si vous devez changer le mot de passe :

```bash
cd /home/lab-telegraf/code/budget
source venv/bin/activate
python scripts/change_password.py test@example.com <nouveau_mot_de_passe>
```

Le script met à jour :
- ✅ La base de données MongoDB
- ✅ Le fichier YAML `scripts/test_data/users.yaml`

## Problèmes de connexion

Si vous obtenez l'erreur "Email ou mot de passe incorrect" :

1. Vérifiez que vous utilisez le bon mot de passe (par défaut: `test`)
2. Vérifiez que le backend est démarré : `./scripts/deploy.sh`
3. Vérifiez les logs : `tail -f logs/backend.log`

## Version bcrypt

Le projet utilise **bcrypt 4.0.1** pour la compatibilité avec passlib 1.7.4.
Ne pas installer bcrypt >= 5.0.0 (incompatible).
