"""
Gestion des certificats SSL et configuration HTTPS (admin uniquement).
"""

from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from fastapi.responses import FileResponse
from typing import Dict
import os
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

from ..core.permissions import require_admin
from ..routers.auth import get_current_user

router = APIRouter(prefix="/api/admin/ssl", tags=["SSL (Admin)"])

# Chemin vers les certificats
CERTS_DIR = Path(__file__).parent.parent.parent.parent / "certs"
CERT_FILE = CERTS_DIR / "cert.pem"
KEY_FILE = CERTS_DIR / "key.pem"


@router.get("/status")
async def get_ssl_status(current_user: Dict = Depends(require_admin)):
    """
    Récupérer le statut des certificats SSL (admin uniquement).
    """
    try:
        cert_exists = CERT_FILE.exists()
        key_exists = KEY_FILE.exists()
        
        status_info = {
            "https_enabled": cert_exists and key_exists,
            "certificate_exists": cert_exists,
            "key_exists": key_exists,
        }
        
        if cert_exists:
            cert_stat = CERT_FILE.stat()
            cert_info = {
                "path": str(CERT_FILE),
                "size": cert_stat.st_size,
                "modified": datetime.fromtimestamp(cert_stat.st_mtime).isoformat(),
            }
            
            # Utiliser openssl pour extraire les informations du certificat
            try:
                # Extraire le subject
                result = subprocess.run(
                    ["openssl", "x509", "-in", str(CERT_FILE), "-noout", "-subject"],
                    capture_output=True,
                    text=True,
                    check=True
                )
                cert_info["subject"] = result.stdout.strip().replace("subject=", "")
                
                # Extraire l'issuer
                result = subprocess.run(
                    ["openssl", "x509", "-in", str(CERT_FILE), "-noout", "-issuer"],
                    capture_output=True,
                    text=True,
                    check=True
                )
                cert_info["issuer"] = result.stdout.strip().replace("issuer=", "")
                
                # Extraire la date d'expiration
                result = subprocess.run(
                    ["openssl", "x509", "-in", str(CERT_FILE), "-noout", "-enddate"],
                    capture_output=True,
                    text=True,
                    check=True
                )
                enddate_str = result.stdout.strip().replace("notAfter=", "")
                # Parser la date (format: Jan 1 00:00:00 2026 GMT)
                try:
                    expiry_date = datetime.strptime(enddate_str, "%b %d %H:%M:%S %Y %Z")
                    cert_info["expiry_date"] = expiry_date.isoformat()
                    
                    # Calculer les jours restants
                    days_until_expiry = (expiry_date - datetime.now()).days
                    cert_info["days_until_expiry"] = days_until_expiry
                except ValueError:
                    # Si le parsing échoue, garder la date comme string
                    cert_info["expiry_date"] = enddate_str
                    cert_info["days_until_expiry"] = None
                
            except subprocess.CalledProcessError as e:
                cert_info["parse_error"] = f"Erreur lors de la lecture du certificat: {str(e)}"
            except Exception as e:
                cert_info["parse_error"] = str(e)
            
            status_info["certificate_info"] = cert_info
        
        return status_info
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la récupération du statut SSL: {str(e)}"
        )


@router.post("/upload-certificate")
async def upload_certificate(
    certificate: UploadFile = File(...),
    current_user: Dict = Depends(require_admin)
):
    """
    Uploader un nouveau certificat SSL (admin uniquement).
    """
    try:
        # Vérifier que c'est bien un fichier PEM
        if not certificate.filename.endswith('.pem'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier doit être au format .pem"
            )
        
        # Sauvegarder l'ancien certificat si existe
        if CERT_FILE.exists():
            backup_path = CERTS_DIR / f"cert.pem.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            shutil.copy(CERT_FILE, backup_path)
        
        # Créer le répertoire si nécessaire
        CERTS_DIR.mkdir(parents=True, exist_ok=True)
        
        # Écrire le nouveau certificat
        with open(CERT_FILE, 'wb') as f:
            content = await certificate.read()
            f.write(content)
        
        # Permissions sécurisées
        os.chmod(CERT_FILE, 0o644)
        
        return {
            "message": "Certificat uploadé avec succès",
            "path": str(CERT_FILE),
            "size": len(content),
            "restart_required": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'upload du certificat: {str(e)}"
        )


@router.post("/upload-key")
async def upload_key(
    key: UploadFile = File(...),
    current_user: Dict = Depends(require_admin)
):
    """
    Uploader une nouvelle clé privée SSL (admin uniquement).
    """
    try:
        # Vérifier que c'est bien un fichier PEM
        if not key.filename.endswith('.pem'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier doit être au format .pem"
            )
        
        # Sauvegarder l'ancienne clé si existe
        if KEY_FILE.exists():
            backup_path = CERTS_DIR / f"key.pem.backup.{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            shutil.copy(KEY_FILE, backup_path)
        
        # Créer le répertoire si nécessaire
        CERTS_DIR.mkdir(parents=True, exist_ok=True)
        
        # Écrire la nouvelle clé
        with open(KEY_FILE, 'wb') as f:
            content = await key.read()
            f.write(content)
        
        # Permissions très restrictives pour la clé privée
        os.chmod(KEY_FILE, 0o600)
        
        return {
            "message": "Clé privée uploadée avec succès",
            "path": str(KEY_FILE),
            "size": len(content),
            "restart_required": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'upload de la clé: {str(e)}"
        )


@router.post("/regenerate")
async def regenerate_certificates(current_user: Dict = Depends(require_admin)):
    """
    Régénérer les certificats SSL auto-signés (admin uniquement).
    """
    try:
        import subprocess
        
        # Chemin vers le script de génération
        script_path = Path(__file__).parent.parent.parent.parent / "scripts" / "generate_ssl_certs.sh"
        
        if not script_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Script de génération de certificats non trouvé"
            )
        
        # Exécuter le script
        result = subprocess.run(
            [str(script_path)],
            capture_output=True,
            text=True,
            check=True
        )
        
        return {
            "message": "Certificats régénérés avec succès",
            "output": result.stdout,
            "restart_required": True
        }
        
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération des certificats: {e.stderr}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur: {str(e)}"
        )


@router.get("/download-certificate")
async def download_certificate(current_user: Dict = Depends(require_admin)):
    """
    Télécharger le certificat SSL actuel (admin uniquement).
    """
    if not CERT_FILE.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certificat non trouvé"
        )
    
    return FileResponse(
        path=CERT_FILE,
        filename="cert.pem",
        media_type="application/x-pem-file"
    )
