// Check if user is logged in
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

if (!currentUser || currentUser.role !== 'citizen') {
    alert('Please login as a citizen to access this page');
    window.location.href = 'index.html';
}

// Display user information
document.getElementById('userName').textContent = currentUser.fullname;
document.getElementById('userEmail').textContent = currentUser.email;

// Populate settings form
document.getElementById('settingsName').value = currentUser.fullname;
document.getElementById('settingsEmail').value = currentUser.email;
document.getElementById('settingsPhone').value = currentUser.phone;

// Navigation functionality
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

navItems.forEach(item => {
    item.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to clicked item
        this.classList.add('active');
        
        // Hide all pages
        pages.forEach(page => page.classList.remove('active'));
        
        // Show selected page
        const pageName = this.dataset.page;
        document.getElementById(`${pageName}-page`).classList.add('active');
    });
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
});

// Settings form submission
const settingsForms = document.querySelectorAll('.settings-form');

settingsForms[0].addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newName = document.getElementById('settingsName').value;
    const newPhone = document.getElementById('settingsPhone').value;
    
    // Update user in database
    const updated = DB.updateUser(currentUser.email, {
        fullname: newName,
        phone: newPhone
    });
    
    if (updated) {
        // Update session
        currentUser.fullname = newName;
        currentUser.phone = newPhone;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update display
        document.getElementById('userName').textContent = newName;
        
        alert('Profile updated successfully!');
    } else {
        alert('Failed to update profile');
    }
});

// Change password form
if (settingsForms[1]) {
    settingsForms[1].addEventListener('submit', function(e) {
        e.preventDefault();
        
        const currentPassword = this.querySelector('input[type="password"]').value;
        const newPassword = this.querySelectorAll('input[type="password"]')[1].value;
        const confirmPassword = this.querySelectorAll('input[type="password"]')[2].value;
        
        // Validate current password
        if (currentPassword !== currentUser.password) {
            alert('Current password is incorrect');
            return;
        }
        
        // Validate new password
        if (newPassword.length < 6) {
            alert('New password must be at least 6 characters');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        
        // Update password
        const updated = DB.updateUser(currentUser.email, {
            password: newPassword
        });
        
        if (updated) {
            currentUser.password = newPassword;
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            alert('Password updated successfully!');
            this.reset();
        } else {
            alert('Failed to update password');
        }
    });
}

// ========== REPORT ISSUE MODAL ==========
const reportModal = document.getElementById('reportModal');
const reportNewIssueBtn = document.getElementById('reportNewIssueBtn');
const createFirstReportBtn = document.getElementById('createFirstReportBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelReportBtn = document.getElementById('cancelReportBtn');
const reportForm = document.getElementById('reportForm');

let reportData = {
    photo: null,
    location: null,
    issueType: '',
    description: ''
};

// Open modal
function openReportModal() {
    reportModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeReportModal() {
    reportModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    resetReportForm();
}

// Reset form
function resetReportForm() {
    reportForm.reset();
    reportData = { photo: null, location: null, issueType: '', description: '' };
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('photoUploadArea').style.display = 'grid';
    document.getElementById('cameraContainer').style.display = 'none';
    document.getElementById('manualLocationForm').style.display = 'none';
    document.getElementById('locationDisplay').innerHTML = '<p class="location-status">No location selected</p>';
    document.getElementById('charCount').textContent = '0';
}

reportNewIssueBtn.addEventListener('click', openReportModal);
createFirstReportBtn.addEventListener('click', openReportModal);
closeModalBtn.addEventListener('click', closeReportModal);
cancelReportBtn.addEventListener('click', closeReportModal);

// Close modal on background click
reportModal.addEventListener('click', function(e) {
    if (e.target === reportModal) {
        closeReportModal();
    }
});

// ========== PHOTO UPLOAD ==========
const photoInput = document.getElementById('photoInput');
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
const capturePhotoBtn = document.getElementById('capturePhotoBtn');
const photoPreview = document.getElementById('photoPreview');
const previewImage = document.getElementById('previewImage');
const removePhotoBtn = document.getElementById('removePhotoBtn');
const photoUploadArea = document.getElementById('photoUploadArea');

// Upload from device
uploadPhotoBtn.addEventListener('click', () => {
    photoInput.click();
});

photoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
            reportData.photo = event.target.result;
            previewImage.src = event.target.result;
            photoPreview.style.display = 'block';
            photoUploadArea.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});

// Remove photo
removePhotoBtn.addEventListener('click', () => {
    reportData.photo = null;
    photoPreview.style.display = 'none';
    photoUploadArea.style.display = 'grid';
    photoInput.value = '';
});

// ========== CAMERA CAPTURE ==========
const cameraContainer = document.getElementById('cameraContainer');
const cameraPreview = document.getElementById('cameraPreview');
const takePictureBtn = document.getElementById('takePictureBtn');
const closeCameraBtn = document.getElementById('closeCameraBtn');
const photoCanvas = document.getElementById('photoCanvas');

let cameraStream = null;

capturePhotoBtn.addEventListener('click', async () => {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        cameraPreview.srcObject = cameraStream;
        cameraContainer.style.display = 'block';
        photoUploadArea.style.display = 'none';
    } catch (error) {
        alert('Unable to access camera. Please check permissions.');
        console.error('Camera error:', error);
    }
});

