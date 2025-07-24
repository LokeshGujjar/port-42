// 🌱 Community Seed Script
// Adds default communities to the Port42 platform

const mongoose = require('mongoose');
const Community = require('../models/Community');
require('dotenv').config();

// Define the communities to create
const communities = [
  {
    name: 'Python',
    slug: 'python',
    description: 'Everything Python - from web development to data science, machine learning, and automation scripts.',
    icon: '🐍',
    color: '#3776ab',
    tags: ['programming', 'development', 'scripting', 'data-science'],
    category: 'Programming Languages'
  },
  {
    name: 'JavaScript',
    slug: 'javascript',
    description: 'JavaScript ecosystem - Node.js, React, Vue, Angular, and everything web development.',
    icon: '⚡',
    color: '#f7df1e',
    tags: ['programming', 'web-development', 'frontend', 'backend'],
    category: 'Programming Languages'
  },
  {
    name: 'Linux',
    slug: 'linux',
    description: 'Linux distributions, system administration, command line tools, and open source software.',
    icon: '🐧',
    color: '#fcc624',
    tags: ['operating-system', 'sysadmin', 'cli', 'open-source'],
    category: 'Operating Systems'
  },
  {
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Information security, threat analysis, security tools, and best practices for staying secure.',
    icon: '🛡️',
    color: '#ff6b6b',
    tags: ['security', 'infosec', 'threats', 'protection'],
    category: 'Security'
  },
  {
    name: 'Web Development',
    slug: 'web-development',
    description: 'Full-stack web development, frameworks, libraries, tools, and best practices.',
    icon: '🌐',
    color: '#61dafb',
    tags: ['web', 'frontend', 'backend', 'fullstack'],
    category: 'Development'
  },
  {
    name: 'Mobile Development',
    slug: 'mobile-development',
    description: 'iOS, Android, React Native, Flutter, and cross-platform mobile app development.',
    icon: '📱',
    color: '#a4c639',
    tags: ['mobile', 'ios', 'android', 'apps'],
    category: 'Development'
  },
  {
    name: 'Cloud Computing',
    slug: 'cloud-computing',
    description: 'AWS, Azure, Google Cloud, serverless computing, and cloud architecture patterns.',
    icon: '☁️',
    color: '#ff9500',
    tags: ['cloud', 'aws', 'azure', 'serverless'],
    category: 'Infrastructure'
  },
  {
    name: 'AI',
    slug: 'ai',
    description: 'Artificial Intelligence research, applications, ethics, and future developments.',
    icon: '🤖',
    color: '#9c27b0',
    tags: ['artificial-intelligence', 'machine-learning', 'neural-networks'],
    category: 'Technology'
  },
  {
    name: 'Machine Learning',
    slug: 'machine-learning',
    description: 'ML algorithms, frameworks, datasets, model training, and practical applications.',
    icon: '🧠',
    color: '#ff5722',
    tags: ['ml', 'algorithms', 'tensorflow', 'pytorch'],
    category: 'Technology'
  },
  {
    name: 'Data Science',
    slug: 'data-science',
    description: 'Data analysis, visualization, statistics, big data, and business intelligence.',
    icon: '📊',
    color: '#2196f3',
    tags: ['data', 'analytics', 'visualization', 'statistics'],
    category: 'Technology'
  },
  {
    name: 'DevOps',
    slug: 'devops',
    description: 'CI/CD, infrastructure as code, monitoring, containerization, and deployment automation.',
    icon: '🔧',
    color: '#607d8b',
    tags: ['ci-cd', 'docker', 'kubernetes', 'automation'],
    category: 'Operations'
  },
  {
    name: 'Reverse Engineering',
    slug: 'reverse-engineering',
    description: 'Binary analysis, disassembly, malware research, and software reverse engineering.',
    icon: '🔍',
    color: '#795548',
    tags: ['reversing', 'binary', 'disassembly', 'analysis'],
    category: 'Security'
  },
  {
    name: 'Red Team',
    slug: 'red-team',
    description: 'Offensive security, penetration testing, exploit development, and attack simulations.',
    icon: '⚔️',
    color: '#f44336',
    tags: ['pentest', 'offensive', 'exploits', 'hacking'],
    category: 'Security'
  },
  {
    name: 'Blue Team',
    slug: 'blue-team',
    description: 'Defensive security, incident response, threat hunting, and security monitoring.',
    icon: '🛡️',
    color: '#2196f3',
    tags: ['defensive', 'incident-response', 'monitoring', 'soc'],
    category: 'Security'
  },
  {
    name: 'Open Source',
    slug: 'open-source',
    description: 'Open source projects, contributions, licensing, and community collaboration.',
    icon: '🔓',
    color: '#4caf50',
    tags: ['oss', 'github', 'collaboration', 'licensing'],
    category: 'Community'
  },
  {
    name: 'CTF',
    slug: 'ctf',
    description: 'Capture The Flag competitions, challenges, writeups, and cybersecurity contests.',
    icon: '🚩',
    color: '#ff9800',
    tags: ['capture-the-flag', 'competitions', 'challenges', 'security'],
    category: 'Security'
  },
  {
    name: 'OSINT',
    slug: 'osint',
    description: 'Open Source Intelligence gathering, tools, techniques, and investigations.',
    icon: '🕵️',
    color: '#673ab7',
    tags: ['intelligence', 'investigation', 'research', 'tools'],
    category: 'Security'
  },
  {
    name: 'Cryptography',
    slug: 'cryptography',
    description: 'Encryption algorithms, cryptanalysis, blockchain, and secure communication protocols.',
    icon: '🔐',
    color: '#3f51b5',
    tags: ['encryption', 'crypto', 'algorithms', 'security'],
    category: 'Security'
  },
  {
    name: 'Malware Analysis',
    slug: 'malware-analysis',
    description: 'Malware research, analysis techniques, sandboxing, and threat intelligence.',
    icon: '🦠',
    color: '#e91e63',
    tags: ['malware', 'analysis', 'threats', 'research'],
    category: 'Security'
  },
  {
    name: 'Hardware Hacking',
    slug: 'hardware-hacking',
    description: 'IoT security, embedded systems, firmware analysis, and physical device hacking.',
    icon: '⚡',
    color: '#ff5722',
    tags: ['hardware', 'iot', 'embedded', 'firmware'],
    category: 'Security'
  }
];

