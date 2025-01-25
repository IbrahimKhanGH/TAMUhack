/**
 * Comprehensive DFW Airport Data
 */
exports.DFW_DATA = {
  terminals: {
    "A": {
      gates: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9", "A10", "A11", "A12", 
              "A13", "A14", "A15", "A16", "A17", "A18", "A19", "A20", "A21", "A22", "A23"],
      security_checkpoints: [
        {
          id: "A-North",
          location: "Near A12",
          hours: "4:00 AM - 9:00 PM",
          tsa_precheck: true
        },
        {
          id: "A-South",
          location: "Near A35",
          hours: "4:00 AM - 9:00 PM",
          tsa_precheck: false
        }
      ],
      amenities: {
        restaurants: [
          {
            name: "Starbucks",
            location: "Near Gate A13",
            hours: "5:00 AM - 9:00 PM",
            type: "Coffee/Quick Serve"
          },
          {
            name: "Chick-fil-A",
            location: "Near Gate A22",
            hours: "6:00 AM - 10:00 PM",
            type: "Fast Food"
          }
        ],
        bathrooms: [
          { location: "Near A13", accessible: true },
          { location: "Near A22", accessible: true, family_room: true },
          { location: "Near A35", accessible: true }
        ],
        shopping: [
          {
            name: "Dallas Cowboys Pro Shop",
            location: "Near Gate A15",
            hours: "6:00 AM - 10:00 PM"
          }
        ],
        services: [
          {
            type: "charging_station",
            location: "Gates A13, A22, A35",
            details: "USB and AC outlets available"
          },
          {
            type: "water_fountain",
            location: "Near every bathroom",
            details: "Bottle filling stations available"
          },
          {
            type: "information_desk",
            location: "Center of Terminal A",
            hours: "6:00 AM - 10:00 PM"
          }
        ]
      },
      connections: {
        skylink: ["Near A13", "Near A28"],
        terminal_link: ["Ground Transportation", "Parking"]
      }
    },
    "B": {
      // Similar structure for other terminals
    }
  },
  
  walking_times: {
    terminal_to_terminal: {
      "A-B": 15,
      "A-C": 25,
      "A-D": 35,
      "A-E": 45,
      // Add other combinations
    },
    gate_to_gate: {
      same_terminal: {
        min: 2,
        max: 7,
        per_gate: 1 // minutes per gate number difference
      }
    },
    security_to_gate: {
      min: 5,
      max: 15,
      calculation: "distance_based" // Can be used for more accurate calculations
    }
  },

  transportation: {
    skylink: {
      hours: "5:00 AM - 12:00 AM",
      frequency: "Every 2 minutes",
      terminals_served: ["A", "B", "C", "D", "E"],
      security: "Inside security checkpoints"
    },
    terminal_link: {
      hours: "24/7",
      frequency: "Every 10 minutes",
      terminals_served: ["A", "B", "C", "D", "E"],
      security: "Outside security checkpoints"
    }
  },

  // This section can be updated via web scraping
  security_wait_times: {
    timestamp: "2024-01-01T12:00:00Z", // Updated by scraper
    checkpoints: {
      "A-North": {
        standard: 15, // minutes
        precheck: 5,
        status: "open"
      },
      "A-South": {
        standard: 20,
        precheck: null, // no precheck at this checkpoint
        status: "open"
      }
      // Other checkpoints...
    }
  }
}; 