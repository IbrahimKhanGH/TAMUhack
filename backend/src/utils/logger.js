/**
 * Custom logger with emoji and formatting
 */
exports.logger = {
  info: (message) => console.log(`ℹ️ ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  error: (message) => console.error(`❌ ${message}`),
  call: (message) => console.log(`📞 ${message}`),
  agent: (message) => console.log(`🤖 ${message}`),
  user: (message) => console.log(`👤 ${message}`)
}; 