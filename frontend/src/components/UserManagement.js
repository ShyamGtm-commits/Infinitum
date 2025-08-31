import React, { useState, useEffect } from 'react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/admin/users/', {
                credentials: 'include',
            });

            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                setError('Failed to load users');
            }
        } catch (error) {
            console.error('Error fetching users', error);
            setError('Error loading users');
        } finally {
            setLoading(false);
        }
    };

    const updateUserRole = async (userId, newRole) => {
        try {
            const response = await fetch(`http://localhost:8000/api/admin/users/${userId}/update_role/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ user_type: newRole }),
            });

            if (response.ok) {
                alert('User role updated successfully');
                fetchUsers(); // Refresh the list
            } else {
                const errorData = await response.json();
                alert(errorData.error || 'Failed to update user role');
            }
        } catch (error) {
            console.error('Update role error:', error);
            alert('Error updating user role');
        }
    };

    if (loading) {
        return <div className="text-center mt-4">Loading users...</div>;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    return (
        <div>
            <h4>User Management</h4>

            <div className="card">
                <div className="card-body">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Borrowed Books</th>
                                <th>Current Borrows</th>
                                <th>Total Fines</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.user_type === 'admin' ? 'bg-danger' :
                                                user.user_type === 'librarian' ? 'bg-warning' : 'bg-info'
                                            }`}>
                                            {user.user_type}
                                        </span>
                                    </td>
                                    <td>{user.borrowed_count}</td>
                                    <td>{user.current_borrows}</td>
                                    <td>₹{user.total_fines}</td>
                                    <td>
                                        <select
                                            className="form-select form-select-sm"
                                            value={user.user_type}
                                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                                        >
                                            <option value="student">Student</option>
                                            <option value="librarian">Librarian</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;