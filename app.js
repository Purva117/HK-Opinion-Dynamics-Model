// Get references to the DOM elements
const confidenceSlider = document.getElementById('confidenceSlider');
const confidenceInput = document.getElementById('confidenceInput');
const agentsSlider = document.getElementById('agentsSlider');
const agentsInput = document.getElementById('agentsInput');
const iterationsSlider = document.getElementById('iterationsSlider');
const iterationsInput = document.getElementById('iterationsInput');
const confidenceValue = document.getElementById('confidenceValue');
const agentsValue = document.getElementById('agentsValue');
const iterationsValue = document.getElementById('iterationsValue');
const startButton = document.getElementById('startButton');
const canvas = document.getElementById('latticeCanvas');
const ctx = canvas.getContext('2d');
const colorMapCanvas = document.getElementById('colorMapCanvas');
const colorMapCtx = colorMapCanvas.getContext('2d');

// Initial parameters
let confidenceInterval = parseFloat(confidenceSlider.value);
let agentsPerSide = parseInt(agentsSlider.value);
let iterations = parseInt(iterationsSlider.value);
let cellSize = 50;  // Size of each agent's cell on the canvas
let radius = 15;    // Radius of the circle for each agent

// Define variables to store the Chart.js instance and data
let opinionChart;
let chartData = {
    labels: [],  // X-axis labels (iterations)
    datasets: []  // To hold each agent's opinion over time
};

// Update the displayed values as sliders change
confidenceSlider.oninput = () => {
    confidenceValue.textContent = confidenceSlider.value;
    confidenceInput.value = confidenceSlider.value;
};
confidenceInput.oninput = () => {
    const value = parseFloat(confidenceInput.value);
    if (value < 0) confidenceInput.value = 0;
    if (value > 1) confidenceInput.value = 1;
    confidenceValue.textContent = confidenceInput.value;
    confidenceSlider.value = confidenceInput.value;
};
agentsSlider.oninput = () => {
    agentsValue.textContent = agentsSlider.value;
    agentsInput.value = agentsSlider.value;
};
agentsInput.oninput = () => {
    const value = parseInt(agentsInput.value);
    if (value < 1) agentsInput.value = 1;
    if (value > 10) agentsInput.value = 10;
    agentsValue.textContent = agentsInput.value;
    agentsSlider.value = agentsInput.value;
};
iterationsSlider.oninput = () => {
    iterationsValue.textContent = iterationsSlider.value;
    iterationsInput.value = iterationsSlider.value;
};
iterationsInput.oninput = () => {
    const value = parseInt(iterationsInput.value);
    if (value < 1) iterationsInput.value = 1;
    if (value > 100) iterationsInput.value = 100;
    iterationsValue.textContent = iterationsInput.value;
    iterationsSlider.value = iterationsInput.value;
};

// Create progress bar element
const progressBar = document.createElement("div");
progressBar.style.width = "80%";
progressBar.style.height = "10px";
progressBar.style.backgroundColor = "#e0e0e0";
progressBar.style.margin = "20px auto";
progressBar.style.position = "relative";

const progressFill = document.createElement("div");
progressFill.style.width = "0%";
progressFill.style.height = "100%";
progressFill.style.backgroundColor = "#007bff";
progressBar.appendChild(progressFill);

document.body.appendChild(progressBar);



// Simulation state
let agents = [];  // Holds the agents' opinions
let latticeSize = 0;  // Number of agents in total (N x N)

// Initialize the lattice of agents with random opinions
function initializeLattice() {
    latticeSize = agentsPerSide;
    agents = Array(latticeSize).fill(null).map(() =>
        Array(latticeSize).fill(null).map(() => Math.random()) // Random initial opinions (between 0 and 1)
    );
}

// Draw the lattice grid with circles and lines
function drawLattice() {
    const canvasSize = agentsPerSide * cellSize;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < latticeSize; i++) {
        for (let j = 0; j < latticeSize; j++) {
            const opinion = agents[i][j];
            const x = i * cellSize + cellSize / 2;
            const y = j * cellSize + cellSize / 2;

            // Draw the lines connecting to the 4 immediate neighbors
            if (i < latticeSize - 1) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo((i + 1) * cellSize + cellSize / 2, j * cellSize + cellSize / 2);
                ctx.strokeStyle = "#000";  // Black lines
                ctx.stroke();
            }
            if (j < latticeSize - 1) {
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(i * cellSize + cellSize / 2, (j + 1) * cellSize + cellSize / 2);
                ctx.stroke();
            }

            // Draw the agent as a circle, color based on opinion (black to red)
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = `rgb(${255 * opinion}, 0, 0)`;  // Red for high values, black for low
            ctx.fill();
            ctx.strokeStyle = "#000";  // Black border
            ctx.stroke();
        }
    }
}


