require('dotenv').config();
const express = require('express');
const expressWs = require('express-ws');
const OpenAI = require('openai');
const SecurityScraper = require('./services/security-scraper');

const { SYSTEM_PROMPT, PORT } = require('./config/constants');
const { NAVIGATION_FUNCTIONS, handleNavigation } = require('./functions/navigation');
const { logger } = require('./utils/logger');

const app = express();
expressWs(app);
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Initialize security scraper
const securityScraper = new SecurityScraper(process.env.FIRECRAWL_API_KEY);

/**
 * State Management
 */
const STATE = {
  currentUtterance: {
    role: null,
    content: ''
  },
  lastResponseId: null
};

/**
 * Generate response using OpenAI
 */
async function generateAIResponse(transcript) {
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...transcript.map(msg => ({
        role: msg.role === 'agent' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      functions: NAVIGATION_FUNCTIONS,
      function_call: 'auto',
      temperature: 0.7,
      max_tokens: 150
    });

    return completion.choices[0];
  } catch (error) {
    logger.error(`OpenAI Error: ${error.message}`);
    return {
      message: {
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing that right now. Could you please try again?"
      }
    };
  }
}

/**
 * Handle real-time transcript updates
 */
function handleTranscriptUpdate(utterance) {
  if (STATE.currentUtterance.role !== utterance.role || 
      !utterance.content.startsWith(STATE.currentUtterance.content)) {
    STATE.currentUtterance = {
      role: utterance.role,
      content: ''
    };
    console.log();
  }

  const newContent = utterance.content;
  if (newContent.length > STATE.currentUtterance.content.length) {
    const role = utterance.role === 'agent' ? '🤖 Agent' : '👤 User';
    process.stdout.write(`\r${role}: ${newContent}`);
    STATE.currentUtterance.content = newContent;
  }
}

/**
 * WebSocket handler for live transcripts
 */
app.ws("/llm-websocket/:call_id", async (ws, req) => {
  const callId = req.params.call_id;
  logger.call(`Call Started - ID: ${callId}`);

  // Send initial greeting
  const initialResponse = {
    response_id: 0,
    content: "Hello! How may I help you navigate DFW Airport today?",
    content_complete: true,
    end_call: false
  };
  ws.send(JSON.stringify(initialResponse));
  STATE.lastResponseId = 0;

  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.interaction_type) {
        case "update_only":
          if (message.transcript?.length > 0) {
            handleTranscriptUpdate(message.transcript[message.transcript.length - 1]);
          }
          break;

        case "response_required":
          if (message.response_id !== STATE.lastResponseId) {
            console.log();
            const aiResponse = await generateAIResponse(message.transcript);

            // Check if AI wants to call a function
            if (aiResponse.function_call) {
              const { name, arguments: args } = aiResponse.function_call;
              const functionResult = await handleNavigation(JSON.parse(args));
              
              const response = {
                response_id: message.response_id,
                content: functionResult,
                content_complete: true,
                end_call: false
              };
              ws.send(JSON.stringify(response));
            } else {
              const response = {
                response_id: message.response_id,
                content: aiResponse.message.content,
                content_complete: true,
                end_call: false
              };
              ws.send(JSON.stringify(response));
            }

            STATE.lastResponseId = message.response_id;
          }
          break;
      }
    } catch (error) {
      logger.error(error.message);
    }
  });

  ws.on("close", () => {
    logger.call(`Call Ended - ID: ${callId}`);
    STATE.currentUtterance = { role: null, content: '' };
    STATE.lastResponseId = null;
  });
});

// Start periodic updates of security wait times
securityScraper.startPeriodicUpdates(10); // Updates every 10 minutes

// Start the server
app.listen(PORT, () => {
  logger.success(`Server running on port ${PORT}`);
  logger.info(`WebSocket URL: wss://afda-2600-387-f-6c13-00-2.ngrok-free.app/llm-websocket`);
}); 