// Function to clear the chart area
function initializeChartArea() {
    document.getElementById('select-type').style.display = 'none';
    d3.select("#chart-container").selectAll("*").remove();
    d3.select(".description").html(`
        <p>
            This visualization provides insights into the dataset of data scientist salaries for the year 2023. It showcases the distribution of salaries across different attributes such as experience level, employment type, job location, and company size. Use this visualization to explore how salaries vary with different factors and understand the overall salary trends in the data scientist job market.
        </p>
    `);
}

// Function to create and return SVG element
function myChartCreateSvg(margin, width, height) {
    return d3.select("#chart-container")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
}

// Function to configure scales for the chart
function myChartConfigureScales(dataset, width, height) {
    const x = d3.scaleLinear()
      .domain(d3.extent(dataset, d => d.date))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(dataset, d => d.value)])
      .range([height, 0]);

    return { x, y };
}

// Function to add x and y axes with labels
function myChartAddAxes(svg, x, y, width, height) {
    // Add x-axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.format("d"))); // Format x-axis to show years

    // Add y-axis
    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(d3.format("$,.0f")));

    // Add x-axis label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(-50,${height / 2}) rotate(-90)`)
      .text('Salary in USD');// Format y-axis to show compact salary values

    // Add y-axis label
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${width / 2},${height + 50})`)
      .text('Year');
}

// Function to create the area generator
function myChartCreateAreaGenerator(x, y, height) {
    return function(datum, isTransition) {
        return d3.area()
          .y0(y(0))
          .y1(d => isTransition ? y(d.value) : height)
          .x(d => x(d.date))
          (datum);
    }
}

// Function to add line path with transition effect
function myChartAddLinePath(svg, dataset, area) {
    svg.append("path")
      .datum(dataset)
      .attr("fill", "steelblue")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 1)
      .attr("d", d => area(d, false))
      .transition()
      .duration(2000)
      .attr("d", d => area(d, true));
}

// Function to add annotations to the chart
function myChartAddAnnotations(svg, annotations) {
    const makeAnnotations = d3.annotation()
      .annotations(annotations);

    svg.append("g")
      .call(makeAnnotations);
}

// Main function to load and render the scene
function loadScene0() {
    const margin = { top: 70, right: 30, bottom: 90, left: 90 };
    const width = 1200 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    initializeChartArea();

    d3.csv("../data/ds_salaries.csv").then(data => {
        // Convert data types
        data.forEach(d => {
            d.salary_in_usd = +d.salary_in_usd; // Convert salary to number
            d.work_year = +d.work_year; // Convert year to number
        });

        // Group data by year and calculate mean salary
        const meanSalaries = d3.group(data, d => d.work_year);
        const dataset = Array.from(meanSalaries, ([year, values]) => ({
            date: year,
            value: Math.round(d3.mean(values, d => d.salary_in_usd))
        }));
        dataset.sort((x, y) => d3.descending(x.date, y.date)).reverse();

        // Create SVG element
        const svg = myChartCreateSvg(margin, width, height);

        // Configure scales
        const { x, y } = myChartConfigureScales(dataset, width, height);

        // Add x and y axes with labels
        myChartAddAxes(svg, x, y, width, height);

        // Create area generator
        const area = myChartCreateAreaGenerator(x, y, height);

        // Add line path with transition
        myChartAddLinePath(svg, dataset, area);

        // Define and add annotations
        const annotations = [{
            note: {
                label: "Average salary remained stable until 2021, after which it began to rise significantly.",
                wrap: 200,
                padding: 0
            },
            color: ["#3342ff"],
            x: x(2021),
            y: y(94000),
            dy: -110,
            dx: -30
        }];
        myChartAddAnnotations(svg, annotations);
    });
}
