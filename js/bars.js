const margin = { top: 70, right: 30, bottom: 70, left: 80 };
const width = 600 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const dataPath = "../data/ds_salaries.csv";

// Function to set up chart with title, description, and axis labels
const chartSetup = (svg, x, y, axisTitles, chartTitle, description) => {
  // Add chart title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(chartTitle);

  // Add description
  d3.select(".description")
    .html(description);

  // Add x-axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));

  // Add y-axis
  svg.append("g")
    .call(d3.axisLeft(y));

  // Add x-axis label
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(-50,${height / 2}) rotate(-90)`)
    .text(axisTitles['x']);

  // Add y-axis label
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", `translate(${width / 2},${height + 50})`)
    .text(axisTitles['y']);
};

// Function to draw bar chart
const drawBars = (svg, dataset, x, y) => {
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const bars = svg.selectAll(".bar")
    .data(dataset)
    .enter().append("rect")
    .attr("x", d => x(d.title))
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", (d, i) => color(i));

  bars.transition()
    .duration(1000)
    .attr("y", d => y(d.value))
    .delay((d, i) => i * 100)
    .attr("height", function(d) { return height - y(d.value); });

  // Add value labels to bars
  svg.selectAll(".bar-label")
    .data(dataset)
    .enter().append("text")
    .attr("class", "bar-label")
    .attr("x", d => x(d.title) + x.bandwidth() / 2)
    .attr("y", d => y(d.value) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#000")
    .text(d => d.value);
};

// Function to draw pie chart
const drawPieChart = (svg, dataset, pieTitle) => {
  const radius = 600 / 3;
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const pie = d3.pie()
    .value(d => d.count);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);

  const pieGroup = svg.append("g")
    .attr("transform", `translate(${width + margin.right + radius + 150},${height / 2})`);

  const arcs = pieGroup.selectAll(".arc")
    .data(pie(dataset))
    .enter().append("g")
    .attr("class", "arc");

  arcs.append("path")
    .attr("d", arc)
    .attr("fill", (d, i) => color(i))
    .transition()
    .duration(1000)
    .attrTween("d", function(d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return function(t) {
        return arc(i(t));
      };
    });

  // Add value labels to pie chart
  arcs.append("text")
    .attr("transform", function(d) { return `translate(${arc.centroid(d)})`; })
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#fff")
    .text(d => d.data.count);

  // Add legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width + margin.right + 2 * radius + 180}, 20)`);

  legend.selectAll(".legend-item")
    .data(dataset)
    .enter().append("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`)
    .each(function(d, i) {
      d3.select(this).append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", color(i));

      d3.select(this).append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .text(d.title);
    });

  // Add pie chart title
  pieGroup.append("text")
    .attr("x", 0)
    .attr("y", -radius - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text(pieTitle);
};

// Function to create SVG element
const createSvg = () => {
  return d3.select("#chart-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right + 700) // Adjusted width for pie chart
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
};

// Function to process data
const processData = (data, keyMapper) => {
  data.forEach(d => {
    d.salary_in_usd = +d.salary_in_usd; // Convert salary to number
    d.mappedKey = keyMapper[d.key]; // Map keys
  });

  const meanSalaries = d3.group(data, d => d.mappedKey);
  const dataset = Array.from(meanSalaries, ([key, values]) => ({
    title: key,
    value: Math.round(d3.mean(values, d => d.salary_in_usd))
  }));

  // Find number of jobs for each key
  dataset.forEach(d => {
    d.count = data.filter(x => x.mappedKey === d.title).length;
  });

  dataset.sort((x, y) => d3.descending(x.title, y.title)).reverse();
  return dataset;
};

// Function to load and render each scene
const loadScene = (key, keyMapper, axisTitles, chartTitle, pieTitle, description) => {
  initializeChartArea();

  d3.csv(dataPath).then(data => {
    const x = d3.scaleBand().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    data.forEach(d => d.key = d[key]);

    const dataset = processData(data, keyMapper);

    const svg = createSvg();

    x.domain(dataset.map(d => d.title));
    y.domain([0, d3.max(dataset, d => d.value)]);

    chartSetup(svg, x, y, axisTitles, chartTitle, description);
    drawBars(svg, dataset, x, y);
    drawPieChart(svg, dataset, pieTitle);
  });
};

// Load scenes with specific configurations
function loadScene1() {
  const experienceTitles = {
    'EN': 'Junior',
    'MI': 'Mid Level',
    'SE': 'Senior',
    'EX': 'Executive'
  };

  const axisTitles = {
    'y': 'Experience Level',
    'x': 'Salary in USD',
  };

  const description = "<p>This chart compares the average salary across different experience levels.</p>" +
    "<p> Executive level jobs have the highest average salary. But, the number of jobs are less in that level.</p>" +
    "<p> Senior level jobs have the second highest average salary and the number of jobs are higher than all other level.</p>"

  loadScene('experience_level', experienceTitles, axisTitles, "Experience Level vs Salary", "Job Count by Experience Level", description);
}

function loadScene2() {
  const employmentTypes = {
    'FT': 'Full Time',
    'CT': 'Contract',
    'PT': 'Part Time',
    'FL': 'Freelancer',
  };

  const axisTitles = {
    'y': 'Employment Type',
    'x': 'Salary in USD',
  };

  const description = "<p>This chart shows the average salary by different types of employment.</p>" +
    "<p>Full Time jobs have the highest average salary and the highest number of jobs.</p>" +
    "<p>Employers prefer fulltime employees for datascientist positions. As you can see 99% of the jobs are full time.</p>";

  loadScene('employment_type', employmentTypes, axisTitles, "Employment Type vs Salary", "Job Count by Employment Type", description);
}

function loadScene3() {
  const companySizeTitles = {
    'S': 'Small',
    'M': 'Medium',
    'L': 'Large'
  };

  const axisTitles = {
    'y': 'Company Size',
    'x': 'Salary in USD',
  };

  const description = "<p>This chart illustrates the average salary based on company size.</p>" +
    "<p>Medium size companies have the highest average salary and the highest number of jobs.</p>";

  loadScene('company_size', companySizeTitles, axisTitles, "Company Size vs Salary", "Job Count by Company Size", description);
}

function loadScene4() {
  const remoteTypes = {
    0: 'Fully Remote',
    100: 'Fully Onsite',
    50: 'Hybrid',
  };

  const axisTitles = {
    'y': 'Remote Type',
    'x': 'Salary in USD',
  };

  const description = "<p>This chart details the average salary for various remote work arrangements.</p>" +
    "<p>Fully remore and onsite jobs have almost same salary and same number of jobs, but slightly higher for full remote jobs.</p>" +
    "<p>Surprisingly based on data hybrid data scientist jobs have the lowest average salary and the lowest number of jobs.</p>";

  loadScene('remote_ratio', remoteTypes, axisTitles, "Job Location vs Salary", "Job Count by Remote Type", description);
}
