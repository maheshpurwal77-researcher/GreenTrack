// Check if user is logged in as volunteer
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

if (!currentUser || currentUser.role !== 'volunteer') {
    alert('Please login as a volunteer to access this page');
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
        
        navItems.forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        
        pages.forEach(page => page.classList.remove('active'));
        
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

// ========== VOLUNTEER TASKS MANAGEMENT ==========
let allTasks = [];
let filteredTasks = [];

// Initialize volunteer tasks from reports
function initializeVolunteerTasks() {
    const allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    
    // Get or initialize volunteer tasks
    let volunteerTasks = JSON.parse(localStorage.getItem('volunteerTasks') || '[]');
    
    // Auto-assign in-progress reports to volunteers if not already assigned
    allReports.forEach(report => {
        if (report.status === 'in-progress') {
            const existingTask = volunteerTasks.find(t => t.reportId === report.id);
            if (!existingTask) {
                // Auto-assign to current volunteer (in real app, moderator would assign)
                volunteerTasks.push({
                    id: Date.now() + Math.random(),
                    reportId: report.id,
                    volunteerId: currentUser.id,
                    volunteerName: currentUser.fullname,
                    status: 'assigned', // assigned, in-progress, completed
                    assignedAt: new Date().toISOString(),
                    startedAt: null,
                    completedAt: null
                });
            }
        }
    });
    
    localStorage.setItem('volunteerTasks', JSON.stringify(volunteerTasks));
    
    // Get tasks for current volunteer
    allTasks = volunteerTasks.filter(task => task.volunteerId === currentUser.id);
    filteredTasks = [...allTasks];
    
    updateDashboardStats();
    displayRecentActivity();
    displayTasks();
    displayCompletedTasks();
}

// ========== UPDATE DASHBOARD STATS ==========
function updateDashboardStats() {
    const totalTasks = allTasks.length;
    const activeTasks = allTasks.filter(t => t.status !== 'completed').length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('activeTasks').textContent = activeTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
}

// ========== DISPLAY RECENT ACTIVITY ==========
function displayRecentActivity() {
    const activityList = document.getElementById('activityList');
    const allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    
    if (allTasks.length === 0) {
        activityList.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 20px;">No recent activity</p>';
        return;
    }
    
    const recentTasks = [...allTasks]
        .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt))
        .slice(0, 5);
    
    activityList.innerHTML = recentTasks.map(task => {
        const report = allReports.find(r => r.id === task.reportId);
        if (!report) return '';
        
        const issueTypeLabels = {
            'illegal-dumping': 'Illegal Dumping',
            'overflowing-bin': 'Overflowing Bin',
            'missed-collection': 'Missed Collection',
            'damaged-bin': 'Damaged Bin',
            'hazardous-waste': 'Hazardous Waste',
            'other': 'Other'
        };
        
        const timeAgo = getTimeAgo(new Date(task.assignedAt));
        
        return `
            <div class="activity-item">
                <div class="activity-info">
                    <h4>${issueTypeLabels[report.issueType]}</h4>
                    <p>Status: ${task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}</p>
                </div>
                <span class="activity-time">${timeAgo}</span>
            </div>
        `;
    }).join('');
}

// ========== DISPLAY TASKS ==========
function displayTasks() {
    const tasksSection = document.getElementById('tasksSection');
    const emptyState = document.getElementById('emptyTasksState');
    const tasksList = document.getElementById('tasksList');
    
    const activeTasks = filteredTasks.filter(t => t.status !== 'completed');
    
    if (activeTasks.length === 0) {
        emptyState.style.display = 'flex';
        tasksList.style.display = 'none';
        return;
    }
    
    emptyState.style.display = 'none';
    tasksList.style.display = 'block';
    
    const allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    
    tasksList.innerHTML = activeTasks.map(task => {
        const report = allReports.find(r => r.id === task.reportId);
        if (!report) return '';
        
        return createTaskCard(task, report);
    }).join('');
}

// ========== DISPLAY COMPLETED TASKS ==========
function displayCompletedTasks() {
    const completedTasksList = document.getElementById('completedTasksList');
    const completedTasks = allTasks.filter(t => t.status === 'completed');
    
    if (completedTasks.length === 0) {
        completedTasksList.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 40px;">No completed tasks yet</p>';
        return;
    }
    
    const allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    
    completedTasksList.innerHTML = completedTasks
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .map(task => {
            const report = allReports.find(r => r.id === task.reportId);
            if (!report) return '';
            return createTaskCard(task, report, true);
        }).join('');
}

