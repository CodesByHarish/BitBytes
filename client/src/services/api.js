import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add access token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle token refresh on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {}, {
                    withCredentials: true
                });
                localStorage.setItem('accessToken', data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI = {
    signupStudent: (data) => api.post('/auth/signup/student', data),
    signupManagement: (data) => api.post('/auth/signup/management', data),
    loginStudent: (data) => api.post('/auth/login/student', data),
    loginManagement: (data) => api.post('/auth/login/management', data),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh-token'),
    // Admin endpoints
    getPendingUsers: () => api.get('/admin/pending'),
    approveUser: (id, data) => api.put(`/admin/approve/${id}`, data),
    getStaff: () => api.get('/admin/staff'),
    updateStaffRole: (id, data) => api.put(`/admin/staff/${id}/role`, data),

    // Complaint endpoints
    createComplaint: (data) => api.post('/complaints', data),
    getMyComplaints: () => api.get('/complaints/my'),
    getPublicComplaints: () => api.get('/complaints/public'),
    getAllComplaints: (tab) => api.get('/complaints', { params: { tab } }),
    assignCaretaker: (id, caretaker, caretakerId) => api.put(`/complaints/${id}/assign`, { caretaker, caretakerId }),
    updateComplaintStatus: (id, status, comment) => api.put(`/complaints/${id}/status`, { status, comment }),
    updateComplaintPriority: (id, priority, comment) => api.put(`/complaints/${id}/priority`, { priority, comment }),
    mergeComplaints: (primaryId, duplicateIds) => api.post('/complaints/merge', { primaryId, duplicateIds }),

    // Announcement endpoints
    getAnnouncements: () => api.get('/announcements'),
    createAnnouncement: (data) => api.post('/announcements', data),
    deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),

    // Lost & Found endpoints
    getLostFoundItems: () => api.get('/lost-found'),
    reportLostFoundItem: (data) => api.post('/lost-found', data),
    claimItem: (id, claimMessage) => api.put(`/lost-found/${id}/claim`, { claimMessage }),
    moderateClaim: (id, action) => api.put(`/lost-found/${id}/moderate`, { action }),
    deleteLostFoundItem: (id) => api.delete(`/lost-found/${id}`),

    // Social & Comment endpoints
    upvoteComplaint: (id) => api.post(`/complaints/${id}/upvote`),
    upvoteAnnouncement: (id) => api.post(`/announcements/${id}/upvote`),
    getComments: (type, id) => api.get(`/comments/${type}/${id}`),
    addComment: (data) => api.post('/comments', data),
    reactToComment: (id, emoji = '❤️') => api.post(`/comments/${id}/react`, { emoji })
};

export default api;
