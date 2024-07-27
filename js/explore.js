// Function to clear the chart area
function exploreClearChartArea() {
  d3.select("#chart-container").selectAll("*").remove();
  document.getElementById('select-type').style.display = 'block';
  document.querySelectorAll('input[name="groupBy"]').forEach(radio => {
    radio.addEventListener('change', loadScene5);
  });
  d3.select(".description").html("    <p>\n" +
    "      Explore the salary distribution across different job types in the chart. Hover over the bars to view detailed information, including the average salary and the number of jobs available for each salary range.\n" +
    "    </p>");
}

// Function to create and return SVG element
function exploreCreateSvg(margin, width, height) {
  return d3.select("#chart-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
}

// Function to set up scales
function exploreSetupScales(dataset, width, height) {
  const x = d3.scaleBand()
    .domain(dataset.map(d => d.range))
    .range([0, width])
    .padding(0.1);

  const y = d3.scaleLinear()
    .domain([0, d3.max(dataset, d => d.totalJobCount)])
    .nice()
    .range([height, 0]);

  return { x, y };
}

// Function to add axes with labels
function exploreAddAxes(svg, x, y, height, width, xAxisLabel, yAxisLabel) {
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append("g")
    .call(d3.axisLeft(y));

  // Add X axis label
  svg.append("text")
    .attr("transform", `translate(${width / 2},${height + 40})`)
    .style("text-anchor", "middle")
    .text(xAxisLabel);

  // Add Y axis label
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left + 20)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .text(yAxisLabel);
}

// Function to draw stacked bars
function exploreDrawStackedBars(svg, dataset, x, y, height, color, keys, labels) {
  const stackedData = d3.stack()
    .keys(keys)
    .value((d, key) => d.jobCounts[key])(dataset);

  const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "lightsteelblue")
    .style("border", "1px solid #ddd")
    .style("border-radius", "8px")
    .style("padding", "8px")
    .style("pointer-events", "none");

  svg.selectAll(".layer")
    .data(stackedData)
    .enter().append("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key))
    .selectAll("rect")
    .data(d => d)
    .enter().append("rect")
    .attr("x", d => x(d.data.range))
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .on("mouseover", function (event, d) {
      const key = this.parentNode.__data__.key;
      const jobCount = d[1] - d[0];
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(labels[key] + '<br/>Jobs: ' + jobCount)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY + 5) + "px");
    })
    .on("mousemove", function (event) {
      tooltip.style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY + 5) + "px");
    })
    .on("mouseout", function () {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// Function to draw legends
function exploreDrawLegend(svg, color, keys, labels, width) {
  const legend = svg.append("g")
    .attr("transform", `translate(${width + 10}, 20)`);

  keys.forEach((key, i) => {
    const legendRow = legend.append("g")
      .attr("transform", `translate(0, ${i * 20})`);

    legendRow.append("rect")
      .attr("width", 18)
      .attr("height", 18)
      .attr("fill", color(key));

    legendRow.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", "0.35em")
      .text(labels[key]);
  });
}

// Main function to load and render the stacked bar chart
function loadScene5() {
  const margin = { top: 20, right: 150, bottom: 50, left: 100 };
  const width = 960 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  exploreClearChartArea();

  d3.csv("../data/ds_salaries.csv").then(data => {
    // Convert salary to number
    data.forEach(d => {
      d.salary_in_usd = +d.salary_in_usd;
    });

    // Get the selected grouping criterion from radio buttons
    const groupingCriterion = document.querySelector('input[name="groupBy"]:checked').value;

    // Define grouping keys and labels based on the criterion
    let keys = [];
    let labels = {};
    switch (groupingCriterion) {
      case 'experience_level':
        keys = ["EN", "MI", "SE", "EX"];
        labels = {
          "EN": "Junior",
          "MI": "Mid Level",
          "SE": "Senior",
          "EX": "Executive"
        };
        break;
      case 'employment_type':
        keys = ["FT", "PT", "CT", "FL"];
        labels = {
          "FT": "Full Time",
          "PT": "Part Time",
          "CT": "Contract",
          "FL": "Freelancer"
        };
        break;
      case 'company_size':
        keys = ["S", "M", "L"];
        labels = {
          "S": "Small",
          "M": "Medium",
          "L": "Large"
        };
        break;
      case 'remote_ratio':
        keys = ["On-site", "Hybrid", "Remote"];
        labels = {
          "On-site": "On-site",
          "Hybrid": "Hybrid",
          "Remote": "Remote"
        };
        data.forEach(d => {
          // Map remote_ratio values to human-readable types
          d.remote_ratio = d.remote_ratio == 100 ? "Remote" : (d.remote_ratio == 50 ? "Hybrid" : "On-site");
        });
        break;
    }

    // Create salary distribution dataset with the selected grouping
    const binWidth = 25000; // Bin width of $25,000
    const bins = d3.histogram()
      .thresholds(d3.range(0, 200000 + binWidth, binWidth))
      .value(d => d.salary_in_usd)(data);

    // Calculate job count in each bin and categorize by the selected criterion
    const dataset = bins.map(bin => {
      const jobCounts = keys.reduce((acc, key) => {
        acc[key] = 0;
        return acc;
      }, {});
      bin.forEach(d => {
        jobCounts[d[groupingCriterion]] += 1;
      });
      return {
        range: `${bin.x0} - ${bin.x1}`,
        jobCounts,
        totalJobCount: d3.sum(keys.map(key => jobCounts[key]))
      };
    });

    // Create SVG
    const svg = exploreCreateSvg(margin, width, height);

    // Setup scales
    const { x, y } = exploreSetupScales(dataset, width, height);

    // Add axes with labels
    exploreAddAxes(svg, x, y, height, width, "Salary Range (USD)", "Number of Jobs");

    // Setup color scale
    const color = d3.scaleOrdinal()
      .domain(keys)
      .range(d3.schemeCategory10);

    // Draw stacked bars with tooltips
    exploreDrawStackedBars(svg, dataset, x, y, height, color, keys, labels);

    // Draw legends with labels
    exploreDrawLegend(svg, color, keys, labels, width);

    // Add informational text about tooltips
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10) // Positioning the text slightly above the chart
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "black")
      .style("opacity", 0.5)
      .text("Hover over the bars to see more details");
  });
}

// Add event listener to radio buttons to update the chart when selection changes
document.querySelectorAll('input[name="groupBy"]').forEach(radio => {
  radio.addEventListener('change', loadScene5);
});
