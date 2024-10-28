// Initialize timer, playtime, points, redeemed points, and user status
let timer;
let playtime = 0;
let points = parseInt(localStorage.getItem('points')) || 0; // Load points from localStorage
let redeemedPoints = parseInt(localStorage.getItem('redeemedPoints')) || 0; // Load redeemed points from localStorage
let isPlaying = false;
let warningModalVisible = false; // Track the visibility of the warning modal

// Function to log the PresenceData for a specific user ID from Local Storage
async function logPresenceData() {
    const userId = getUserId(); // Get the current user ID from the profile link

    // Check Roblox presence using the API
    try {
        const presenceResponse = await fetch("https://presence.roblox.com/v1/presence/users", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userIds: [userId] })
        });

        // Check for response errors
        if (!presenceResponse.ok) throw new Error(`Error: ${presenceResponse.statusText}`);

        // Parse the JSON response
        const presenceData = await presenceResponse.json();
        const userPresence = presenceData.userPresences[0];

        // Log the entire response to see the structure
        console.log("Presence Data:", JSON.stringify(presenceData, null, 2));

        // Display relevant information
        if (userPresence) {
            if (userPresence.userPresenceType === 2 && window.location.href.includes("https://www.roblox.com/games/")) { // 2 means in a game
                // If the user is in a game, start tracking playtime
                if (!isPlaying) {
                    console.log('User is currently in a game. Starting playtime tracking...');
                    startTrackingPlaytime(userPresence.lastLocation); // Show last location
                }
            } else {
                console.log("User is not currently in a game. Stopping playtime tracking...");
                stopTrackingPlaytime(); // Stop tracking if not in a game
            }
        } else {
            console.log("User presence information not found.");
        }
    } catch (error) {
        console.error("Error fetching presence data:", error);
    }
}

// Start tracking playtime
function startTrackingPlaytime(lastLocation) {
    if (!isPlaying) {
        isPlaying = true;
        console.log('Starting playtime tracking...');
        showWarningModal(lastLocation); // Show warning modal with lastLocation

        timer = setInterval(() => {
            playtime++;
            console.log(`Playtime: ${playtime} seconds`);
        }, 1000);
    }
}

// Stop tracking playtime
function stopTrackingPlaytime() {
    if (isPlaying) {
        console.log(`Playtime tracking stopped. Total playtime: ${playtime} seconds.`);
        points += playtime; // Add playtime to points
        localStorage.setItem('points', points); // Save points to localStorage
        console.log(`You earned ${playtime} points! Total Points: ${points}`);
        playtime = 0; // Reset playtime
        isPlaying = false; // Reset isPlaying status
        clearInterval(timer); // Stop the timer
        hideWarningModal(); // Hide warning modal when stopping
    }
}

// Show warning modal
function showWarningModal(lastLocation) {
    if (!warningModalVisible) {
        const warningModal = document.createElement('div');
        warningModal.id = 'warningModal';
        warningModal.style.position = 'fixed';
        warningModal.style.top = '50%';
        warningModal.style.left = '50%';
        warningModal.style.transform = 'translate(-50%, -50%)';
        warningModal.style.backgroundColor = 'white';
        warningModal.style.padding = '20px';
        warningModal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        warningModal.style.zIndex = '1000';
        
        warningModal.innerHTML = `
            <h2 style="color: black;">Game Detected</h2>
            <p style="color: red;">DO NOT RESET OR CLOSE THIS PAGE!! [ IF YOU DO THE PLAYTIME REWARD WILL BE RESETTED! ]</p>
            <p style="color: green;">After You Leave The Game You Will Receive Your Reward!</p>
        `;

        document.body.appendChild(warningModal);
        warningModalVisible = true;
        console.log("Warning modal shown.");
    }
}

// Hide warning modal
function hideWarningModal() {
    const warningModal = document.getElementById('warningModal');
    if (warningModal) {
        document.body.removeChild(warningModal);
        warningModalVisible = false;
        console.log("Warning modal hidden.");
    }
}

