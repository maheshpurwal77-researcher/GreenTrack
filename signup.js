// Database utility functions
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
    }
};

// Initialize database on page load
DB.init();

// Role selection functionality
const roleButtons = document.querySelectorAll('.role-btn');
let selectedRole = 'citizen';

roleButtons.forEach(button => {
    button.addEventListener('click', function() {
        roleButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        selectedRole = this.dataset.role;
    });
});

// Sign up form submission
const signupForm = document.getElementById('signupForm');

signupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const fullname = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const phone = document.getElementById('phone').value.trim();
    const terms = document.getElementById('terms').checked;
    
    // Validation
    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }
    
    if (!terms) {
        alert('You must agree to the Terms & Conditions!');
        return;
    }
    
    // Check if email already exists
    if (DB.findUserByEmail(email)) {
        alert('An account with this email already exists!');
        return;
    }
    
    // Create user object
    const newUser = {
        id: Date.now(),
        fullname: fullname,
        email: email,
        password: password, // In production, this should be hashed
        phone: phone,
        role: selectedRole,
        createdAt: new Date().toISOString()
    };
    
    // Save to database
    DB.addUser(newUser);
    
    alert(`Account created successfully!\nRole: ${selectedRole}\nYou can now login.`);
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
});

// Add smooth transitions for input focus
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.classList.remove('focused');
    });
});
