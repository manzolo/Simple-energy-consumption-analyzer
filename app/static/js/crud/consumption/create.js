$(document).ready(function(){
    const createForm = document.getElementById('create-form');
    const toast_message_div = document.getElementById('toast_message');
    const toast_title_div = document.getElementById('toast_title');

    const now = new Date();

    document.getElementById('year-input').value = now.getFullYear();
    document.getElementById('month-input').value = now.getMonth() + 1;

    createForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(createForm);
        const year = formData.get('year');
        const month = formData.get('month');
        const kwh = formData.get('kwh');
        const smc = formData.get('smc');

        fetch(`/consumption`, {
            method: 'POST',
            body: JSON.stringify({year, month, kwh, smc}),
            headers: {'Content-Type': 'application/json'}
        })
        .then(response => response.json())
        .then(data => {
            toast(`Success`,`Consumption create with ID ${data.id}`)
            // Wait for 3 seconds (3000 milliseconds)
            setTimeout(() => {
              window.location.href = "/consumption/list";
            }, 3000);
        })
        .catch(error => {
            console.error(error);
            toast(`Error`,`Error creating consumption`)
        });
    });
});