// Function to update opinions based on immediate neighbors and confidence interval
function updateOpinions() {
    let newOpinions = JSON.parse(JSON.stringify(agents));  // Copy current opinions

    for (let i = 0; i < latticeSize; i++) {
        for (let j = 0; j < latticeSize; j++) {
            let neighbors = [];
            
            // Get immediate neighbors (north, south, east, west)
            if (i > 0) neighbors.push(agents[i - 1][j]);  // North
            if (i < latticeSize - 1) neighbors.push(agents[i + 1][j]);  // South
            if (j > 0) neighbors.push(agents[i][j - 1]);  // West
            if (j < latticeSize - 1) neighbors.push(agents[i][j + 1]);  // East

            // Average opinion of neighbors within confidence interval
            const closeNeighbors = neighbors.filter(neighbor => Math.abs(neighbor - agents[i][j]) <= confidenceInterval);
            if (closeNeighbors.length > 0) {
                const avgOpinion = closeNeighbors.reduce((sum, op) => sum + op, 0) / closeNeighbors.length;
                newOpinions[i][j] = avgOpinion;
            }
        }
    }

    agents = newOpinions;  // Update agents with new opinions
    drawLattice();  // Re-draw lattice
}

// Initialize the Chart.js chart
function initializeChart() {
    const ctx = document.getElementById('opinionChart').getContext('2d');
    opinionChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: false,  // Disable responsive resizing
            maintainAspectRatio: false,  // Ensure it follows the container size strictly
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Iterations'
                    }
                },
                y: {
                    min: 0,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Opinion Value'
                    }
                }
            },
            elements: {
                line: {
                    borderWidth: 1,
                    tension: 0.1,  // Smooth lines
                },
                point: {
                    radius: 0  // Hide data points for cleaner lines
                }
            },
            plugins: {
                legend: {
                    display: false // Disable the legend
                }
            }
        }
    });
}

// Collect opinions from all agents
function collectAllOpinions() {
    const opinions = [];
    for (let i = 0; i < latticeSize; i++) {
        for (let j = 0; j < latticeSize; j++) {
            opinions.push(agents[i][j]);
        }
    }
    return opinions;
}

// Update the chart with data from all agents
function updateChart(currentIteration) {
    const opinions = collectAllOpinions();

    // On the first iteration, initialize datasets for each agent
    if (currentIteration === 0) {
        chartData.labels = [];  // Reset labels
        chartData.datasets = [];  // Reset datasets

        // Create a dataset for each agent's opinion
        opinions.forEach((_, index) => {
            chartData.datasets.push({
                label: `Agent ${index + 1}`,
                data: [],
                borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`,
                backgroundColor: 'transparent',
                fill: false,
                lineTension: 0.1
            });
        });
    }

    // Add the current iteration label
    chartData.labels.push(currentIteration);

    // Update each dataset with the corresponding agent's opinion
    opinions.forEach((opinion, index) => {
        chartData.datasets[index].data.push(opinion);
    });

    opinionChart.update();  // Refresh the chart
}


// Modify the runSimulation function to include chart updating
function runSimulation() {
    confidenceInterval = parseFloat(confidenceSlider.value);
    agentsPerSide = parseInt(agentsSlider.value);
    iterations = parseInt(iterationsSlider.value);

    initializeLattice();
    drawLattice();
    initializeChart();  // Initialize chart

    // Ensure the animation duration is 10 seconds (10000 ms)
    let currentIteration = 0;
    const animationTime = 10000; // Total animation time in milliseconds
    const intervalTime = animationTime / iterations;

    const interval = setInterval(() => {
        if (currentIteration >= iterations) {
            clearInterval(interval);
            return;
        }
        updateOpinions();
        drawLattice();
        updateChart(currentIteration);  // Update the chart
        currentIteration++;

        // Update progress bar
        const progressPercentage = (currentIteration / iterations) * 100;
        progressFill.style.width = `${progressPercentage}%`;

    }, intervalTime);
}

// Draw the color map for opinion values with labels below
function drawColorMap() {
    for (let i = 0; i <= 300; i++) {
        const opinion = i / 300;
        colorMapCtx.fillStyle = `rgb(${255 * opinion}, 0, 0)`; // Black to Red gradient
        colorMapCtx.fillRect(i, 0, 1, 40); // Adjusted height for the color map
    }

    // Create labels below the color map
    colorMapCtx.fillStyle = "#000";
    colorMapCtx.font = "12px Arial";
    colorMapCtx.textAlign = "center";
    colorMapCtx.fillText("0", 15, 49); // Positioned below the color bar
    colorMapCtx.fillText("1", 285, 49);  // Positioned below the color bar
}

// Start the simulation when the button is clicked
startButton.onclick = () => runSimulation();

// Initialize
drawColorMap();
