let agents = [];
let mediaAgents = [];
let influencerAgents = [];
let confidenceInterval = 0.5;
let simulationInterval = null;
let resultsChart = null;
let totalDuration = 10000;
const influenceRadius = 100; // Radius of influence for media and influencers

document.getElementById("simulation-form").addEventListener("submit", function(event) {
    event.preventDefault();

    const numAgents = parseInt(document.getElementById("agents").value);
    const iterations = parseInt(document.getElementById("iterations").value);
    confidenceInterval = parseFloat(document.getElementById("confidence").value);

    initializeAgentsOnFirstMap(numAgents);
    initializeMediaInfluencersOnSecondMap(); // Initialize media and influencers separately
    setupResultsChart(numAgents);
    startSimulation(iterations);
});

function initializeAgentsOnFirstMap(numAgents) {
    const svgObject = document.getElementById("citySVG"); // First SVG map (for agents)
    const svgDoc = svgObject.contentDocument;

    if (!svgDoc) {
        console.error("SVG document not loaded.");
        return;
    }

    agents = [];
    const agentsGroup = svgDoc.getElementById("agentsGroup");
    if (agentsGroup) agentsGroup.remove();

    const viewBox = svgDoc.documentElement.viewBox.baseVal;
    const svgWidth = viewBox.width;
    const svgHeight = viewBox.height;

    const newAgentsGroup = svgDoc.createElementNS("http://www.w3.org/2000/svg", "g");
    newAgentsGroup.setAttribute("id", "agentsGroup");

    // Create normal agents on the first SVG map
    for (let i = 0; i < numAgents; i++) {
        const opinion = Math.random();
        const x = Math.random() * svgWidth;
        const y = Math.random() * svgHeight;

        const agentCircle = svgDoc.createElementNS("http://www.w3.org/2000/svg", "circle");
        agentCircle.setAttribute("cx", x);
        agentCircle.setAttribute("cy", y);
        agentCircle.setAttribute("r", 15);
        agentCircle.setAttribute("fill", getColorForOpinion(opinion));
        agentCircle.setAttribute("data-opinion", opinion);

        newAgentsGroup.appendChild(agentCircle);

        agents.push({
            element: agentCircle,
            x: x,
            y: y,
            opinion: opinion,
            opinionHistory: [opinion]
        });
    }

    svgDoc.documentElement.appendChild(newAgentsGroup);
}

function initializeMediaInfluencersOnSecondMap() {
    const svgObject = document.getElementById("citySVG-copy"); // Second SVG map (for media and influencers)
    const svgDoc = svgObject.contentDocument;

    if (!svgDoc) {
        console.error("SVG document not loaded.");
        return;
    }

    mediaAgents = [];
    influencerAgents = [];
    const agentsGroup = svgDoc.getElementById("mediaInfluencersGroup");
    if (agentsGroup) agentsGroup.remove();

    const viewBox = svgDoc.documentElement.viewBox.baseVal;
    const svgWidth = viewBox.width;
    const svgHeight = viewBox.height;

    const newAgentsGroup = svgDoc.createElementNS("http://www.w3.org/2000/svg", "g");
    newAgentsGroup.setAttribute("id", "mediaInfluencersGroup");

    // Create fixed media agents on the second SVG map
    addFixedAgent(svgDoc, newAgentsGroup, svgWidth / 4, svgHeight / 2, 0.1, 'blue', 'media');
    addFixedAgent(svgDoc, newAgentsGroup, svgWidth / 2, svgHeight / 4, 0.2, 'blue', 'media');

    // Create fixed influencer agents on the second SVG map
    addFixedAgent(svgDoc, newAgentsGroup, svgWidth / 1.5, svgHeight / 1.5, 0.8, 'green', 'influencer');
    addFixedAgent(svgDoc, newAgentsGroup, svgWidth / 1.3, svgHeight / 3, 0.9, 'green', 'influencer');

    svgDoc.documentElement.appendChild(newAgentsGroup);
}

function addFixedAgent(svgDoc, agentsGroup, x, y, opinion, color, type) {
    const fixedAgent = svgDoc.createElementNS("http://www.w3.org/2000/svg", "circle");
    fixedAgent.setAttribute("cx", x);
    fixedAgent.setAttribute("cy", y);
    fixedAgent.setAttribute("r", 20); 
    fixedAgent.setAttribute("fill", color);
    fixedAgent.setAttribute("data-opinion", opinion);

    agentsGroup.appendChild(fixedAgent);

    const agentData = {
        element: fixedAgent,
        x: x,
        y: y,
        opinion: opinion,
        type: type, 
        opinionHistory: [opinion]
    };

    if (type === 'media') {
        mediaAgents.push(agentData);
    } else if (type === 'influencer') {
        influencerAgents.push(agentData);
    }
}

function startSimulation(iterations) {
    let currentIteration = 0;
    const intervalTime = totalDuration / iterations;

    if (simulationInterval) clearInterval(simulationInterval);

    simulationInterval = setInterval(() => {
        if (currentIteration >= iterations) {
            clearInterval(simulationInterval);
            return;
        }

        agents.forEach(agent => {
            let neighbors = agents.filter(neighbor => {
                return Math.abs(agent.opinion - neighbor.opinion) <= confidenceInterval;
            });

            // Add media and influencers from the second map if within influence radius
            mediaAgents.forEach(media => {
                if (distanceBetween(agent, media) <= influenceRadius) {
                    neighbors.push(media);
                }
            });

            influencerAgents.forEach(influencer => {
                if (distanceBetween(agent, influencer) <= influenceRadius) {
                    neighbors.push(influencer);
                }
            });

            const avgOpinion = neighbors.reduce((sum, neighbor) => sum + neighbor.opinion, 0) / neighbors.length;
            agent.opinion = avgOpinion;
            agent.opinionHistory.push(avgOpinion);

            agent.element.setAttribute("fill", getColorForOpinion(avgOpinion));
            agent.element.setAttribute("data-opinion", avgOpinion);
        });

        updateResultsChart(currentIteration);
        currentIteration++;
    }, intervalTime);
}

function distanceBetween(agent1, agent2) {
    const dx = agent1.x - agent2.x;
    const dy = agent1.y - agent2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function getColorForOpinion(opinion) {
    const redValue = Math.floor(opinion * 255);
    return `rgb(${redValue}, 0, 0)`;
}

function setupResultsChart(numAgents) {
    const ctx = document.getElementById('resultsChart').getContext('2d');

    const datasets = agents.map((agent, index) => ({
        label: `Agent ${index + 1}`,
        data: [agent.opinion],
        borderColor: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
        fill: false,
        tension: 0.1
    }));

    resultsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [0],
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Iterations' }
                },
                y: {
                    min: 0,
                    max: 1,
                    title: { display: true, text: 'Opinions' }
                }
            }
        }
    });
}

function updateResultsChart(iteration) {
    resultsChart.data.labels.push(iteration + 1);
    resultsChart.data.datasets.forEach((dataset, index) => {
        dataset.data.push(agents[index].opinionHistory[iteration + 1]);
    });
    resultsChart.update();
}