import { useState, useEffect } from 'react';
import { API_CONFIG, getAuthToken } from '../../config/api.config';

export default function SSLManagement() {
  const [certificateStatus, setCertificateStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchCertificateStatus();
  }, []);

  const fetchCertificateStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/ssl/status`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du statut SSL');
      }

      const data = await response.json();
      setCertificateStatus(data);
    } catch (err) {
      setError(err.message);
      console.error('Erreur fetchCertificateStatus:', err);
    } finally {
      setLoading(false);
    }
  };

  const uploadCertificate = async (file) => {
    try {
      setUploading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append('certificate', file);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/ssl/upload-certificate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'upload du certificat');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: data.message });
      await fetchCertificateStatus();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      console.error('Erreur uploadCertificate:', err);
    } finally {
      setUploading(false);
    }
  };

  const uploadKey = async (file) => {
    try {
      setUploading(true);
      setMessage(null);

      const formData = new FormData();
      formData.append('key', file);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/ssl/upload-key`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de l\'upload de la clé');
      }

      const data = await response.json();
      setMessage({ type: 'success', text: data.message });
      await fetchCertificateStatus();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      console.error('Erreur uploadKey:', err);
    } finally {
      setUploading(false);
    }
  };

  const regenerateCertificates = async () => {
    if (!confirm('Régénérer les certificats auto-signés ? Les certificats actuels seront sauvegardés.')) {
      return;
    }

    try {
      setUploading(true);
      setMessage(null);

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/ssl/regenerate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur lors de la régénération');
      }

      const data = await response.json();
      setMessage({ 
        type: 'warning', 
        text: `${data.message}\n⚠️ Veuillez redémarrer les services frontend et backend.` 
      });
      await fetchCertificateStatus();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
      console.error('Erreur regenerateCertificates:', err);
    } finally {
      setUploading(false);
    }
  };

  const downloadCertificate = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/api/admin/ssl/download-certificate`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cert.pem';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Erreur: ${err.message}`);
      console.error('Erreur downloadCertificate:', err);
    }
  };

  const handleFileUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;

    if (type === 'certificate') {
      uploadCertificate(file);
    } else if (type === 'key') {
      uploadKey(file);
    }

    // Reset input
    event.target.value = '';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={fetchCertificateStatus}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const daysUntilExpiry = certificateStatus?.certificate_info?.days_until_expiry;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry < 30;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
              : message.type === 'warning'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="whitespace-pre-line">{message.text}</div>
          <button
            onClick={() => setMessage(null)}
            className="mt-2 text-sm underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Certificate Status */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          📜 Statut du certificat SSL
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Certificat présent:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {certificateStatus?.certificate_exists ? '✅ Oui' : '❌ Non'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Clé privée présente:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {certificateStatus?.key_exists ? '✅ Oui' : '❌ Non'}
            </span>
          </div>

          {certificateStatus?.certificate_info && (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3"></div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Émis pour:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {certificateStatus.certificate_info.subject}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Émis par:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {certificateStatus.certificate_info.issuer}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Valide jusqu'au:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(certificateStatus.certificate_info.expiry_date).toLocaleDateString(
                    'fr-FR',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Jours restants:</span>
                <span
                  className={`font-bold ${
                    isExpired
                      ? 'text-red-600 dark:text-red-400'
                      : isExpiringSoon
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}
                >
                  {isExpired ? '⚠️ Expiré' : `${daysUntilExpiry} jours`}
                  {isExpiringSoon && !isExpired && ' ⚠️'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Certificate */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📤 Uploader un certificat
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Fichier .pem ou .crt
          </p>
          <label className="block">
            <input
              type="file"
              accept=".pem,.crt"
              onChange={(e) => handleFileUpload(e, 'certificate')}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 dark:file:bg-blue-900/20
                file:text-blue-700 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        </div>

        {/* Upload Key */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🔑 Uploader une clé privée
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Fichier .pem ou .key
          </p>
          <label className="block">
            <input
              type="file"
              accept=".pem,.key"
              onChange={(e) => handleFileUpload(e, 'key')}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 dark:file:bg-blue-900/20
                file:text-blue-700 dark:file:text-blue-300
                hover:file:bg-blue-100 dark:hover:file:bg-blue-900/40
                disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </label>
        </div>
      </div>

      {/* Additional Actions */}
      <div className="flex gap-4">
        <button
          onClick={regenerateCertificates}
          disabled={uploading}
          className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🔄 Régénérer auto-signés
        </button>

        <button
          onClick={downloadCertificate}
          disabled={!certificateStatus?.certificate_exists}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          💾 Télécharger certificat
        </button>

        <button
          onClick={fetchCertificateStatus}
          disabled={uploading}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ <strong>Important:</strong> Après avoir uploadé de nouveaux certificats ou régénéré les certificats,
          vous devez redémarrer les services frontend et backend pour que les changements prennent effet.
        </p>
      </div>
    </div>
  );
}
