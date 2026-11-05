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
            toast(T('success'), T('period_saved', { id: data.id }), true, 3000, 'success');
            setTimeout(() => {
              window.location.href = "/cost/list";
            }, 1200);
        })
        .catch(error => {
            hideLoading();
            console.error(error);
            toast(T('error'), T('period_save_failed'), true, 5000, 'error');
        });
    });
});