async function seedCommunities() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/port42', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    console.log('🔍 Checking existing communities...');
    
    // Check how many communities already exist
    const existingCount = await Community.countDocuments();
    console.log(`📊 Found ${existingCount} existing communities`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const communityData of communities) {
      try {
        // Check if community already exists
        const existing = await Community.findOne({ 
          $or: [
            { slug: communityData.slug },
            { name: communityData.name }
          ]
        });
        
        if (existing) {
          console.log(`⚠️  Community "${communityData.name}" already exists, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Create new community
        const community = new Community({
          ...communityData,
          isActive: true,
          isFeatured: ['python', 'javascript', 'cybersecurity', 'ai', 'web-development'].includes(communityData.slug),
          memberCount: 0,
          resourceCount: 0,
          createdAt: new Date(),
          lastActivity: new Date()
        });
        
        await community.save();
        console.log(`✅ Created community: ${communityData.name} (${communityData.slug})`);
        createdCount++;
        
      } catch (error) {
        console.error(`❌ Error creating community "${communityData.name}":`, error.message);
      }
    }
    
    console.log('\n🎉 Community seeding completed!');
    console.log(`📈 Summary:`);
    console.log(`   - Created: ${createdCount} communities`);
    console.log(`   - Skipped: ${skippedCount} communities (already exist)`);
    console.log(`   - Total communities now: ${await Community.countDocuments()}`);
    
    // List all communities
    console.log('\n📋 All communities:');
    const allCommunities = await Community.find().sort({ name: 1 }).select('name slug memberCount');
    allCommunities.forEach(community => {
      console.log(`   • ${community.name} (${community.slug}) - ${community.memberCount} members`);
    });
    
  } catch (error) {
    console.error('💥 Error seeding communities:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the seed script
if (require.main === module) {
  seedCommunities();
}

module.exports = { seedCommunities, communities };
