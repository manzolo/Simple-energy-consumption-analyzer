$(document).ready(function(){
    const updateForm = document.getElementById('update-form');
    const toast_message_div = document.getElementById('toast_message');
    const toast_title_div = document.getElementById('toast_title');

    // populate form with default data
    fetch(`/cost/${costId}`)
    .then(response => response.json())
    .then(data => {
        // Converti le date in formato YYYY-MM-DD per l'input date
        if (data.start) {
            // Rimuovi la parte con l'ora se presente
            const startDate = data.start.split('T')[0];
            document.getElementById('start-input').value = startDate;
        }
        
        if (data.end) {
            // Rimuovi la parte con l'ora se presente
            const endDate = data.end.split('T')[0];
            document.getElementById('end-input').value = endDate;
        }
        
        document.getElementById('kwh-input').value = data.kwh;
        document.getElementById('smc-input').value = data.smc;
        document.getElementById('kwh_cost-input').value = data.kwh_cost;
        document.getElementById('smc_cost-input').value = data.smc_cost;
    })
    .catch(error => {
        console.error(error);
        toast(T('error'), T('period_load_failed'), true, 5000, 'error');
    });

    updateForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(updateForm);
        const start = formData.get('start');
        const end = formData.get('end');
        const kwh = formData.get('kwh');
        const smc = formData.get('smc');
        const kwh_cost = formData.get('kwh_cost');
        const smc_cost = formData.get('smc_cost');

        showLoading();

        fetch(`/cost/${costId}`, {
            method: 'PUT',
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