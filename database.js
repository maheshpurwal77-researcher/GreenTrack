// Database utility functions using localStorage
const DB = {
    // Initialize database
    init: function() {
        if (!localStorage.getItem('wasteManagementDB')) {
            localStorage.setItem('wasteManagementDB', JSON.stringify([]));
        }
    },
    
    // Get all users
    getAllUsers: function() {
        return JSON.parse(localStorage.getItem('wasteManagementDB') || '[]');
    },
    
    // Find user by email
    findUserByEmail: function(email) {
        const users = this.getAllUsers();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    },
    
    // Add new user
    addUser: function(userData) {
        const users = this.getAllUsers();
        // Add rejection tracking and suspension fields
        userData.rejectionCount = 0;
        userData.isSuspended = false;
        userData.suspendedUntil = null;
        userData.suspendedBy = null;
        userData.suspensionReason = null;
        users.push(userData);
        localStorage.setItem('wasteManagementDB', JSON.stringify(users));
        return true;
    },
    
    // Verify login credentials
    verifyLogin: function(email, password, role) {
        const user = this.findUserByEmail(email);
        if (user && user.password === password && user.role === role) {
            return user;
        }
        return null;
    },
    
    // Get users by role
    getUsersByRole: function(role) {
        const users = this.getAllUsers();
        return users.filter(user => user.role === role);
    },
    
    // Update user
    updateUser: function(email, updatedData) {
        const users = this.getAllUsers();
        const index = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());
        
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedData };
            localStorage.setItem('wasteManagementDB', JSON.stringify(users));
            return true;
        }
        return false;
    },
    
    // Delete user
    deleteUser: function(email) {
        const users = this.getAllUsers();
        const filteredUsers = users.filter(user => user.email.toLowerCase() !== email.toLowerCase());
        localStorage.setItem('wasteManagementDB', JSON.stringify(filteredUsers));
        return true;
    },
    
    // Clear all data (for testing)
    clearAll: function() {
        localStorage.removeItem('wasteManagementDB');
        this.init();
    }
};

// Initialize database on page load
DB.init();