takePictureBtn.addEventListener('click', () => {
    const context = photoCanvas.getContext('2d');
    photoCanvas.width = cameraPreview.videoWidth;
    photoCanvas.height = cameraPreview.videoHeight;
    context.drawImage(cameraPreview, 0, 0);
    
    reportData.photo = photoCanvas.toDataURL('image/jpeg');
    previewImage.src = reportData.photo;
    
    // Stop camera
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    cameraContainer.style.display = 'none';
    photoPreview.style.display = 'block';
});

closeCameraBtn.addEventListener('click', () => {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    cameraContainer.style.display = 'none';
    photoUploadArea.style.display = 'grid';
});

// ========== LOCATION ==========
const currentLocationBtn = document.getElementById('currentLocationBtn');
const manualLocationBtn = document.getElementById('manualLocationBtn');
const locationDisplay = document.getElementById('locationDisplay');
const manualLocationForm = document.getElementById('manualLocationForm');
const saveLocationBtn = document.getElementById('saveLocationBtn');

// Get current location
currentLocationBtn.addEventListener('click', () => {
    if ('geolocation' in navigator) {
        currentLocationBtn.disabled = true;
        currentLocationBtn.innerHTML = '<span>Getting location...</span>';
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                reportData.location = {
                    type: 'coordinates',
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                
                locationDisplay.innerHTML = `
                    <p class="location-status active">✓ Current location captured</p>
                    <p style="font-size: 13px; color: #666; margin-top: 6px;">
                        Lat: ${position.coords.latitude.toFixed(6)}, 
                        Lng: ${position.coords.longitude.toFixed(6)}
                    </p>
                `;
                
                currentLocationBtn.disabled = false;
                currentLocationBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="4"></circle>
                        <line x1="21.17" y1="8" x2="12" y2="8"></line>
                        <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                        <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
                    </svg>
                    Use Current Location
                `;
                manualLocationForm.style.display = 'none';
            },
            (error) => {
                alert('Unable to get location. Please enable location services or enter manually.');
                currentLocationBtn.disabled = false;
                currentLocationBtn.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="4"></circle>
                        <line x1="21.17" y1="8" x2="12" y2="8"></line>
                        <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                        <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
                    </svg>
                    Use Current Location
                `;
            }
        );
    } else {
        alert('Geolocation is not supported by your browser');
    }
});

// Manual location
manualLocationBtn.addEventListener('click', () => {
    manualLocationForm.style.display = 'block';
});

saveLocationBtn.addEventListener('click', () => {
    const address = document.getElementById('manualAddress').value.trim();
    const city = document.getElementById('manualCity').value.trim();
    const postal = document.getElementById('manualPostal').value.trim();
    
    if (!address || !city || !postal) {
        alert('Please fill in all location fields');
        return;
    }
    
    reportData.location = {
        type: 'manual',
        address: address,
        city: city,
        postalCode: postal
    };
    
    locationDisplay.innerHTML = `
        <p class="location-status active">✓ Location saved</p>
        <p style="font-size: 13px; color: #666; margin-top: 6px;">
            ${address}, ${city}, ${postal}
        </p>
    `;
    
    manualLocationForm.style.display = 'none';
});

// ========== DESCRIPTION ==========
const issueDescription = document.getElementById('issueDescription');
const charCount = document.getElementById('charCount');

issueDescription.addEventListener('input', function() {
    const count = this.value.length;
    charCount.textContent = count;
    
    if (count > 500) {
        this.value = this.value.substring(0, 500);
        charCount.textContent = 500;
    }
});

// ========== FORM SUBMISSION ==========
reportForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validate photo
    if (!reportData.photo) {
        alert('Please upload or capture a photo');
        return;
    }
    
    // Validate location
    if (!reportData.location) {
        alert('Please provide a location');
        return;
    }
    
    // Get form data
    const issueType = document.getElementById('issueType').value;
    const description = issueDescription.value.trim();
    const instantVerification = document.getElementById('instantVerification').checked;
    
    if (!issueType || !description) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Create report object
    const newReport = {
        id: Date.now(),
        userId: currentUser.id,
        userName: currentUser.fullname,
        userEmail: currentUser.email,
        issueType: issueType,
        description: description,
        photo: reportData.photo,
        location: reportData.location,
        status: 'pending',
        instantVerification: instantVerification,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    let reports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    reports.push(newReport);
    localStorage.setItem('wasteReports', JSON.stringify(reports));
    
    alert('Report submitted successfully!');
    closeReportModal();
    
    // Reload reports if on reports page
    loadUserReports();
    
    console.log('Report submitted:', newReport);
});

