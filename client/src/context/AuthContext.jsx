import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkMe = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    const { data } = await authAPI.getMe();
                    const normalized = { ...data, _id: data._id || data.id, id: data.id || data._id };
                    setUser(normalized);
                    localStorage.setItem('user', JSON.stringify(normalized));
                } catch (error) {
                    console.error('Session verify failed:', error);
                    localStorage.removeItem('user');
                    localStorage.removeItem('accessToken');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkMe();
    }, []);

    const loginStudent = async (email, password) => {
        const { data } = await authAPI.loginStudent({ email, password });
        const normalized = { ...data.user, _id: data.user._id || data.user.id, id: data.user.id || data.user._id };
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);
        return data;
    };

    const loginManagement = async (email, password) => {
        const { data } = await authAPI.loginManagement({ email, password });
        const normalized = { ...data.user, _id: data.user._id || data.user.id, id: data.user.id || data.user._id };
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(normalized));
        setUser(normalized);
        return data;
    };

    const signupStudent = async (formData) => {
        const { data } = await authAPI.signupStudent(formData);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    };

    const signupManagement = async (email, password) => {
        const { data } = await authAPI.signupManagement({ email, password });
        return data;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
    };

    const value = {
        user,
        loading,
        loginStudent,
        loginManagement,
        signupStudent,
        signupManagement,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
