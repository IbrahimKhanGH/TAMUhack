const { DFW_DATA } = require('../data/dfw-data');

/**
 * Function Definitions for DFW Airport Navigation
 */
exports.NAVIGATION_FUNCTIONS = [{
  name: "navigate_airport",
  description: "Help users navigate DFW airport, find gates, and locate amenities",
  parameters: {
    type: "object",
    properties: {
      from_location: {
        type: "string",
        description: "Starting location (e.g., 'Terminal A', 'Gate A23', 'Security Checkpoint')"
      },
      to_location: {
        type: "string",
        description: "Destination (e.g., 'Gate C15', 'Starbucks in Terminal D')"
      },
      amenity_type: {
        type: "string",
        enum: ["restaurant", "bathroom", "shopping", "charging_station", "water_fountain", "security"],
        description: "Type of amenity user is looking for (optional)"
      },
      accessibility_needed: {
        type: "boolean",
        description: "Whether accessible routes are needed"
      }
    },
    required: ["from_location"]
  }
}];

/**
 * Helper function to calculate walking time between locations
 */
function calculateWalkingTime(from_location, to_location) {
  // Extract terminal and gate information
  const fromTerminal = from_location.charAt(0);
  const toTerminal = to_location.charAt(0);
  
  if (fromTerminal === toTerminal) {
    const fromGate = parseInt(from_location.slice(1));
    const toGate = parseInt(to_location.slice(1));
    const gateDiff = Math.abs(fromGate - toGate);
    
    const { min, max, per_gate } = DFW_DATA.walking_times.gate_to_gate.same_terminal;
    const time = Math.min(max, Math.max(min, gateDiff * per_gate));
    return time;
  }
  
  // Different terminals
  const terminalPath = `${fromTerminal}-${toTerminal}`;
  return DFW_DATA.walking_times.terminal_to_terminal[terminalPath] || 20; // Default to 20 mins if not found
}

/**
 * Find nearest amenities of a specific type
 */
function findNearestAmenities(location, amenity_type, accessibility_needed = false) {
  const terminal = location.charAt(0);
  const terminalData = DFW_DATA.terminals[terminal];
  
  if (!terminalData) return [];

  switch (amenity_type) {
    case "security":
      return terminalData.security_checkpoints.map(checkpoint => ({
        name: checkpoint.id,
        location: checkpoint.location,
        wait_time: DFW_DATA.security_wait_times.checkpoints[checkpoint.id]?.standard || "Unknown",
        precheck: checkpoint.tsa_precheck ? "Available" : "Not available",
        hours: checkpoint.hours
      }));
    
    case "restaurant":
      return terminalData.amenities.restaurants.map(restaurant => ({
        name: restaurant.name,
        location: restaurant.location,
        hours: restaurant.hours,
        type: restaurant.type
      }));
    
    case "bathroom":
      return terminalData.amenities.bathrooms
        .filter(bathroom => !accessibility_needed || bathroom.accessible)
        .map(bathroom => ({
          location: bathroom.location,
          accessible: bathroom.accessible,
          family_room: bathroom.family_room || false
        }));
    
    // Add other amenity types...
    
    default:
      return [];
  }
}

/**
 * Execute the navigation function
 */
exports.handleNavigation = async (functionArgs) => {
  const { from_location, to_location, amenity_type, accessibility_needed } = functionArgs;
  
  // Looking for amenities
  if (amenity_type) {
    const nearestAmenities = findNearestAmenities(from_location, amenity_type, accessibility_needed);
    
    if (amenity_type === "security") {
      return `Nearest security checkpoints to ${from_location}:\n` +
        nearestAmenities.map(checkpoint => 
          `${checkpoint.name} (${checkpoint.location}):\n` +
          `- Wait time: ${checkpoint.wait_time} minutes\n` +
          `- TSA PreCheck: ${checkpoint.precheck}\n` +
          `- Hours: ${checkpoint.hours}`
        ).join('\n\n');
    }
    
    return `Nearest ${amenity_type} locations to ${from_location}:\n` +
      nearestAmenities.map((amenity, index) => 
        `${index + 1}. ${amenity.name || amenity.location}` +
        (amenity.hours ? ` (Hours: ${amenity.hours})` : '')
      ).join('\n');
  }
  
  // Navigating between locations
  if (to_location) {
    const walkingTime = calculateWalkingTime(from_location, to_location);
    const fromTerminal = from_location.charAt(0);
    const toTerminal = to_location.charAt(0);
    
    let route = [];
    
    if (fromTerminal === toTerminal) {
      route = [
        `Follow the signs toward ${to_location}`,
        `Walk time: approximately ${walkingTime} minutes`,
        `Look for overhead signs directing to ${to_location}`
      ];
    } else {
      route = [
        `Take the Skylink to Terminal ${toTerminal}`,
        `Skylink runs every ${DFW_DATA.transportation.skylink.frequency}`,
        `After reaching Terminal ${toTerminal}, follow signs to ${to_location}`,
        `Total estimated time: ${walkingTime} minutes`
      ];
    }
    
    return `To get from ${from_location} to ${to_location}:\n` +
      route.map((step, index) => `${index + 1}. ${step}`).join('\n');
  }
  
  // Just looking for current location info
  const terminal = from_location.charAt(0);
  const terminalData = DFW_DATA.terminals[terminal];
  
  return `You're at ${from_location}. Nearby you can find:\n` +
    `- Restaurants: ${terminalData.amenities.restaurants.map(r => r.name).join(', ')}\n` +
    `- Bathrooms: ${terminalData.amenities.bathrooms.map(b => b.location).join(', ')}\n` +
    `- Services: Information desk, charging stations, water fountains\n` +
    `What would you like to find?`;
}; 