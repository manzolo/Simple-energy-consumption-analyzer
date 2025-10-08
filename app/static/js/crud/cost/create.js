$(document).ready(function(){
    const createForm = document.getElementById('create-form');
    const toast_message_div = document.getElementById('toast_message');
    const toast_title_div = document.getElementById('toast_title');

    createForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(createForm);
        const start = formData.get('start');
        const end = formData.get('end');
        const kwh = formData.get('kwh');
        const smc = formData.get('smc');
        const kwh_cost = formData.get('kwh_cost');
        const smc_cost = formData.get('smc_cost');

        showLoading();

        fetch(`/cost`, {
            method: 'POST',
            body: JSON.stringify({start, end, kwh, smc, kwh_cost, smc_cost}),
            headers: {'Content-Type': 'application/json'}
        })
        .then(response => response.json())
        .then(data => {
            hideLoading();
            toast('Success', `Cost created with ID ${data.id}`, true, 3000);
            setTimeout(() => {
              window.location.href = "/cost/list";
            }, 3000);
        })
        .catch(error => {
            hideLoading();
            console.error(error);
            toast('Error', 'Error creating cost', true, 5000);
        });
    });
});