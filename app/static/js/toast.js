function toast(title, message, autohide = true, delay = 5000, type = 'info') {
    const titleDiv = document.getElementById('toast_title');
    const messageDiv = document.getElementById('toast_message');
    const iconDiv = document.getElementById('toastIcon');
    
    // Set icon based on type
    const icons = {
        'success': 'bi-check-circle-fill text-success',
        'error': 'bi-x-circle-fill text-danger',
        'warning': 'bi-exclamation-triangle-fill text-warning',
        'info': 'bi-info-circle-fill text-primary'
    };
    
    // Detect type from title if not specified
    if (type === 'info') {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('success')) type = 'success';
        else if (lowerTitle.includes('error') || lowerTitle.includes('fail')) type = 'error';
        else if (lowerTitle.includes('warning')) type = 'warning';
    }
    
    iconDiv.className = 'bi me-2 ' + (icons[type] || icons['info']);
    titleDiv.textContent = title;
    messageDiv.textContent = message;
    
    const toastEl = document.getElementById('appToast');
    const toast = new bootstrap.Toast(toastEl, {
        autohide: autohide,
        delay: delay
    });
    
    toast.show();
}