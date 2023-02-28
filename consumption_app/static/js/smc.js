function smc_drawChart(jsonDataChart, container_div_id) {
  var data = new google.visualization.arrayToDataTable([jsonDataChart.header].concat(jsonDataChart.body));
  var options = {
    title: jsonDataChart.chart_title,
    legend: { position: 'bottom' },
    hAxis: {
      title: 'Year',
      format: 'yyyy'
    },
    vAxis: {
      title: jsonDataChart.data_title,
      format: jsonDataChart.data_format
    }
  };

  var chart = new google.charts.Bar(document.getElementById(container_div_id));
  chart.draw(data, google.charts.Bar.convertOptions(options));
}

function smc_year_drawChart(jsonDataChart, container_div_id) {
  var data = new google.visualization.arrayToDataTable([jsonDataChart.header].concat(jsonDataChart.body));
  var options = {
    title: jsonDataChart.chart_title,
    legend: { position: 'bottom' },
    hAxis: {
      title: 'Year',
      format: 'yyyy'
    },
    vAxis: {
      title: jsonDataChart.data_title,
      format: jsonDataChart.data_format
    }
  };

  var chart = new google.charts.Bar(document.getElementById(container_div_id));
  chart.draw(data, google.charts.Bar.convertOptions(options));
}