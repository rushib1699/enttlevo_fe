import React, { useState } from 'react'
import UserManagement from './UserManagement'
import RoleManagement from './RoleManagement'
import TeamManagement from './TeamManagement'
import { User, Shield, Users } from 'lucide-react'

const UserRoleManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="">
      <div className="w-full">
        {/* Custom Professional Tab Design */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => setActiveTab('users')}
              className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'users'
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <User className="w-4 h-4" />
              User Management
              {activeTab === 'users' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('roles')}
              className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'roles'
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Shield className="w-4 h-4" />
              Role & Permission Management
              {activeTab === 'roles' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
              )}
            </button>
            
            <button
              onClick={() => setActiveTab('teams')}
              className={`relative flex items-center gap-2 px-1 py-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'teams'
                  ? 'text-orange-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Team Management
              {activeTab === 'teams' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-600"></div>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-2">
          {activeTab === 'users' && (
            <div className="h-full">
              <UserManagement />
            </div>
          )}
          
          {activeTab === 'roles' && (
            <div className="h-full">
              <RoleManagement />
            </div>
          )}
          
          {activeTab === 'teams' && (
            <div className="h-full">
              <TeamManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserRoleManagement