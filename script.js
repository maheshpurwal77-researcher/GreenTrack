// Role selection functionality
const roleButtons = document.querySelectorAll('.role-btn');
let selectedRole = 'citizen';

roleButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Remove active class from all buttons
        roleButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Update selected role
        selectedRole = this.dataset.role;
        
        console.log('Selected role:', selectedRole);
    });
});

// Form submission
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;
    
    // Verify credentials with database
    const user = DB.verifyLogin(email, password, selectedRole);
    
    if (user) {
        // Check if citizen account is suspended
        if (user.role === 'citizen' && user.isSuspended) {
            const suspendedUntil = user.suspendedUntil ? new Date(user.suspendedUntil) : null;
            
            if (suspendedUntil && new Date() < suspendedUntil) {
                const daysLeft = Math.ceil((suspendedUntil - new Date()) / (1000 * 60 * 60 * 24));
                alert(`Your account has been suspended until ${suspendedUntil.toLocaleDateString()}.\n${daysLeft} day(s) remaining.\nReason: ${user.suspensionReason || 'Multiple report rejections'}`);
                return;
            } else if (suspendedUntil && new Date() >= suspendedUntil) {
                // Suspension expired, reactivate account
                DB.updateUser(user.email, {
                    isSuspended: false,
                    suspendedUntil: null,
                    suspendedBy: null,
                    suspensionReason: null
                });
            } else {
                // Permanent suspension
                alert(`Your account has been permanently suspended.\nReason: ${user.suspensionReason || 'Multiple report rejections'}\nPlease contact support.`);
                return;
            }
        }
        
        // Store session
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        if (remember) {
            localStorage.setItem('rememberedUser', email);
        }
        
        alert(`Welcome back, ${user.fullname}!\nLogging in as ${selectedRole}`);
        
        // Redirect based on role
        setTimeout(() => {
            switch(selectedRole) {
                case 'citizen':
                    window.location.href = 'citizen-dashboard.html';
                    break;
                case 'moderator':
                    window.location.href = 'moderator-dashboard.html';
                    break;
                case 'volunteer':
                    window.location.href = 'volunteer-dashboard.html';
                    break;
            }
        }, 1000);
    } else {
        alert('Invalid credentials! Please check your email, password, and selected role.');
    }
});

// Password visibility toggle (optional enhancement)
const passwordInput = document.getElementById('password');

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
