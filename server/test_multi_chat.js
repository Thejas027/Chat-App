const axios = require('axios');

// Test users
const users = [
  { email: 'test@gmail.com', password: 'Test@123', name: 'Test User' },
  { email: 'user2@gmail.com', password: 'User2@123', name: 'Second User' },
  { email: 'alice@gmail.com', password: 'Alice@123', name: 'Alice Johnson' },
  { email: 'bob@gmail.com', password: 'Bob@123', name: 'Bob Smith' }
];

const API_BASE = 'http://localhost:5000/api';
let authTokens = {};

// Helper function to make authenticated requests
const authRequest = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});

async function createTestUsers() {
  console.log('🔨 Creating test users...\n');
  
  for (const user of users) {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        email: user.email,
        password: user.password,
        fullName: user.name
      });
      
      if (response.data.success) {
        console.log(`✅ Created user: ${user.name} (${user.email})`);
        authTokens[user.email] = response.data.token;
      }
    } catch (error) {
      if (error.response?.data?.message?.includes('already exists')) {
        console.log(`ℹ️  User already exists: ${user.name} (${user.email})`);
        // Login to get token
        try {
          const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            email: user.email,
            password: user.password
          });
          authTokens[user.email] = loginResponse.data.token;
          console.log(`🔑 Logged in: ${user.name}`);
        } catch (loginError) {
          console.log(`❌ Failed to login: ${user.name}`);
        }
      } else {
        console.log(`❌ Failed to create user: ${user.name} - ${error.response?.data?.message || error.message}`);
      }
    }
  }
  console.log('\n');
}

async function createGroupConversation() {
  console.log('👥 Creating group conversation...\n');
  
  try {
    // Get all user IDs first
    const usersResponse = await axios.get(`${API_BASE}/users`, authRequest(authTokens[users[0].email]));
    
    // Fix the response structure - data.users contains the actual users array
    let allUsers = [];
    if (usersResponse.data.success && usersResponse.data.data && usersResponse.data.data.users) {
      allUsers = usersResponse.data.data.users;
    }
    
    console.log(`👥 Found ${allUsers.length} users in database`);
    
    if (allUsers.length < 2) {
      console.log('❌ Need at least 2 users to create a group conversation');
      return null;
    }
    
    // Create a group with available users (excluding the creator)
    const participantIds = allUsers.slice(0, Math.min(3, allUsers.length)).map(user => user._id);
    
    console.log(`🎯 Creating group with ${participantIds.length} participants`);
    
    const groupData = {
      type: 'group',
      name: 'Test Group Chat',
      description: 'A test group for multi-people messaging',
      participantIds: participantIds
    };
    
    const response = await axios.post(`${API_BASE}/conversations/group`, groupData, authRequest(authTokens[users[0].email]));
    
    if (response.data.success) {
      console.log(`✅ Group conversation created: ${response.data.data.name}`);
      console.log(`👥 Participants: ${participantIds.length}`);
      console.log(`🆔 Group ID: ${response.data.data._id}\n`);
      return response.data.data;
    }
  } catch (error) {
    console.log(`❌ Failed to create group: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log('📋 Error details:', error.response.data);
    }
    console.log('');
    return null;
  }
}

async function sendGroupMessages(groupId) {
  console.log('💬 Sending test messages to group...\n');
  
  const messages = [
    { sender: users[0].email, text: 'Hello everyone! This is a test message from Test User.' },
    { sender: users[1].email, text: 'Hi there! Second User here 👋' },
    { sender: users[2].email, text: 'Alice joining the conversation! How is everyone?' },
    { sender: users[0].email, text: 'Great to see everyone here! Multi-user chat is working!' }
  ];
  
  for (const msg of messages) {
    try {
      const response = await axios.post(`${API_BASE}/messages`, {
        conversationId: groupId,
        content: msg.text,
        type: 'text'
      }, authRequest(authTokens[msg.sender]));
      
      if (response.data.success) {
        console.log(`✅ Message sent by ${msg.sender}: "${msg.text.substring(0, 50)}${msg.text.length > 50 ? '...' : ''}"`);
      }
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log(`❌ Failed to send message from ${msg.sender}: ${error.response?.data?.message || error.message}`);
    }
  }
  console.log('\n');
}

async function getGroupMessages(groupId) {
  console.log('📨 Retrieving group messages...\n');
  
  try {
    const response = await axios.get(`${API_BASE}/messages/${groupId}`, authRequest(authTokens[users[0].email]));
    
    if (response.data.success) {
      const messages = response.data.data || response.data;
      console.log(`📊 Total messages in group: ${messages.length}\n`);
      
      messages.forEach((msg, index) => {
        const sender = msg.sender?.fullName || 'Unknown';
        const time = new Date(msg.createdAt).toLocaleTimeString();
        console.log(`${index + 1}. [${time}] ${sender}: ${msg.content}`);
      });
      console.log('\n');
    }
  } catch (error) {
    console.log(`❌ Failed to retrieve messages: ${error.response?.data?.message || error.message}\n`);
  }
}

async function listAllConversations() {
  console.log('📋 Listing all conversations for users...\n');
  
  for (let i = 0; i < 3; i++) {
    const user = users[i];
    try {
      const response = await axios.get(`${API_BASE}/conversations`, authRequest(authTokens[user.email]));
      
      if (response.data.success) {
        const conversations = response.data.data || response.data;
        console.log(`👤 ${user.name} has ${conversations.length} conversation(s):`);
        
        conversations.forEach(conv => {
          console.log(`   - ${conv.type === 'group' ? '👥' : '💬'} ${conv.name || conv.displayName || 'Unnamed'} (${conv.participants?.length || 0} participants)`);
        });
        console.log('');
      }
    } catch (error) {
      console.log(`❌ Failed to get conversations for ${user.name}: ${error.response?.data?.message || error.message}\n`);
    }
  }
}

// Main test function
async function runMultiChatTest() {
  console.log('🚀 Starting Multi-People Messaging Test\n');
  console.log('=' .repeat(50) + '\n');
  
  try {
    // Step 1: Create users
    await createTestUsers();
    
    // Step 2: Create group conversation
    const group = await createGroupConversation();
    
    if (group) {
      // Step 3: Send messages
      await sendGroupMessages(group._id);
      
      // Step 4: Retrieve messages
      await getGroupMessages(group._id);
      
      // Step 5: List conversations for all users
      await listAllConversations();
    }
    
    console.log('✅ Multi-chat test completed successfully!');
    console.log('\n🌐 Now you can:');
    console.log('1. Open multiple browser windows/tabs at http://localhost:5173');
    console.log('2. Login with different users:');
    users.slice(0, 3).forEach(user => {
      console.log(`   - ${user.email} / ${user.password}`);
    });
    console.log('3. See the group conversation and send real-time messages!');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
runMultiChatTest();
