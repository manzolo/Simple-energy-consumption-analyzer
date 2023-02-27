function openChart(evt, chartName, chartData) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-links");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(chartName).style.display = "block";
    evt.currentTarget.className += " active";
    if (Object.keys(chartData).length !== 0 && chartData.body.length > 0) {
        google.charts.load('current', { 'packages': ['bar'] });
        google.charts.setOnLoadCallback(function () {
            kwh_drawChart(chartData, chartName);
        });
    } else {
        // chartData is empty, display a message or do nothing
        console.log('No data available to draw the chart');
    }
}
$(document).ready(function(){
    document.querySelector('.tab-links.active').click();
});