// ========== CREATE TASK CARD ==========
function createTaskCard(task, report, isCompleted = false) {
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
        locationText = `${report.location.address}, ${report.location.city}`;
    }
    
    const statusClass = task.status === 'assigned' ? 'pending' : task.status;
    
    return `
        <div class="task-card">
            <div class="report-header">
                <div>
                    <h3 class="report-title">${issueTypeLabels[report.issueType]}</h3>
                    <p class="report-date">Reported: ${formattedDate} • By ${report.userName}</p>
                </div>
                <span class="report-status ${statusClass}">${task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}</span>
            </div>
            <p class="report-description">${report.description}</p>
            <div class="report-location">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>${locationText}</span>
            </div>
            ${!isCompleted ? `
                <div class="task-actions">
                    <button class="task-btn secondary" onclick="viewTaskDetail(${task.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Details
                    </button>
                    ${task.status === 'assigned' ? `
                        <button class="task-btn primary" onclick="startTask(${task.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            Start Task
                        </button>
                    ` : ''}
                    ${task.status === 'in-progress' ? `
                        <button class="task-btn success" onclick="completeTask(${task.id})">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Mark as Complete
                        </button>
                    ` : ''}
                </div>
            ` : `
                <div class="task-actions">
                    <button class="task-btn secondary" onclick="viewTaskDetail(${task.id})">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Details
                    </button>
                    <span style="color: #27ae60; font-weight: 600; padding: 10px;">
                        ✓ Completed on ${new Date(task.completedAt).toLocaleDateString()}
                    </span>
                </div>
            `}
        </div>
    `;
}

// ========== TASK ACTIONS ==========
function startTask(taskId) {
    const volunteerTasks = JSON.parse(localStorage.getItem('volunteerTasks') || '[]');
    const taskIndex = volunteerTasks.findIndex(t => t.id === taskId);
    
    if (taskIndex !== -1) {
        volunteerTasks[taskIndex].status = 'in-progress';
        volunteerTasks[taskIndex].startedAt = new Date().toISOString();
        localStorage.setItem('volunteerTasks', JSON.stringify(volunteerTasks));
        
        alert('Task started! Good luck!');
        initializeVolunteerTasks();
    }
}

let currentTaskIdToComplete = null;
let cameraStream = null;
let capturedPhotoData = null;

function completeTask(taskId) {
    currentTaskIdToComplete = taskId;
    capturedPhotoData = null;
    const completeTaskModal = document.getElementById('completeTaskModal');
    completeTaskModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCompleteModal() {
    const completeTaskModal = document.getElementById('completeTaskModal');
    completeTaskModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    currentTaskIdToComplete = null;
    capturedPhotoData = null;
    document.getElementById('completeTaskForm').reset();
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('cameraSection').style.display = 'none';
    stopCamera();
}

// Camera functions
function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

// Upload Photo Button
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
if (uploadPhotoBtn) {
    uploadPhotoBtn.addEventListener('click', function() {
        document.getElementById('completionImage').click();
    });
}

// Capture Photo Button
const capturePhotoBtn = document.getElementById('capturePhotoBtn');
if (capturePhotoBtn) {
    capturePhotoBtn.addEventListener('click', async function() {
        const cameraSection = document.getElementById('cameraSection');
        const videoElement = document.getElementById('cameraPreview');
        
        try {
            // Stop any existing stream
            stopCamera();
            
            // Request camera access
            cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }, // Use back camera on mobile
                audio: false 
            });
            
            videoElement.srcObject = cameraStream;
            cameraSection.style.display = 'block';
            document.getElementById('imagePreview').style.display = 'none';
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Unable to access camera. Please use the upload option or check camera permissions.');
        }
    });
}

