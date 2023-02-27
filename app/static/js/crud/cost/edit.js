$(document).ready(function(){
    const updateForm = document.getElementById('update-form');
    const toast_message_div = document.getElementById('toast_message');
    const toast_title_div = document.getElementById('toast_title');

    // populate form with default data
    fetch(`/cost/${costId}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('start-input').value = data.start;
        document.getElementById('end-input').value = data.end;
        document.getElementById('kwh-input').value = data.kwh;
        document.getElementById('smc-input').value = data.smc;
        document.getElementById('kwh_cost-input').value = data.kwh_cost;
        document.getElementById('smc_cost-input').value = data.smc_cost;
    })
    .catch(error => {
        console.error(error);
        toast(`Error`,`Error retrieving cost record`)
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

        fetch(`/cost/${costId}`, {
            method: 'PUT',
            body: JSON.stringify({start, end, kwh, smc, kwh_cost, smc_cost}),
            headers: {'Content-Type': 'application/json'}
        })
        .then(response => response.json())
        .then(data => {
            toast(`Success`,`Cost updated with ID ${data.id}`)
            // Wait for 3 seconds (3000 milliseconds)
            setTimeout(() => {
              // Change page location to "https://www.example.com"
              window.location.href = "/cost/list";
            }, 3000);
        })
        .catch(error => {
            console.error(error);
            toast(`Error`,`Error updating cost`)
        });
    });
});
