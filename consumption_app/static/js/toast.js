function toast(title, message, autohide=true, delay=5000) {
    const titleDiv = document.getElementById('toast_title');
    const messageDiv = document.getElementById('toast_message');
    titleDiv.textContent = title;
    messageDiv.textContent = message;
    $("#appToast").toast("show");
}
