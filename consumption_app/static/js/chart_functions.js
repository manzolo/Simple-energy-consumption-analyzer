let chartType = "bar"; // Default chart type bar

$(document).ready(() => {
    google.charts.load('current', { packages: ['line', 'corechart', 'bar'] });
    const radioButtons = document.querySelectorAll('input[name="chartType"]');
    radioButtons.forEach((radioButton) => {
      if (radioButton.value === "bar") {
        radioButton.checked = true;
        chartType = "bar";
      }
    });
    
    radioButtons.forEach((radioButton) => {
      radioButton.addEventListener("click", () => {
        chartType = radioButton.value;
        // Ridisegna i grafici visibili
        redrawVisibleCharts();
      });
    });
});

// Funzione per ridisegnare i grafici visibili
function redrawVisibleCharts() {
    const options = {
        curveType: 'function',
        legend: { position: 'bottom' },
        height: 450
    };

    // Check which tab is active and redraw only that chart
    if ($('#kwh-tab').hasClass('active')) {
        drawChart(kwhJsonDataChart, 'kwh_chart_div', chartType, {
            ...options,
            title: 'Monthly Electricity Consumption',
            vAxis: { title: 'kWh' }
        });
    } else if ($('#smc-tab').hasClass('active')) {
        drawChart(smcJsonDataChart, 'smc_chart_div', chartType, {
            ...options,
            title: 'Monthly Gas Consumption',
            vAxis: { title: 'Smc' }
        });
    }
    
    // Grafici dettagliati (solo se il collapse è aperto)
    if ($('#detailedChartsCollapse').hasClass('show')) {
        const detailedOptions = { ...options, height: 300 };
        drawChart(kwhUnitJsonDataChart, 'kwh_unit_chart_div', chartType, detailedOptions);
        drawChart(smcUnitJsonDataChart, 'smc_unit_chart_div', chartType, detailedOptions);
        drawChart(kwhMonthJsonDataChart, 'kwh_month_chart_div', chartType, detailedOptions);
        drawChart(smcMonthJsonDataChart, 'smc_month_chart_div', chartType, detailedOptions);
    }
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
      curveType: 'function',
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
  
  google.charts.setOnLoadCallback(() => {
    const data = new google.visualization.arrayToDataTable([jsonDataChart.header].concat(jsonDataChart.body));
    let chart;
    if (chartType === 'bar') {
      chart = new google.charts.Bar(document.getElementById(container_div_id));
    } else if (chartType === 'line') {
        chart = new google.charts.Line(document.getElementById(container_div_id));
    } else if (chartType === 'curve-line') {
      chart = new google.visualization.LineChart(document.getElementById(container_div_id));
    } else if (chartType === 'pie') {
      chart = new google.visualization.PieChart(document.getElementById(container_div_id));
    }

    chart.draw(data, options);
  });
}