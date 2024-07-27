// Initialize currentScene to the first scene (0)
let currentScene = 0;

// Define an array of scene objects with load functions and titles
const scenes = [
  { load: loadScene0, title: 'Trend' },
  { load: loadScene1, title: 'Experience' },
  { load: loadScene2, title: 'Employment' },
  { load: loadScene3, title: 'Company' },
  { load: loadScene4, title: 'Remote Jobs' },
  { load: loadScene5, title: 'Explore!' }
];

// Function to initialize and show the first scene
function initializeFirstScene() {
  // Ensure the first scene is loaded and visible
  scenes[currentScene].load();
  updateButtonVisibility();
  d3.select(".description").html("This visualization is based on the dataset of data scientist salaries in 2023. The dataset contains information about the salary, experience level, employment type, job location, company size, and other attributes of data scientists. The visualization is designed to help data scientists understand the salary distribution and explore the relationship between salary and other attributes.");
}

// Function to update button visibility based on the current scene
function updateButtonVisibility() {
  // Hide all scene buttons initially
  for (let i = currentScene+ 1; i < scenes.length; i++) {
    document.getElementById(`b${i}`).disabled = true;
  }
  for (let i = 0; i < currentScene; i++) {
    document.getElementById(`b${currentScene}`).disabled = false;
  }
}

// Function to go to the next scene
function nextScene() {
  // Move to the next scene
  currentScene = (currentScene + 1) % scenes.length;
  // Load the next scene
  scenes[currentScene].load();
  // Update button visibility
  updateButtonVisibility();
}