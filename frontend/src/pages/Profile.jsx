import React, { useContext } from 'react';
import { AuthContext } from '../shared/context/AuthContext';
import CustomerProfileView from '../components/profile/CustomerProfileView';
import EmployeeProfileView from '../components/profile/EmployeeProfileView';
import api from '../shared/services/api';
import { useRealtimeEvent } from '../shared/realtime/useRealtimeEvent.js';

const Profile = () => {
    const { user, updateUser } = useContext(AuthContext);

    useRealtimeEvent(
      (event) => ['customer:changed', 'auth:changed'].includes(event.event),
      async () => {
        try {
          const { data } = await api.get('/auth/me');
          updateUser((prev) => prev ? { ...prev, ...data.user } : prev);
        } catch {
          // ignore transient sync issues; the next auth change will reconcile
        }
      }
    );

    if (!user) {
        return <div className="text-center mt-20">Loading profile...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>
            {user.role === 'customer' ? (
                <CustomerProfileView user={user} />
            ) : (
                <EmployeeProfileView user={user} />
            )}
        </div>
    );
};

export default Profile;
