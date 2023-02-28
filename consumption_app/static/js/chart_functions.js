let chartType;

$(document).ready(() => {

  // Get references to the checkbox and chart
  const checkbox = document.getElementById("ChangeChartType");

  // Determine the initial chart type based on the checkbox state
  chartType = getChartType(checkbox);

  // Add an event listener to the checkbox
  checkbox.addEventListener("change", () => {
    // Determine which chart type to switch to
    chartType = getChartType(checkbox);
    document.querySelector('.tab-links.active').click();
  });

  // Display the initial chart
  document.querySelector('.tab-links.active').click();

});

const getChartType = checkbox => {
  // Determine the initial chart type based on the checkbox state
  return checkbox.checked ? "line" : "bar";
}

const openChart = (evt, chartName, chartData) => {
  const tabcontents = document.querySelectorAll(".tab-content");
  for (const tabcontent of tabcontents) {
    tabcontent.style.display = "none";
  }
  const tablinks = document.querySelectorAll(".tab-links");
  for (const tablink of tablinks) {
    tablink.classList.remove("active");
  }
  document.getElementById(chartName).style.display = "block";
  evt.currentTarget.classList.add("active");
  if (Object.keys(chartData).length !== 0 && chartData.body.length > 0) {
    const options = {
      title: chartData.chart_title,
      legend: { position: 'bottom' },
      hAxis: {
        title: 'Year',
        format: 'yyyy'
      },
      vAxis: {
        title: chartData.data_title,
        format: chartData.data_format
      }
    };
    drawChart(chartData, chartName, chartType, options);
  } else {
    console.log('No data available to draw the chart');
  }
}

const drawChart = (jsonDataChart, container_div_id, chartType, options) => {
  google.charts.load('current', { packages: [chartType === 'line' ? 'corechart' : 'bar'] });
  google.charts.setOnLoadCallback(() => {
    const data = new google.visualization.arrayToDataTable([jsonDataChart.header].concat(jsonDataChart.body));
    let chart;
    if (chartType === 'bar') {
      chart = new google.charts.Bar(document.getElementById(container_div_id));
    } else if (chartType === 'line') {
      chart = new google.visualization.LineChart(document.getElementById(container_div_id));
    }
    chart.draw(data, options);
  });
}