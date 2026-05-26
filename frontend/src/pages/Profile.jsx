import React, { useContext } from 'react';
import { AuthContext } from '../shared/context/AuthContext';
import CustomerProfileView from '../components/profile/CustomerProfileView';
import EmployeeProfileView from '../components/profile/EmployeeProfileView';

const Profile = () => {
    const { user } = useContext(AuthContext);

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
