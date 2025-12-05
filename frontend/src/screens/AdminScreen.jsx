import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import UserManagement from '../components/admin/UserManagement';
import SSLManagement from '../components/admin/SSLManagement';

export default function AdminScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');

  // Redirection si l'utilisateur n'est pas admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    { id: 'users', label: 'Utilisateurs', icon: '👥' },
    { id: 'ssl', label: 'Certificats SSL', icon: '🔐' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Administration
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gestion des utilisateurs et des certificats SSL
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium
                    border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'ssl' && <SSLManagement />}
          </div>
        </div>
      </div>
    </div>
  );
}