// ========== LOAD USER REPORTS ==========
function loadUserReports() {
    const allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    const userReports = allReports.filter(report => report.userId === currentUser.id);
    
    const emptyState = document.getElementById('emptyReportsState');
    const reportsList = document.getElementById('reportsList');
    
    if (userReports.length === 0) {
        emptyState.style.display = 'flex';
        reportsList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        reportsList.style.display = 'block';
        
        // Sort by most recent first
        userReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        reportsList.innerHTML = userReports.map(report => {
            const date = new Date(report.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const issueTypeLabels = {
                'illegal-dumping': 'Illegal Dumping',
                'overflowing-bin': 'Overflowing Bin',
                'missed-collection': 'Missed Collection',
                'damaged-bin': 'Damaged Bin',
                'hazardous-waste': 'Hazardous Waste',
                'other': 'Other'
            };
            
            let locationText = '';
            if (report.location.type === 'coordinates') {
                locationText = `Lat: ${report.location.latitude.toFixed(4)}, Lng: ${report.location.longitude.toFixed(4)}`;
            } else {
                locationText = `${report.location.address}, ${report.location.city}, ${report.location.postalCode}`;
            }
            
            // Calculate time to resolve
            let timeInfo = '';
            if (report.status === 'resolved') {
                const createdDate = new Date(report.createdAt);
                const resolvedDate = report.resolvedAt ? new Date(report.resolvedAt) : new Date();
                const timeDiff = resolvedDate - createdDate;
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                if (days > 0) {
                    timeInfo = `<div style="margin-top: 12px; padding: 10px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                        <p style="font-size: 13px; color: #155724; margin: 0;">
                            <strong>✓ Resolved in:</strong> ${days} day${days !== 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}
                        </p>
                    </div>`;
                } else {
                    timeInfo = `<div style="margin-top: 12px; padding: 10px; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                        <p style="font-size: 13px; color: #155724; margin: 0;">
                            <strong>✓ Resolved in:</strong> ${hours} hour${hours !== 1 ? 's' : ''}
                        </p>
                    </div>`;
                }
            } else if (report.status === 'in-progress') {
                const createdDate = new Date(report.createdAt);
                const now = new Date();
                const timeDiff = now - createdDate;
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                timeInfo = `<div style="margin-top: 12px; padding: 10px; background: #d1ecf1; border-radius: 8px; border-left: 4px solid #0c5460;">
                    <p style="font-size: 13px; color: #0c5460; margin: 0;">
                        <strong>In progress for:</strong> ${days > 0 ? `${days} day${days !== 1 ? 's' : ''} ` : ''}${hours} hour${hours !== 1 ? 's' : ''}
                    </p>
                </div>`;
            } else if (report.status === 'pending' || report.status === 'verified') {
                const createdDate = new Date(report.createdAt);
                const now = new Date();
                const timeDiff = now - createdDate;
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                
                timeInfo = `<div style="margin-top: 12px; padding: 10px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #856404;">
                    <p style="font-size: 13px; color: #856404; margin: 0;">
                        <strong>Waiting for:</strong> ${days > 0 ? `${days} day${days !== 1 ? 's' : ''} ` : ''}${hours} hour${hours !== 1 ? 's' : ''}
                    </p>
                </div>`;
            }
            
            return `
                <div class="report-card">
                    <div class="report-image">
                        <img src="${report.photo}" alt="Report image">
                    </div>
                    <div class="report-content">
                        <div class="report-header">
                            <div>
                                <h3 class="report-title">${issueTypeLabels[report.issueType]}</h3>
                                <p class="report-date">${formattedDate}</p>
                            </div>
                            <span class="report-status ${report.status}">${report.status.charAt(0).toUpperCase() + report.status.slice(1)}</span>
                        </div>
                        <p class="report-description">${report.description}</p>
                        <div class="report-location">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span>${locationText}</span>
                        </div>
                        ${timeInfo}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Update stats on dashboard
    updateDashboardStats(userReports);
}

// ========== UPDATE DASHBOARD STATS ==========
function updateDashboardStats(reports) {
    const totalReports = reports.length;
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const resolvedReports = reports.filter(r => r.status === 'resolved').length;
    
    // Update stat cards
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 3) {
        statValues[0].textContent = totalReports;
        statValues[1].textContent = pendingReports;
        statValues[2].textContent = resolvedReports;
    }
}

// Load reports on page load
loadUserReports();