// Check for presence data updates every second
setInterval(logPresenceData, 1000);

// Function to create and show the rewards modal
function showRewardsModal() {
    const modal = document.createElement('div');
    modal.id = 'rewardsModal';
    modal.style.position = 'fixed';
    modal.style.top = '50%';
    modal.style.left = '50%';
    modal.style.transform = 'translate(-50%, -50%)';
    modal.style.backgroundColor = 'white';
    modal.style.padding = '20px';
    modal.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
    modal.style.zIndex = '1000';

    // Calculate remaining points
    const remainingPoints = points;

    modal.innerHTML = `
        <h2 style="color: black; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Convert Your Points To Robux</h2>
        <p style="color: black;">Your Points: ${remainingPoints}</p>
        <p style="color: black;">Your Redeemed Points: ${redeemedPoints}</p>
        <p style="color: black;">Your User ID: ${getUserId()}</p>
        <p style="color: black;">2000 Points = 1 Robux</p>
        <button id="redeemPointsButton" style="color: black;">Redeem Points</button>
        <button id="closeModalButton" style="color: black;">Close</button>
    `;

    document.body.appendChild(modal);

    // Event listener for redeem button
    document.getElementById('redeemPointsButton').addEventListener('click', () => {
        redeemPoints(remainingPoints, getUserId()); // Pass remaining points for redemption
        document.body.removeChild(modal);
    });

    // Event listener for close button
    document.getElementById('closeModalButton').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

// Function to redeem points and send webhook to Discord
function redeemPoints(availablePoints, userId) {
    if (availablePoints < 4000) {
        alert('Minimum Amount is 4000 Points'); // Show notification
        console.log('Not enough points to redeem. Minimum required is 4000 points.');
        return; // Exit if not enough points
    }

    const robuxAmount = Math.floor(availablePoints / 2000); // Convert points to Robux
    const webhookUrl = 'https://discord.com/api/webhooks/1299736865691144253/d_9ifioqok6LWdTAAhc5mEl8s4RX2CExo73QKz5riJOkrzc1wt7nFH5CHHgQI5rEKa30'; // Your Discord webhook URL
    const payload = {
        content: `A User With ID ${userId} Redeemed ${robuxAmount} Robux!`
    };

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            console.log('Webhook sent successfully.');

            // Update points and redeemed points
            redeemedPoints += robuxAmount * 2000; // Add the converted points to redeemed points
            points -= robuxAmount * 2000; // Deduct the redeemed points from total points
            localStorage.setItem('points', points); // Save points to localStorage
            localStorage.setItem('redeemedPoints', redeemedPoints); // Save redeemed points to localStorage
            console.log(`Points reset to: ${points}, Redeemed Points: ${redeemedPoints}`); // Log the reset points

            alert('Redeemed Successfully!'); // Notify user

            // Reload the page after a short delay
            setTimeout(() => {
                location.reload(); // Reload the page
            }, 1000); // 1 second delay
        } else {
            console.error('Error sending webhook:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to get User ID from the profile link
function getUserId() {
    const profileLink = document.getElementById('nav-profile'); // Get the anchor element
    if (profileLink) {
        const href = profileLink.href; // Get the href attribute
        const userId = href.split('/users/')[1]?.split('/')[0]; // Extract the user ID from the URL
        return userId || "Unknown User"; // Return user ID or "Unknown User" if not found
    }
    return "Unknown User"; // Return if element not found
}

// Add the rewards button to the sidebar
function addButtonToSidebar() {
    const rewardsContainer = document.createElement('div');
    rewardsContainer.style.margin = '10px';
    rewardsContainer.style.border = '1px solid #3b82f6';
    rewardsContainer.style.borderRadius = '10px';
    rewardsContainer.style.backgroundColor = '#f0f0f0';
    rewardsContainer.style.display = 'flex';
    rewardsContainer.style.flexDirection = 'column'; // Stack title and button vertically
    rewardsContainer.style.alignItems = 'center'; // Center align items
    rewardsContainer.style.padding = '5px'; // Add padding for better fit

    // Create the title text
    const titleText = document.createElement('div');
    titleText.textContent = 'JustErikDemon Rewards';
    titleText.style.fontSize = '9px'; // Reduce font size for better fit
    titleText.style.color = 'black'; // Set title text color to black
    titleText.style.whiteSpace = 'nowrap'; // Prevent overflow
    titleText.style.overflow = 'hidden'; // Prevent overflow
    titleText.style.textOverflow = 'clip'; // Adjust text overflow behavior
    titleText.style.textAlign = 'center'; // Center-align the text
    titleText.style.maxWidth = '100%'; // Ensure it fits within the container
    titleText.style.marginBottom = '5px'; // Add margin for spacing
    rewardsContainer.appendChild(titleText); // Add title to the container

    // Create the Redeem Points button
    const redeemButton = document.createElement('button');
    redeemButton.textContent = '💎 Redeem Points 💎'; // Updated button text
    redeemButton.style.borderRadius = '10px';
    redeemButton.style.padding = '5px 5px'; // Adjust padding for better fit
    redeemButton.style.backgroundColor = '#3b82f6';
    redeemButton.style.color = 'white'; // Set button text color to white
    redeemButton.style.border = 'none';
    redeemButton.style.cursor = 'pointer';
    redeemButton.style.fontSize = '10px'; // Set font size to match container size
    redeemButton.style.width = '100%'; // Make button full width of container
    redeemButton.style.maxWidth = '100%'; // Ensure button does not exceed container width
    redeemButton.style.whiteSpace = 'nowrap'; // Prevent wrapping
    redeemButton.style.textAlign = 'center'; // Center-align text within button
    redeemButton.style.marginLeft = '0'; // Remove left margin for better alignment

    redeemButton.addEventListener('click', () => {
        const modal = document.getElementById('rewardsModal');
        if (modal) {
            document.body.removeChild(modal); // Close if already open
        } else {
            showRewardsModal(); // Show modal if not open
        }
    });

    rewardsContainer.appendChild(redeemButton); // Add redeem button to the container

    // Create the How Does It Work? button
    const howDoesItWorkButton = document.createElement('button');
    howDoesItWorkButton.textContent = 'How Does It Work?'; // New button text
    howDoesItWorkButton.style.borderRadius = '10px';
    howDoesItWorkButton.style.padding = '5px 5px'; // Adjust padding for better fit
    howDoesItWorkButton.style.backgroundColor = '#3b82f6';
    howDoesItWorkButton.style.color = 'white'; // Set button text color to white
    howDoesItWorkButton.style.border = 'none';
    howDoesItWorkButton.style.cursor = 'pointer';
    howDoesItWorkButton.style.fontSize = '10px'; // Set font size to match container size
    howDoesItWorkButton.style.width = '100%'; // Make button full width of container
    howDoesItWorkButton.style.maxWidth = '100%'; // Ensure button does not exceed container width
    howDoesItWorkButton.style.whiteSpace = 'nowrap'; // Prevent wrapping
    howDoesItWorkButton.style.textAlign = 'center'; // Center-align text within button
    howDoesItWorkButton.style.marginTop = '5px'; // Add margin for spacing

    // Set up the click event to open the link
    howDoesItWorkButton.addEventListener('click', () => {
        window.open('https://sites.google.com/view/justerikdemonrewards/how-does-it-work?authuser=0', '_blank'); // Open the link in a new tab
    });

    rewardsContainer.appendChild(howDoesItWorkButton); // Add the new button to the container

    const sidebar = document.querySelector('.left-col-list'); // Adjust selector if needed
    if (sidebar) {
        const firstChild = sidebar.firstChild;
        sidebar.insertBefore(rewardsContainer, firstChild); // Add the container with title and buttons
        console.log("JustErikDemon Rewards button added to sidebar");
    } else {
        console.log("Sidebar not found");
    }
}

// Add button to sidebar on script load
addButtonToSidebar();




