$(document).ready(function(){
    const updateForm = document.getElementById('update-form');
    const toast_message_div = document.getElementById('toast_message');
    const toast_title_div = document.getElementById('toast_title');

    // populate form with default data
    fetch(`/consumption/${consumptionId}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('year-input').value = data.year;
        document.getElementById('month-input').value = data.month;
        document.getElementById('kwh-input').value = data.kwh;
        document.getElementById('smc-input').value = data.smc;
    })
    .catch(error => {
        console.error(error);
        toast(`Error`,`Error retrieving consumption record`)
    });

    updateForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(updateForm);
        const year = formData.get('year');
        const month = formData.get('month');
        const kwh = formData.get('kwh');
        const smc = formData.get('smc');

        fetch(`/consumption/${consumptionId}`, {
            method: 'PUT',
            body: JSON.stringify({year, month, kwh, smc}),
            headers: {'Content-Type': 'application/json'}
        })
        .then(response => response.json())
        .then(data => {
            toast(`Success`,`Consumption updated with ID ${data.id}`)
            // Wait for 3 seconds (3000 milliseconds)
            setTimeout(() => {
              // Change page location to "https://www.example.com"
              window.location.href = "/consumption/list";
            }, 3000);
        })
        .catch(error => {
            console.error(error);
            toast(`Error`,`Error updating consumption`)
        });
    });
});