// Take Picture Button
const takePictureBtn = document.getElementById('takePictureBtn');
if (takePictureBtn) {
    takePictureBtn.addEventListener('click', function() {
        const videoElement = document.getElementById('cameraPreview');
        const canvas = document.getElementById('photoCanvas');
        const previewImg = document.getElementById('previewImg');
        
        // Set canvas dimensions to match video
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        
        // Draw video frame to canvas
        const context = canvas.getContext('2d');
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64
        capturedPhotoData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Show preview
        previewImg.src = capturedPhotoData;
        document.getElementById('imagePreview').style.display = 'block';
        document.getElementById('cameraSection').style.display = 'none';
        
        // Stop camera
        stopCamera();
    });
}

// Close Camera Button
const closeCameraBtn = document.getElementById('closeCameraBtn');
if (closeCameraBtn) {
    closeCameraBtn.addEventListener('click', function() {
        document.getElementById('cameraSection').style.display = 'none';
        stopCamera();
    });
}

// Remove Photo Button
const removePhotoBtn = document.getElementById('removePhotoBtn');
if (removePhotoBtn) {
    removePhotoBtn.addEventListener('click', function() {
        capturedPhotoData = null;
        document.getElementById('previewImg').src = '';
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('completionImage').value = '';
    });
}

// Handle image preview from file upload
const completionImageInput = document.getElementById('completionImage');
if (completionImageInput) {
    completionImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                capturedPhotoData = event.target.result;
                const previewImg = document.getElementById('previewImg');
                previewImg.src = capturedPhotoData;
                document.getElementById('imagePreview').style.display = 'block';
                document.getElementById('cameraSection').style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    });
}

// Handle complete task form submission
const completeTaskForm = document.getElementById('completeTaskForm');
if (completeTaskForm) {
    completeTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Check if photo is provided (either uploaded or captured)
        const imageFile = document.getElementById('completionImage').files[0];
        if (!imageFile && !capturedPhotoData) {
            alert('Please upload or capture a completion photo before marking the task as done.');
            return;
        }
        
        const notes = document.getElementById('completionNotes').value;
        
        // If we have captured photo data, use it directly
        if (capturedPhotoData) {
            saveCompletedTask(capturedPhotoData, notes);
        } else {
            // Convert uploaded file to base64
            const reader = new FileReader();
            reader.onload = function(event) {
                saveCompletedTask(event.target.result, notes);
            };
            reader.readAsDataURL(imageFile);
        }
    });
}

function saveCompletedTask(completionPhoto, notes) {
    const volunteerTasks = JSON.parse(localStorage.getItem('volunteerTasks') || '[]');
    const taskIndex = volunteerTasks.findIndex(t => t.id === currentTaskIdToComplete);
    
    if (taskIndex !== -1) {
        volunteerTasks[taskIndex].status = 'completed';
        volunteerTasks[taskIndex].completedAt = new Date().toISOString();
        volunteerTasks[taskIndex].completionPhoto = completionPhoto;
        volunteerTasks[taskIndex].completionNotes = notes;
        localStorage.setItem('volunteerTasks', JSON.stringify(volunteerTasks));
        
        // Update report status to resolved
        const task = volunteerTasks[taskIndex];
        const allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
        const reportIndex = allReports.findIndex(r => r.id === task.reportId);
        
        if (reportIndex !== -1) {
            allReports[reportIndex].status = 'resolved';
            allReports[reportIndex].resolvedAt = new Date().toISOString();
            allReports[reportIndex].completionPhoto = completionPhoto;
            allReports[reportIndex].completionNotes = notes;
            localStorage.setItem('wasteReports', JSON.stringify(allReports));
        }
        
        closeCompleteModal();
        alert('Task completed successfully! Great work!');
        initializeVolunteerTasks();
    }
}

// Close modal when clicking close button
const closeCompleteModalBtn = document.getElementById('closeCompleteModalBtn');
if (closeCompleteModalBtn) {
    closeCompleteModalBtn.addEventListener('click', closeCompleteModal);
}

// Close modal when clicking outside
const completeTaskModal = document.getElementById('completeTaskModal');
if (completeTaskModal) {
    completeTaskModal.addEventListener('click', function(e) {
        if (e.target === completeTaskModal) {
            closeCompleteModal();
        }
    });
}

function viewTaskDetail(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    const report = allReports.find(r => r.id === task.reportId);
    if (!report) return;
    
    showTaskDetailModal(task, report);
}

