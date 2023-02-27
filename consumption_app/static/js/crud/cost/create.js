$(document).ready(function(){
    const createForm = document.getElementById('create-form');
    const toast_message_div = document.getElementById('toast_message');
    const toast_title_div = document.getElementById('toast_title');

    /*const now = new Date();
    document.getElementById('start-input').value = now;
    document.getElementById('end-input').value = now;*/

    createForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(createForm);
        const start = formData.get('start');
        const end = formData.get('end');
        const kwh = formData.get('kwh');
        const smc = formData.get('smc');
        const kwh_cost = formData.get('kwh_cost');
        const smc_cost = formData.get('smc_cost');

        fetch(`/cost`, {
            method: 'POST',
            body: JSON.stringify({start, end, kwh, smc, kwh_cost, smc_cost}),
            headers: {'Content-Type': 'application/json'}
        })
        .then(response => response.json())
        .then(data => {
            toast(`Success`,`Cost create with ID ${data.id}`)
            // Wait for 3 seconds (3000 milliseconds)
            setTimeout(() => {
              window.location.href = "/cost/list";
            }, 3000);
        })
        .catch(error => {
            console.error(error);
            toast(`Error`,`Error creating cost`)
        });
    });
});

