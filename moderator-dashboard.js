// Check if user is logged in as moderator
const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));

if (!currentUser || currentUser.role !== 'moderator') {
    alert('Please login as a moderator to access this page');
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

// ========== LOAD ALL REPORTS ==========
let allReports = [];
let filteredReports = [];

function loadAllReports() {
    allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    filteredReports = [...allReports];
    
    updateDashboardStats();
    displayRecentReports();
    displayAllReports();
}

// ========== UPDATE DASHBOARD STATS ==========
function updateDashboardStats() {
    const totalReports = allReports.length;
    const pendingReports = allReports.filter(r => r.status === 'pending').length;
    const resolvedReports = allReports.filter(r => r.status === 'resolved').length;
    
    const allUsers = DB.getAllUsers();
    const totalCitizens = allUsers.filter(u => u.role === 'citizen').length;
    
    document.getElementById('totalReports').textContent = totalReports;
    document.getElementById('pendingReports').textContent = pendingReports;
    document.getElementById('resolvedReports').textContent = resolvedReports;
    document.getElementById('totalCitizens').textContent = totalCitizens;
}

// ========== DISPLAY RECENT REPORTS ==========
function displayRecentReports() {
    const recentReports = [...allReports]
        .sort((a, b) => {
            // Prioritize instant verification requests
            if (a.instantVerification && !b.instantVerification) return -1;
            if (!a.instantVerification && b.instantVerification) return 1;
            // Then sort by date
            return new Date(b.createdAt) - new Date(a.createdAt);
        })
        .slice(0, 5);
    
    const container = document.getElementById('dashboardReportsList');
    
    if (recentReports.length === 0) {
        container.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 40px;">No reports yet</p>';
        return;
    }
    
    container.innerHTML = recentReports.map(report => createReportCard(report, true)).join('');
    
    // Add click handlers
    document.querySelectorAll('.report-card.clickable').forEach(card => {
        card.addEventListener('click', function() {
            const reportId = parseInt(this.dataset.reportId);
            showReportDetail(reportId);
        });
    });
}

// ========== DISPLAY ALL REPORTS ==========
function displayAllReports() {
    const container = document.getElementById('allReportsList');
    
    if (filteredReports.length === 0) {
        container.innerHTML = '<p style="color: #7f8c8d; text-align: center; padding: 40px;">No reports found</p>';
        return;
    }
    
    const sortedReports = [...filteredReports].sort((a, b) => {
        // Prioritize instant verification requests
        if (a.instantVerification && !b.instantVerification) return -1;
        if (!a.instantVerification && b.instantVerification) return 1;
        // Then sort by date
        return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    container.innerHTML = sortedReports.map(report => createReportCard(report, true)).join('');
    
    // Add click handlers
    document.querySelectorAll('.report-card.clickable').forEach(card => {
        card.addEventListener('click', function() {
            const reportId = parseInt(this.dataset.reportId);
            showReportDetail(reportId);
        });
    });
}

// ========== CREATE REPORT CARD ==========
function createReportCard(report, clickable = false) {
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
    
    return `
        <div class="report-card ${clickable ? 'clickable' : ''} ${report.instantVerification && report.status === 'pending' ? 'instant-verification-card' : ''}" data-report-id="${report.id}" style="${report.instantVerification && report.status === 'pending' ? 'border: 2px solid #ff9800; background: #fff3e0;' : ''}">
            ${report.instantVerification && report.status === 'pending' ? '<div style="background: #ff9800; color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; margin-bottom: 12px; display: inline-flex; align-items: center; gap: 6px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>INSTANT VERIFICATION REQUESTED</div>' : ''}
            <div class="report-image">
                <img src="${report.photo}" alt="Report image">
            </div>
            <div class="report-content">
                <div class="report-header">
                    <div>
                        <h3 class="report-title">${issueTypeLabels[report.issueType]}</h3>
                        <p class="report-date">${formattedDate} • By ${report.userName}</p>
                    </div>
                    <span class="report-status ${report.status}">${report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('-', ' ')}</span>
                </div>
                <p class="report-description">${report.description}</p>
                <div class="report-location">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>${locationText}</span>
                </div>
            </div>
        </div>
    `;
}

// ========== FILTERS ==========
const statusFilter = document.getElementById('statusFilter');
const typeFilter = document.getElementById('typeFilter');
const searchInput = document.getElementById('searchInput');

statusFilter.addEventListener('change', applyFilters);
typeFilter.addEventListener('change', applyFilters);
searchInput.addEventListener('input', applyFilters);

function applyFilters() {
    filteredReports = allReports.filter(report => {
        const statusMatch = statusFilter.value === 'all' || report.status === statusFilter.value;
        const typeMatch = typeFilter.value === 'all' || report.issueType === typeFilter.value;
        const searchMatch = searchInput.value === '' || 
            report.userName.toLowerCase().includes(searchInput.value.toLowerCase()) ||
            report.userEmail.toLowerCase().includes(searchInput.value.toLowerCase());
        
        return statusMatch && typeMatch && searchMatch;
    });
    
    displayAllReports();
}

// ========== REPORT DETAIL MODAL ==========
const reportDetailModal = document.getElementById('reportDetailModal');
const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');

closeDetailModalBtn.addEventListener('click', () => {
    reportDetailModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

reportDetailModal.addEventListener('click', function(e) {
    if (e.target === reportDetailModal) {
        reportDetailModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

function showReportDetail(reportId) {
    const report = allReports.find(r => r.id === reportId);
    if (!report) return;
    
    const date = new Date(report.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
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
    let googleMapsUrl = '';
    if (report.location.type === 'coordinates') {
        locationText = `Latitude: ${report.location.latitude}, Longitude: ${report.location.longitude}`;
        googleMapsUrl = `https://www.google.com/maps?q=${report.location.latitude},${report.location.longitude}`;
    } else {
        locationText = `${report.location.address}<br>${report.location.city}, ${report.location.postalCode}`;
        const address = `${report.location.address}, ${report.location.city}, ${report.location.postalCode}`;
        googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    }
    
    // Get all volunteers
    const allUsers = DB.getAllUsers();
    const volunteers = allUsers.filter(u => u.role === 'volunteer');
    
    const content = document.getElementById('reportDetailContent');
    content.innerHTML = `
        ${report.instantVerification && report.status === 'pending' ? `
            <div style="padding: 16px; background: #ff9800; color: white; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <div>
                    <p style="font-weight: 700; font-size: 16px; margin-bottom: 4px;">⚡ INSTANT VERIFICATION REQUESTED</p>
                    <p style="font-size: 13px; opacity: 0.95;">This report requires immediate attention and priority review</p>
                </div>
            </div>
        ` : ''}
        <div class="detail-image">
            <img src="${report.photo}" alt="Report image">
        </div>
        
        <div class="detail-grid">
            <div class="detail-section">
                <h4>Issue Type</h4>
                <p>${issueTypeLabels[report.issueType]}</p>
            </div>
            <div class="detail-section">
                <h4>Status</h4>
                <p><span class="report-status ${report.status}">${report.status.charAt(0).toUpperCase() + report.status.slice(1).replace('-', ' ')}</span></p>
            </div>
            <div class="detail-section">
                <h4>Reported By</h4>
                <p>${report.userName}<br><small style="color: #7f8c8d;">${report.userEmail}</small></p>
            </div>
            <div class="detail-section">
                <h4>Date Reported</h4>
                <p>${formattedDate}</p>
            </div>
        </div>
        
        <div class="detail-section" style="margin-bottom: 20px;">
            <h4>Description</h4>
            <p>${report.description}</p>
        </div>
        
        <div class="detail-section" style="margin-bottom: 20px;">
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
        
        ${report.status === 'pending' ? `
            <div class="verification-section" style="margin-bottom: 20px; padding: 20px; background: #f9f9f9; border-radius: 12px;">
                <h4 style="margin-bottom: 12px; color: #2c3e50;">Verify Report</h4>
                <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 16px;">Review this report and take action</p>
                ${report.instantVerification ? `
                    <div style="margin-bottom: 16px; padding: 12px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ff9800;">
                        <p style="color: #856404; font-size: 13px; margin-bottom: 8px;">
                            <strong>⚡ Instant Verification Available</strong><br>
                            You can verify this report instantly via WhatsApp video call with the citizen
                        </p>
                    </div>
                ` : ''}
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    ${report.instantVerification ? `
                        <button class="status-btn" onclick="instantVerifyReport(${report.id})" style="flex: 1; background: linear-gradient(135deg, #25D366 0%, #128C7E 100%); color: white; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                <polyline points="23 7 23 1 17 1"></polyline>
                                <line x1="23" y1="1" x2="15" y2="9"></line>
                            </svg>
                            Instant Verify (WhatsApp Call)
                        </button>
                    ` : ''}
                    <button class="status-btn resolved" onclick="verifyReport(${report.id})" style="flex: 1;">
                        ✓ Verify Report
                    </button>
                    <button class="status-btn" onclick="rejectReport(${report.id})" style="flex: 1; background: #e74c3c; color: white;">
                        ✗ Reject Report
                    </button>
                </div>
            </div>
        ` : ''}
        
        ${report.status === 'verified' || report.status === 'in-progress' ? `
            <div class="assignment-section" style="margin-bottom: 20px; padding: 20px; background: #f9f9f9; border-radius: 12px;">
                <h4 style="margin-bottom: 12px; color: #2c3e50;">Assign Volunteer</h4>
                <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 16px;">
                    ${report.assignedVolunteer ? `Assigned to: <strong>${report.assignedVolunteer}</strong>` : 'Select a volunteer to handle this report'}
                </p>
                ${volunteers.length > 0 ? `
                    <select id="volunteerSelect" style="width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px; margin-bottom: 12px;" onchange="showVolunteerPerformancePreview(this.value)">
                        <option value="">Select a volunteer</option>
                        ${volunteers.map(v => {
                            const performance = getVolunteerPerformanceSummary(v.id);
                            let displayText = `${v.fullname} (${v.email})`;
                            if (performance) {
                                displayText += ` - ⭐ ${performance.averageRating.toFixed(1)}`;
                            }
                            return `<option value="${v.id}" ${report.assignedVolunteerId === v.id ? 'selected' : ''}>${displayText}</option>`;
                        }).join('')}
                    </select>
                    <div id="volunteerPerformancePreview" style="margin-bottom: 12px;"></div>
                    <div style="display: flex; gap: 12px;">
                        <button class="status-btn in-progress" onclick="assignVolunteer(${report.id})" style="flex: 2;">
                            ${report.assignedVolunteer ? 'Reassign Volunteer' : 'Assign Volunteer'}
                        </button>
                        <button class="status-btn" onclick="refuseReport(${report.id})" style="flex: 1; background: #e67e22; color: white;">
                            Refuse Report
                        </button>
                    </div>
                ` : `
                    <p style="color: #e74c3c; font-size: 14px; margin-bottom: 12px;">No volunteers available in the system</p>
                    <button class="status-btn" onclick="refuseReport(${report.id})" style="width: 100%; background: #e67e22; color: white;">
                        Refuse Report
                    </button>
                `}
            </div>
        ` : ''}
        
        ${report.status === 'rejected' ? `
            <div style="padding: 16px; background: #ffe5e5; border-radius: 8px; border-left: 4px solid #e74c3c;">
                <p style="color: #c0392b; font-weight: 600;">This report has been rejected</p>
                ${report.rejectionReason ? `<p style="color: #7f8c8d; font-size: 14px; margin-top: 8px;">Reason: ${report.rejectionReason}</p>` : ''}
            </div>
        ` : ''}
        
        ${report.status !== 'pending' && report.status !== 'rejected' && report.status !== 'verified' ? `
            <div class="status-actions">
                <button class="status-btn pending ${report.status === 'pending' ? 'active' : ''}" onclick="updateReportStatus(${report.id}, 'pending')">
                    Mark as Pending
                </button>
                <button class="status-btn in-progress ${report.status === 'in-progress' ? 'active' : ''}" onclick="updateReportStatus(${report.id}, 'in-progress')">
                    Mark as In Progress
                </button>
                <button class="status-btn resolved ${report.status === 'resolved' ? 'active' : ''}" onclick="updateReportStatus(${report.id}, 'resolved')">
                    Mark as Resolved
                </button>
            </div>
        ` : ''}
        
        ${report.status === 'resolved' && report.assignedVolunteerId ? `
            <div style="margin-top: 20px; padding: 16px; background: #e8f5e9; border-radius: 8px; border-left: 4px solid #27ae60;">
                <p style="color: #155724; font-weight: 600; margin-bottom: 12px;">Task Completed by ${report.assignedVolunteer}</p>
                <button class="report-volunteer-btn" onclick="openVolunteerReportModalFromReport(${report.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    Report Volunteer Performance
                </button>
            </div>
        ` : ''}
    `;
    
    reportDetailModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ========== UPDATE REPORT STATUS ==========
function updateReportStatus(reportId, newStatus) {
    const reports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
        reports[reportIndex].status = newStatus;
        localStorage.setItem('wasteReports', JSON.stringify(reports));
        
        loadAllReports();
        reportDetailModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        alert('Report status updated successfully!');
    }
}

// ========== VERIFY REPORT ==========
function verifyReport(reportId) {
    if (!confirm('Are you sure you want to verify this report?')) {
        return;
    }
    
    const reports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
        reports[reportIndex].status = 'verified';
        reports[reportIndex].verifiedAt = new Date().toISOString();
        reports[reportIndex].verifiedBy = currentUser.fullname;
        localStorage.setItem('wasteReports', JSON.stringify(reports));
        
        loadAllReports();
        showReportDetail(reportId);
        
        alert('Report verified successfully! You can now assign a volunteer.');
    }
}

// ========== INSTANT VERIFY REPORT (WhatsApp Video Call) ==========
function instantVerifyReport(reportId) {
    const reports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    const report = reports.find(r => r.id === reportId);
    
    if (!report) {
        alert('Report not found');
        return;
    }
    
    // Get citizen's phone number
    const allUsers = DB.getAllUsers();
    const citizen = allUsers.find(u => u.email === report.userEmail);
    
    if (!citizen || !citizen.phone) {
        alert('Citizen phone number not available. Cannot initiate WhatsApp call.');
        return;
    }
    
    const confirmMsg = `Instant Verification via WhatsApp

Citizen: ${report.userName}
Phone: ${citizen.phone}

This will open WhatsApp to start a video call with the citizen.
After the call, you can verify or reject the report.

Proceed?`;
    
    if (!confirm(confirmMsg)) {
        return;
    }
    
    // Format phone number for WhatsApp (remove spaces, dashes, etc.)
    let phoneNumber = citizen.phone.replace(/\D/g, '');
    
    // Add +91 prefix for Indian numbers
    if (!phoneNumber.startsWith('91')) {
        phoneNumber = '91' + phoneNumber;
    }
    
    // WhatsApp video call URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hello, I am a moderator from GreenTrack. I would like to verify your recent report via video call. Please accept the call.')}`;
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Show post-call action dialog
    setTimeout(() => {
        const action = prompt(`After completing the WhatsApp video call with ${report.userName}:

Enter your action:
1. Type "verify" to verify the report
2. Type "reject" to reject the report
3. Click Cancel to decide later`);
        
        if (action === null) {
            alert('You can verify or reject this report later from the report details.');
            return;
        }
        
        if (action.toLowerCase() === 'verify') {
            const reportIndex = reports.findIndex(r => r.id === reportId);
            if (reportIndex !== -1) {
                reports[reportIndex].status = 'verified';
                reports[reportIndex].verifiedAt = new Date().toISOString();
                reports[reportIndex].verifiedBy = currentUser.fullname;
                reports[reportIndex].instantVerificationCompleted = true;
                reports[reportIndex].verificationMethod = 'WhatsApp Video Call';
                localStorage.setItem('wasteReports', JSON.stringify(reports));
                
                loadAllReports();
                reportDetailModal.classList.remove('active');
                document.body.style.overflow = 'auto';
                
                alert('Report verified successfully via instant verification! You can now assign a volunteer.');
            }
        } else if (action.toLowerCase() === 'reject') {
            const reason = prompt('Please provide a reason for rejecting this report:');
            if (reason && reason.trim()) {
                const reportIndex = reports.findIndex(r => r.id === reportId);
                if (reportIndex !== -1) {
                    const reportData = reports[reportIndex];
                    
                    reports[reportIndex].status = 'rejected';
                    reports[reportIndex].rejectedAt = new Date().toISOString();
                    reports[reportIndex].rejectedBy = currentUser.fullname;
                    reports[reportIndex].rejectionReason = reason;
                    reports[reportIndex].instantVerificationCompleted = true;
                    reports[reportIndex].verificationMethod = 'WhatsApp Video Call';
                    localStorage.setItem('wasteReports', JSON.stringify(reports));
                    
                    // Update citizen's rejection count
                    const citizenEmail = reportData.userEmail;
                    const allUsers = DB.getAllUsers();
                    const citizenIndex = allUsers.findIndex(u => u.email === citizenEmail);
                    
                    if (citizenIndex !== -1) {
                        const newRejectionCount = (allUsers[citizenIndex].rejectionCount || 0) + 1;
                        
                        DB.updateUser(citizenEmail, {
                            rejectionCount: newRejectionCount
                        });
                        
                        if (newRejectionCount >= 5) {
                            alert(`WARNING: Citizen "${reportData.userName}" now has ${newRejectionCount} rejected reports.\nYou can suspend this account from the Users page.`);
                        }
                    }
                    
                    loadAllReports();
                    reportDetailModal.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    
                    alert('Report rejected after instant verification.');
                }
            } else {
                alert('Rejection cancelled. Please provide a reason to reject the report.');
            }
        } else {
            alert('Invalid action. You can verify or reject this report later from the report details.');
        }
    }, 2000); // 2 second delay to allow WhatsApp to open
}

// ========== REJECT REPORT ==========
function rejectReport(reportId) {
    const reason = prompt('Please provide a reason for rejecting this report (optional):');
    
    if (reason === null) return; // User cancelled
    
    const reports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
        const report = reports[reportIndex];
        
        reports[reportIndex].status = 'rejected';
        reports[reportIndex].rejectedAt = new Date().toISOString();
        reports[reportIndex].rejectedBy = currentUser.fullname;
        reports[reportIndex].rejectionReason = reason || 'No reason provided';
        localStorage.setItem('wasteReports', JSON.stringify(reports));
        
        // Update citizen's rejection count
        const citizenEmail = report.userEmail;
        const allUsers = DB.getAllUsers();
        const citizenIndex = allUsers.findIndex(u => u.email === citizenEmail);
        
        if (citizenIndex !== -1) {
            const newRejectionCount = (allUsers[citizenIndex].rejectionCount || 0) + 1;
            
            DB.updateUser(citizenEmail, {
                rejectionCount: newRejectionCount
            });
            
            // Check if citizen has 5 or more rejections
            if (newRejectionCount >= 5) {
                alert(`WARNING: Citizen "${report.userName}" now has ${newRejectionCount} rejected reports.\nYou can suspend this account from the Users page.`);
            }
        }
        
        loadAllReports();
        reportDetailModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        alert('Report rejected.');
    }
}

// ========== REFUSE REPORT ==========
function refuseReport(reportId) {
    const reason = prompt('Please provide a reason for refusing this report:');
    
    if (reason === null) return; // User cancelled
    
    if (!reason.trim()) {
        alert('Please provide a reason for refusing the report');
        return;
    }
    
    if (!confirm('Are you sure you want to refuse this report? This will remove any volunteer assignments.')) {
        return;
    }
    
    const reports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
        const report = reports[reportIndex];
        const hadAssignment = reports[reportIndex].assignedVolunteerId;
        
        reports[reportIndex].status = 'rejected';
        reports[reportIndex].rejectedAt = new Date().toISOString();
        reports[reportIndex].rejectedBy = currentUser.fullname;
        reports[reportIndex].rejectionReason = reason;
        reports[reportIndex].assignedVolunteerId = null;
        reports[reportIndex].assignedVolunteer = null;
        localStorage.setItem('wasteReports', JSON.stringify(reports));
        
        // Update citizen's rejection count
        const citizenEmail = report.userEmail;
        const allUsers = DB.getAllUsers();
        const citizenIndex = allUsers.findIndex(u => u.email === citizenEmail);
        
        if (citizenIndex !== -1) {
            const newRejectionCount = (allUsers[citizenIndex].rejectionCount || 0) + 1;
            
            DB.updateUser(citizenEmail, {
                rejectionCount: newRejectionCount
            });
            
            // Check if citizen has 5 or more rejections
            if (newRejectionCount >= 5) {
                alert(`WARNING: Citizen "${report.userName}" now has ${newRejectionCount} rejected reports.\nYou can suspend this account from the Users page.`);
            }
        }
        
        // Remove volunteer task if it was assigned
        if (hadAssignment) {
            let volunteerTasks = JSON.parse(localStorage.getItem('volunteerTasks') || '[]');
            volunteerTasks = volunteerTasks.filter(t => t.reportId !== reportId);
            localStorage.setItem('volunteerTasks', JSON.stringify(volunteerTasks));
        }
        
        loadAllReports();
        reportDetailModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        alert('Report refused successfully.');
    }
}

// ========== ASSIGN VOLUNTEER ==========
function assignVolunteer(reportId) {
    const volunteerSelect = document.getElementById('volunteerSelect');
    const selectedVolunteerId = parseInt(volunteerSelect.value);
    
    if (!selectedVolunteerId) {
        alert('Please select a volunteer');
        return;
    }
    
    const allUsers = DB.getAllUsers();
    const selectedVolunteer = allUsers.find(u => u.id === selectedVolunteerId);
    
    if (!selectedVolunteer) {
        alert('Volunteer not found');
        return;
    }
    
    if (!confirm(`Assign this task to ${selectedVolunteer.fullname}?`)) {
        return;
    }
    
    // Update report
    const reports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    const reportIndex = reports.findIndex(r => r.id === reportId);
    
    if (reportIndex !== -1) {
        reports[reportIndex].status = 'in-progress';
        reports[reportIndex].assignedVolunteerId = selectedVolunteerId;
        reports[reportIndex].assignedVolunteer = selectedVolunteer.fullname;
        reports[reportIndex].assignedAt = new Date().toISOString();
        localStorage.setItem('wasteReports', JSON.stringify(reports));
        
        // Create volunteer task
        let volunteerTasks = JSON.parse(localStorage.getItem('volunteerTasks') || '[]');
        
        // Check if task already exists
        const existingTaskIndex = volunteerTasks.findIndex(t => t.reportId === reportId);
        
        if (existingTaskIndex !== -1) {
            // Update existing task
            volunteerTasks[existingTaskIndex].volunteerId = selectedVolunteerId;
            volunteerTasks[existingTaskIndex].volunteerName = selectedVolunteer.fullname;
            volunteerTasks[existingTaskIndex].status = 'assigned';
            volunteerTasks[existingTaskIndex].assignedAt = new Date().toISOString();
        } else {
            // Create new task
            volunteerTasks.push({
                id: Date.now() + Math.random(),
                reportId: reportId,
                volunteerId: selectedVolunteerId,
                volunteerName: selectedVolunteer.fullname,
                status: 'assigned',
                assignedAt: new Date().toISOString(),
                startedAt: null,
                completedAt: null
            });
        }
        
        localStorage.setItem('volunteerTasks', JSON.stringify(volunteerTasks));
        
        loadAllReports();
        reportDetailModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        alert(`Task assigned to ${selectedVolunteer.fullname} successfully!`);
    }
}

// ========== USERS PAGE ==========
function loadUsers() {
    const allUsers = DB.getAllUsers();
    const roleFilter = document.getElementById('roleFilter');
    const userSearchInput = document.getElementById('userSearchInput');
    
    function displayUsers() {
        let filteredUsers = allUsers.filter(user => {
            const roleMatch = roleFilter.value === 'all' || user.role === roleFilter.value;
            const searchMatch = userSearchInput.value === '' ||
                user.fullname.toLowerCase().includes(userSearchInput.value.toLowerCase()) ||
                user.email.toLowerCase().includes(userSearchInput.value.toLowerCase());
            
            return roleMatch && searchMatch;
        });
        
        const tbody = document.getElementById('usersTableBody');
        
        if (filteredUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #7f8c8d; padding: 40px;">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = filteredUsers.map(user => {
            const date = new Date(user.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            // Check if citizen and suspension status
            const isSuspended = user.isSuspended || false;
            const rejectionCount = user.rejectionCount || 0;
            const needsAction = user.role === 'citizen' && rejectionCount >= 5 && !isSuspended;
            
            // Get volunteer performance if volunteer
            let performanceInfo = '';
            if (user.role === 'volunteer') {
                const performance = getVolunteerPerformanceSummary(user.id);
                if (performance) {
                    const stars = '★'.repeat(Math.round(performance.averageRating)) + '☆'.repeat(5 - Math.round(performance.averageRating));
                    let colorClass = performance.averageRating >= 4 ? '#27ae60' : (performance.averageRating >= 3 ? '#f39c12' : '#e74c3c');
                    performanceInfo = `
                        <br><span style="color: #ffc107; font-size: 12px;">${stars}</span>
                        <span style="font-size: 12px; color: ${colorClass}; font-weight: 600;"> ${performance.averageRating.toFixed(1)}/5</span>
                        <span style="font-size: 11px; color: #7f8c8d;"> (${performance.totalReports} report${performance.totalReports !== 1 ? 's' : ''})</span>
                    `;
                    if (performance.warningLevel === 'high' || performance.warningLevel === 'medium') {
                        performanceInfo += `<br><span style="color: #e74c3c; font-size: 11px; font-weight: 600;">⚠ ${performance.warningLevel.toUpperCase()} WARNING</span>`;
                    }
                }
            }
            
            return `
                <tr style="${needsAction ? 'background: #fff3cd;' : ''}">
                    <td>
                        ${user.fullname}
                        ${isSuspended ? '<br><span style="color: #e74c3c; font-size: 12px; font-weight: 600;">⚠ SUSPENDED</span>' : ''}
                        ${needsAction ? '<br><span style="color: #856404; font-size: 12px; font-weight: 600;">⚠ ACTION REQUIRED</span>' : ''}
                        ${performanceInfo}
                    </td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>
                        <span class="role-badge ${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
                        ${user.role === 'citizen' && rejectionCount > 0 ? `<br><small style="color: #e74c3c;">${rejectionCount} rejection${rejectionCount !== 1 ? 's' : ''}</small>` : ''}
                    </td>
                    <td>
                        ${formattedDate}
                        ${user.role === 'citizen' ? `<br><button onclick="manageUserSuspension('${user.email}')" class="action-btn" style="padding: 6px 12px; font-size: 12px; margin-top: 6px;">${isSuspended ? 'Manage Suspension' : 'Suspend Account'}</button>` : ''}
                        ${user.role === 'volunteer' ? `<br><button onclick="viewVolunteerPerformance(${user.id})" class="action-btn" style="padding: 6px 12px; font-size: 12px; margin-top: 6px;">View Performance</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    displayUsers();
    roleFilter.addEventListener('change', displayUsers);
    userSearchInput.addEventListener('input', displayUsers);
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

// ========== INITIALIZE ==========
loadAllReports();
loadUsers();

// ========== VOLUNTEER REPORTING SYSTEM ==========

// Modal controls
const volunteerReportModal = document.getElementById('volunteerReportModal');
const closeVolunteerReportModalBtn = document.getElementById('closeVolunteerReportModalBtn');
const cancelVolunteerReport = document.getElementById('cancelVolunteerReport');
const volunteerReportForm = document.getElementById('volunteerReportForm');

const volunteerPerformanceModal = document.getElementById('volunteerPerformanceModal');
const closeVolunteerPerformanceModalBtn = document.getElementById('closeVolunteerPerformanceModalBtn');

// Close volunteer report modal
closeVolunteerReportModalBtn.addEventListener('click', () => {
    volunteerReportModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    volunteerReportForm.reset();
    clearStarRating();
});

cancelVolunteerReport.addEventListener('click', () => {
    volunteerReportModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    volunteerReportForm.reset();
    clearStarRating();
});

volunteerReportModal.addEventListener('click', function(e) {
    if (e.target === volunteerReportModal) {
        volunteerReportModal.classList.remove('active');
        document.body.style.overflow = 'auto';
        volunteerReportForm.reset();
        clearStarRating();
    }
});

// Close volunteer performance modal
closeVolunteerPerformanceModalBtn.addEventListener('click', () => {
    volunteerPerformanceModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

volunteerPerformanceModal.addEventListener('click', function(e) {
    if (e.target === volunteerPerformanceModal) {
        volunteerPerformanceModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Star rating functionality
let selectedRating = 0;
const stars = document.querySelectorAll('.star');
const performanceRatingInput = document.getElementById('performanceRating');
const ratingText = document.getElementById('ratingText');

const ratingLabels = {
    1: 'Unsatisfactory',
    2: 'Needs Improvement',
    3: 'Satisfactory',
    4: 'Good',
    5: 'Excellent'
};

stars.forEach(star => {
    star.addEventListener('click', function() {
        selectedRating = parseInt(this.dataset.rating);
        performanceRatingInput.value = selectedRating;
        updateStarDisplay();
        ratingText.textContent = ratingLabels[selectedRating];
        ratingText.style.color = selectedRating <= 2 ? '#e74c3c' : (selectedRating === 3 ? '#f39c12' : '#27ae60');
    });
    
    star.addEventListener('mouseenter', function() {
        const hoverRating = parseInt(this.dataset.rating);
        highlightStars(hoverRating);
    });
});

document.getElementById('starRating').addEventListener('mouseleave', function() {
    updateStarDisplay();
});

function highlightStars(rating) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
            star.textContent = '★';
        } else {
            star.classList.remove('active');
            star.textContent = '☆';
        }
    });
}

function updateStarDisplay() {
    stars.forEach((star, index) => {
        if (index < selectedRating) {
            star.classList.add('filled');
            star.textContent = '★';
        } else {
            star.classList.remove('filled');
            star.textContent = '☆';
        }
    });
}

function clearStarRating() {
    selectedRating = 0;
    performanceRatingInput.value = '';
    ratingText.textContent = 'Select rating';
    ratingText.style.color = '#7f8c8d';
    stars.forEach(star => {
        star.classList.remove('filled', 'active');
        star.textContent = '☆';
    });
}

// Open volunteer report modal
let currentReportContext = null;

function openVolunteerReportModal(taskId, wasteReportId) {
    const volunteerTasks = JSON.parse(localStorage.getItem('volunteerTasks') || '[]');
    const task = volunteerTasks.find(t => t.id === taskId);
    
    if (!task) {
        alert('Task not found');
        return;
    }
    
    if (task.status !== 'completed') {
        alert('Cannot report on incomplete task. Task must be completed first.');
        return;
    }
    
    if (!task.volunteerId) {
        alert('No volunteer assigned to this task');
        return;
    }
    
    const allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    const wasteReport = allReports.find(r => r.id === wasteReportId);
    
    if (!wasteReport) {
        alert('Associated report not found');
        return;
    }
    
    const allUsers = DB.getAllUsers();
    const volunteer = allUsers.find(u => u.id === task.volunteerId);
    
    if (!volunteer) {
        alert('Volunteer not found');
        return;
    }
    
    // Store context
    currentReportContext = {
        task: task,
        wasteReport: wasteReport,
        volunteer: volunteer
    };
    
    // Populate task info
    const issueTypeLabels = {
        'illegal-dumping': 'Illegal Dumping',
        'overflowing-bin': 'Overflowing Bin',
        'missed-collection': 'Missed Collection',
        'damaged-bin': 'Damaged Bin',
        'hazardous-waste': 'Hazardous Waste',
        'other': 'Other'
    };
    
    const taskInfoHtml = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
                <p style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Issue Type</p>
                <p style="font-size: 14px; color: #2c3e50; font-weight: 600;">${issueTypeLabels[wasteReport.issueType]}</p>
            </div>
            <div>
                <p style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Volunteer</p>
                <p style="font-size: 14px; color: #2c3e50; font-weight: 600;">${volunteer.fullname}</p>
            </div>
            <div>
                <p style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Completed Date</p>
                <p style="font-size: 14px; color: #2c3e50; font-weight: 600;">${new Date(task.completedAt).toLocaleDateString()}</p>
            </div>
            <div>
                <p style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Citizen</p>
                <p style="font-size: 14px; color: #2c3e50; font-weight: 600;">${wasteReport.userName}</p>
            </div>
        </div>
    `;
    
    document.getElementById('volunteerReportTaskInfo').innerHTML = taskInfoHtml;
    
    // Show modal
    volunteerReportModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Submit volunteer report
volunteerReportForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentReportContext) {
        alert('Invalid report context');
        return;
    }
    
    const reportType = document.getElementById('reportType').value;
    const performanceRating = parseInt(document.getElementById('performanceRating').value);
    const description = document.getElementById('reportDescription').value.trim();
    const evidenceNotes = document.getElementById('evidenceNotes').value.trim();
    
    // Validation
    if (!reportType) {
        alert('Please select a report type');
        return;
    }
    
    if (!performanceRating || performanceRating < 1 || performanceRating > 5) {
        alert('Please select a performance rating');
        return;
    }
    
    if (description.length < 20) {
        alert('Description must be at least 20 characters long');
        return;
    }
    
    // Confirmation
    if (!confirm('Are you sure you want to submit this volunteer performance report? This action cannot be undone.')) {
        return;
    }
    
    // Create volunteer report
    const volunteerReport = {
        reportId: Date.now() + Math.random(),
        taskId: currentReportContext.task.id,
        wasteReportId: currentReportContext.wasteReport.id,
        volunteerId: currentReportContext.volunteer.id,
        volunteerName: currentReportContext.volunteer.fullname,
        volunteerEmail: currentReportContext.volunteer.email,
        reportType: reportType,
        performanceRating: performanceRating,
        description: description,
        evidenceNotes: evidenceNotes || '',
        moderatorId: currentUser.id,
        moderatorName: currentUser.fullname,
        createdAt: new Date().toISOString(),
        isPositive: performanceRating >= 4 || reportType === 'positive-performance'
    };
    
    // Save to localStorage
    let volunteerReports = JSON.parse(localStorage.getItem('volunteerReports') || '[]');
    volunteerReports.push(volunteerReport);
    localStorage.setItem('volunteerReports', JSON.stringify(volunteerReports));
    
    // Update volunteer performance cache
    updateVolunteerPerformanceCache(currentReportContext.volunteer.id);
    
    // Close modal and reset
    volunteerReportModal.classList.remove('active');
    document.body.style.overflow = 'auto';
    volunteerReportForm.reset();
    clearStarRating();
    currentReportContext = null;
    
    alert('Volunteer performance report submitted successfully!');
    
    // Reload data
    loadAllReports();
    loadUsers();
});

// Calculate and cache volunteer performance
function updateVolunteerPerformanceCache(volunteerId) {
    const volunteerReports = JSON.parse(localStorage.getItem('volunteerReports') || '[]');
    const reports = volunteerReports.filter(r => r.volunteerId === volunteerId);
    
    if (reports.length === 0) {
        return null;
    }
    
    const totalReports = reports.length;
    const positiveReports = reports.filter(r => r.isPositive).length;
    const negativeReports = reports.filter(r => r.performanceRating <= 2).length;
    const averageRating = reports.reduce((sum, r) => sum + r.performanceRating, 0) / totalReports;
    const recentReports = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    
    // Calculate warning level
    let warningLevel = 'none';
    if (negativeReports >= 3) {
        warningLevel = 'high';
    } else if (negativeReports === 2 || averageRating < 3.0) {
        warningLevel = 'medium';
    } else if (negativeReports === 1) {
        warningLevel = 'low';
    }
    
    return {
        totalReports,
        positiveReports,
        negativeReports,
        averageRating,
        recentReports,
        warningLevel
    };
}

// Get volunteer performance summary
function getVolunteerPerformanceSummary(volunteerId) {
    return updateVolunteerPerformanceCache(volunteerId);
}

// View volunteer performance history
function viewVolunteerPerformance(volunteerId) {
    const allUsers = DB.getAllUsers();
    const volunteer = allUsers.find(u => u.id === volunteerId);
    
    if (!volunteer) {
        alert('Volunteer not found');
        return;
    }
    
    const volunteerReports = JSON.parse(localStorage.getItem('volunteerReports') || '[]');
    const reports = volunteerReports.filter(r => r.volunteerId === volunteerId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const performance = getVolunteerPerformanceSummary(volunteerId);
    
    const reportTypeLabels = {
        'quality-issues': 'Quality of Work Issues',
        'behavioral-issues': 'Behavioral Issues',
        'attendance-issues': 'Attendance Issues',
        'positive-performance': 'Positive Performance',
        'safety-violations': 'Safety Violations',
        'other-issues': 'Other Issues'
    };
    
    let contentHtml = `
        <div style="padding: 20px; background: #f9f9f9; border-radius: 12px; margin-bottom: 24px;">
            <h3 style="color: #2c3e50; margin-bottom: 16px;">${volunteer.fullname}</h3>
            <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 8px;">${volunteer.email}</p>
    `;
    
    if (performance) {
        const stars = '★'.repeat(Math.round(performance.averageRating)) + '☆'.repeat(5 - Math.round(performance.averageRating));
        contentHtml += `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-top: 16px;">
                <div>
                    <p style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Average Rating</p>
                    <p style="font-size: 20px; color: #2c3e50; font-weight: 600;">
                        <span style="color: #ffc107;">${stars}</span>
                        <span style="font-size: 14px; margin-left: 6px;">${performance.averageRating.toFixed(1)}</span>
                    </p>
                </div>
                <div>
                    <p style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Total Reports</p>
                    <p style="font-size: 20px; color: #2c3e50; font-weight: 600;">${performance.totalReports}</p>
                </div>
                <div>
                    <p style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Positive</p>
                    <p style="font-size: 20px; color: #27ae60; font-weight: 600;">${performance.positiveReports}</p>
                </div>
                <div>
                    <p style="font-size: 12px; color: #7f8c8d; margin-bottom: 4px;">Negative</p>
                    <p style="font-size: 20px; color: #e74c3c; font-weight: 600;">${performance.negativeReports}</p>
                </div>
            </div>
        `;
        
        if (performance.warningLevel !== 'none') {
            const warningColors = {
                'low': '#f39c12',
                'medium': '#e67e22',
                'high': '#e74c3c'
            };
            contentHtml += `
                <div style="margin-top: 16px; padding: 12px; background: ${performance.warningLevel === 'high' ? '#ffe5e5' : '#fff3cd'}; border-radius: 8px; border-left: 4px solid ${warningColors[performance.warningLevel]};">
                    <p style="color: ${warningColors[performance.warningLevel]}; font-weight: 600; font-size: 14px;">⚠ Warning Level: ${performance.warningLevel.toUpperCase()}</p>
                </div>
            `;
        }
    } else {
        contentHtml += `
            <p style="color: #7f8c8d; font-size: 14px; margin-top: 16px;">No performance reports on file</p>
        `;
    }
    
    contentHtml += `</div>`;
    
    // Report history
    contentHtml += `<h4 style="color: #2c3e50; margin-bottom: 16px;">Performance Report History</h4>`;
    
    if (reports.length === 0) {
        contentHtml += `<p style="color: #7f8c8d; text-align: center; padding: 40px;">No reports filed yet</p>`;
    } else {
        contentHtml += `<div style="display: flex; flex-direction: column; gap: 12px;">`;
        
        reports.forEach(report => {
            const stars = '★'.repeat(report.performanceRating) + '☆'.repeat(5 - report.performanceRating);
            const date = new Date(report.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            contentHtml += `
                <div class="report-history-item">
                    <div class="report-history-header">
                        <span class="report-type-badge ${report.reportType}">${reportTypeLabels[report.reportType]}</span>
                        <span style="font-size: 12px; color: #7f8c8d;">${date}</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <span style="color: #ffc107; font-size: 16px;">${stars}</span>
                        <span style="font-size: 14px; color: #2c3e50; margin-left: 8px; font-weight: 600;">${report.performanceRating}/5</span>
                    </div>
                    <p style="font-size: 14px; color: #555; margin-bottom: 8px; line-height: 1.5;">${report.description}</p>
                    ${report.evidenceNotes ? `<p style="font-size: 13px; color: #7f8c8d; padding: 8px; background: #f9f9f9; border-radius: 6px; margin-bottom: 8px;"><strong>Notes:</strong> ${report.evidenceNotes}</p>` : ''}
                    <p style="font-size: 12px; color: #95a5a6;">Reported by: ${report.moderatorName}</p>
                </div>
            `;
        });
        
        contentHtml += `</div>`;
    }
    
    document.getElementById('volunteerPerformanceContent').innerHTML = contentHtml;
    volunteerPerformanceModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Show volunteer performance preview in assignment section
function showVolunteerPerformancePreview(volunteerId) {
    const previewDiv = document.getElementById('volunteerPerformancePreview');
    
    if (!volunteerId || volunteerId === '') {
        previewDiv.innerHTML = '';
        return;
    }
    
    const performance = getVolunteerPerformanceSummary(parseInt(volunteerId));
    
    if (!performance) {
        previewDiv.innerHTML = `
            <div style="padding: 12px; background: #f9f9f9; border-radius: 8px; border-left: 3px solid #95a5a6;">
                <p style="font-size: 13px; color: #7f8c8d;">No performance history available</p>
            </div>
        `;
        return;
    }
    
    const stars = '★'.repeat(Math.round(performance.averageRating)) + '☆'.repeat(5 - Math.round(performance.averageRating));
    let bgColor = '#f9f9f9';
    let borderColor = '#667eea';
    
    if (performance.warningLevel === 'high') {
        bgColor = '#ffe5e5';
        borderColor = '#e74c3c';
    } else if (performance.warningLevel === 'medium') {
        bgColor = '#fff3cd';
        borderColor = '#f39c12';
    } else if (performance.warningLevel === 'low') {
        bgColor = '#fff3cd';
        borderColor = '#f39c12';
    }
    
    let previewHtml = `
        <div style="padding: 12px; background: ${bgColor}; border-radius: 8px; border-left: 3px solid ${borderColor};">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <div>
                    <span style="color: #ffc107; font-size: 14px;">${stars}</span>
                    <span style="font-size: 13px; color: #2c3e50; margin-left: 6px; font-weight: 600;">${performance.averageRating.toFixed(1)}/5</span>
                </div>
                <button onclick="viewVolunteerPerformance(${volunteerId})" style="padding: 4px 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; font-weight: 600;">View History</button>
            </div>
            <div style="display: flex; gap: 12px; font-size: 12px;">
                <span style="color: #27ae60;">✓ ${performance.positiveReports} positive</span>
                <span style="color: #e74c3c;">✗ ${performance.negativeReports} negative</span>
                <span style="color: #7f8c8d;">${performance.totalReports} total</span>
            </div>
    `;
    
    if (performance.warningLevel !== 'none') {
        previewHtml += `
            <div style="margin-top: 8px; padding: 6px 10px; background: ${performance.warningLevel === 'high' ? '#c0392b' : '#f39c12'}; color: white; border-radius: 6px; font-size: 11px; font-weight: 600;">
                ⚠ WARNING: ${performance.warningLevel.toUpperCase()} - ${performance.negativeReports} negative report${performance.negativeReports !== 1 ? 's' : ''}
            </div>
        `;
    }
    
    previewHtml += `</div>`;
    
    previewDiv.innerHTML = previewHtml;
}

// Open volunteer report modal from report detail
function openVolunteerReportModalFromReport(reportId) {
    const allReports = JSON.parse(localStorage.getItem('wasteReports') || '[]');
    const report = allReports.find(r => r.id === reportId);
    
    if (!report) {
        alert('Report not found');
        return;
    }
    
    if (!report.assignedVolunteerId) {
        alert('No volunteer assigned to this report');
        return;
    }
    
    // Find the corresponding volunteer task
    const volunteerTasks = JSON.parse(localStorage.getItem('volunteerTasks') || '[]');
    const task = volunteerTasks.find(t => t.reportId === reportId && t.volunteerId === report.assignedVolunteerId);
    
    if (!task) {
        alert('Volunteer task not found');
        return;
    }
    
    // Close report detail modal
    reportDetailModal.classList.remove('active');
    
    // Open volunteer report modal
    openVolunteerReportModal(task.id, reportId);
}

// ========== MANAGE USER SUSPENSION ==========
function manageUserSuspension(userEmail) {
    const allUsers = DB.getAllUsers();
    const user = allUsers.find(u => u.email === userEmail);
    
    if (!user || user.role !== 'citizen') {
        alert('User not found or not a citizen');
        return;
    }
    
    const rejectionCount = user.rejectionCount || 0;
    const isSuspended = user.isSuspended || false;
    
    let message = `Citizen: ${user.fullname}
Email: ${userEmail}
Rejected Reports: ${rejectionCount}

`;
    
    if (isSuspended) {
        const suspendedUntil = user.suspendedUntil ? new Date(user.suspendedUntil).toLocaleDateString() : 'Permanently';
        message += `Current Status: SUSPENDED
Suspended Until: ${suspendedUntil}
Reason: ${user.suspensionReason || 'Not specified'}

`;
        message += 'Choose an action:\n1. Enter "remove" to lift suspension\n2. Enter new number of days to extend suspension\n3. Click Cancel to go back';
        
        const action = prompt(message);
        
        if (action === null) return;
        
        if (action.toLowerCase() === 'remove') {
            if (confirm('Are you sure you want to remove the suspension?')) {
                DB.updateUser(userEmail, {
                    isSuspended: false,
                    suspendedUntil: null,
                    suspendedBy: null,
                    suspensionReason: null
                });
                alert('Suspension removed successfully!');
                loadUsers();
            }
        } else {
            const days = parseInt(action);
            if (isNaN(days) || days < 1) {
                alert('Invalid number of days. Please enter a positive number.');
                return;
            }
            
            const reason = prompt('Enter reason for extending suspension (optional):');
            if (reason === null) return;
            
            const suspendedUntil = new Date();
            suspendedUntil.setDate(suspendedUntil.getDate() + days);
            
            DB.updateUser(userEmail, {
                isSuspended: true,
                suspendedUntil: suspendedUntil.toISOString(),
                suspendedBy: currentUser.fullname,
                suspensionReason: reason || user.suspensionReason || 'Multiple report rejections'
            });
            
            alert(`Suspension extended by ${days} day(s).\nNew end date: ${suspendedUntil.toLocaleDateString()}`);
            loadUsers();
        }
    } else {
        message += `Status: ACTIVE\n\n`;
        if (rejectionCount >= 5) {
            message += `⚠ WARNING: This citizen has ${rejectionCount} rejected reports!\n\n`;
        }
        message += 'Enter the number of days to suspend this account\n(Enter 0 for permanent suspension, or click Cancel to go back):';
        
        const daysInput = prompt(message);
        
        if (daysInput === null) return;
        
        const days = parseInt(daysInput);
        if (isNaN(days) || days < 0) {
            alert('Invalid input. Please enter a number of days (0 or greater).');
            return;
        }
        
        const reason = prompt('Enter reason for suspension:');
        if (reason === null) return;
        
        if (!reason.trim()) {
            alert('Please provide a reason for suspension.');
            return;
        }
        
        if (!confirm(`Suspend ${user.fullname} for ${days === 0 ? 'PERMANENT' : days + ' day(s)'}?`)) {
            return;
        }
        
        const suspendedUntil = days === 0 ? null : new Date();
        if (days > 0) {
            suspendedUntil.setDate(suspendedUntil.getDate() + days);
        }
        
        DB.updateUser(userEmail, {
            isSuspended: true,
            suspendedUntil: suspendedUntil ? suspendedUntil.toISOString() : null,
            suspendedBy: currentUser.fullname,
            suspensionReason: reason
        });
        
        if (days === 0) {
            alert(`Account permanently suspended.`);
        } else {
            alert(`Account suspended for ${days} day(s).\nSuspension ends: ${suspendedUntil.toLocaleDateString()}`);
        }
        
        loadUsers();
    }
}