// ========== TASK DETAIL MODAL ==========
const taskDetailModal = document.getElementById('taskDetailModal');
const closeTaskModalBtn = document.getElementById('closeTaskModalBtn');

closeTaskModalBtn.addEventListener('click', () => {
    taskDetailModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

taskDetailModal.addEventListener('click', function(e) {
    if (e.target === taskDetailModal) {
        taskDetailModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

function showTaskDetailModal(task, report) {
    const issueTypeLabels = {
        'illegal-dumping': 'Illegal Dumping',
        'overflowing-bin': 'Overflowing Bin',
        'missed-collection': 'Missed Collection',
        'damaged-bin': 'Damaged Bin',
        'hazardous-waste': 'Hazardous Waste',
        'other': 'Other'
    };
    
    let locationText = '';
    let googleMapsUrl = '';
    if (report.location.type === 'coordinates') {
        locationText = `Latitude: ${report.location.latitude}, Longitude: ${report.location.longitude}`;
        googleMapsUrl = `https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`;
    } else {
        locationText = `${report.location.address}<br>${report.location.city}, ${report.location.postalCode}`;
        const address = `${report.location.address}, ${report.location.city}, ${report.location.postalCode}`;
        googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    
    const content = document.getElementById('taskDetailContent');
    content.innerHTML = `
        <div class="detail-image">
            <img src="${report.photo}" alt="Report image">
        </div>
        
        <div class="detail-grid">
            <div class="detail-section">
                <h4>Issue Type</h4>
                <p>${issueTypeLabels[report.issueType]}</p>
            </div>
            <div class="detail-section">
                <h4>Task Status</h4>
                <p><span class="report-status ${task.status}">${task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')}</span></p>
            </div>
            <div class="detail-section">
                <h4>Reported By</h4>
                <p>${report.userName}<br><small style="color: #7f8c8d;">${report.userEmail}</small></p>
            </div>
            <div class="detail-section">
                <h4>Assigned Date</h4>
                <p>${new Date(task.assignedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>
        
        <div class="detail-section" style="margin-bottom: 20px;">
            <h4>Description</h4>
            <p>${report.description}</p>
        </div>
        
        <div class="detail-section">
            <h4>Location</h4>
            <p>${locationText}</p>
            <a href="${googleMapsUrl}" target="_blank" class="action-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; margin-top: 12px; text-decoration: none; font-size: 14px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Open in Google Maps
            </a>
        </div>
    `;
    
    taskDetailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ========== FILTERS ==========
const taskStatusFilter = document.getElementById('taskStatusFilter');
const taskTypeFilter = document.getElementById('taskTypeFilter');

taskStatusFilter.addEventListener('change', applyFilters);
taskTypeFilter.addEventListener('change', applyFilters);

function applyFilters() {
    const allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    
    filteredTasks = allTasks.filter(task => {
        const report = allReports.find(r => r.id === task.reportId);
        if (!report) return false;
        
        const statusMatch = taskStatusFilter.value === 'all' || task.status === taskStatusFilter.value;
        const typeMatch = taskTypeFilter.value === 'all' || report.issueType === taskTypeFilter.value;
        
        return statusMatch && typeMatch;
    });
    
    displayTasks();
}

// ========== SETTINGS ==========
const profileForm = document.getElementById('profileForm');
const passwordForm = document.getElementById('passwordForm');

profileForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newName = document.getElementById('settingsName').value;
    const newPhone = document.getElementById('settingsPhone').value;
    
    const updated = DB.updateUser(currentUser.email, {
        fullname: newName,
        phone: newPhone
    });
    
    if (updated) {
        currentUser.fullname = newName;
        currentUser.phone = newPhone;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        document.getElementById('userName').textContent = newName;
        alert('Profile updated successfully!');
    } else {
        alert('Failed to update profile');
    }
});

passwordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const currentPassword = this.querySelector('input[type="password"]').value;
    const newPassword = this.querySelectorAll('input[type="password"]')[1].value;
    const confirmPassword = this.querySelectorAll('input[type="password"]')[2].value;
    
    if (currentPassword !== currentUser.password) {
        alert('Current password is incorrect');
        return;
    }
    
    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match');
        return;
    }
    
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

// ========== UTILITY FUNCTIONS ==========
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}

// ========== INITIALIZE ==========
initializeVolunteerTasks();
