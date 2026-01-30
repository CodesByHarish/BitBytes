import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ||
    (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

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
        console.log(`[API REQUEST] ${config.method.toUpperCase()} ${config.url}`, config.data || '');
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('[API REQUEST ERROR]', error);
        return Promise.reject(error);
    }
);

// Handle token refresh on 401
api.interceptors.response.use(
    (response) => {
        console.log(`[API SUCCESS] ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
        return response;
    },
    async (error) => {
        console.error(`[API ERROR] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        const originalRequest = error.config;

        // Skip refresh logic for login and signup routes
        const isAuthRoute = originalRequest.url.includes('/auth/login') ||
            originalRequest.url.includes('/auth/signup') ||
            originalRequest.url.includes('/auth/refresh-token');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
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
    deleteComplaint: (id) => api.delete(`/complaints/${id}`),
    bulkDeleteComplaints: (ids) => api.post('/complaints/delete-bulk', { ids }),
    cleanupComplaints: () => api.post('/complaints/cleanup'),

    // Announcement endpoints
    getAnnouncements: () => api.get('/announcements'),
    createAnnouncement: (data) => api.post('/announcements', data),
    deleteAnnouncement: (id) => api.delete(`/announcements/${id}`),


    // Lost & Found endpoints
    getLostFoundItems: () => api.get('/lost-found'),
    reportLostFoundItem: (data) => api.post('/lost-found', data),
    claimItem: (id, claimMessage) => api.put(`/lost-found/${id}/claim`, { claimMessage }),
    moderateClaim: (id, action) => api.put(`/lost-found/${id}/moderate`, { action }),
    requestResolution: (id) => api.put(`/lost-found/${id}/request-resolution`),
    deleteLostFoundItem: (id) => api.delete(`/lost-found/${id}`),

    // Social & Comment endpoints
    upvoteComplaint: (id) => api.post(`/complaints/${id}/upvote`),
    upvoteAnnouncement: (id) => api.post(`/announcements/${id}/upvote`),
    getComments: (entityType, entityId) => api.get(`/comments/${entityType}/${entityId}`),
    addComment: (data) => api.post('/comments', data),

    reactToComment: (id, emoji = '❤️') => api.post(`/comments/${id}/react`, { emoji }),

    // Leaves and Outpass
    createLeave: (data) => api.post('/leaves', data),
    getMyLeaves: () => api.get('/leaves/my'),
    getAllLeaves: (params) => api.get('/leaves', { params }),
    updateLeaveStatus: (id, status, remarks) => api.put(`/leaves/${id}/status`, { status, remarks }),
    cancelLeave: (id) => api.put(`/leaves/${id}/cancel`),
    deleteLeave: (id) => api.delete(`/leaves/${id}`)
};

export default api;
