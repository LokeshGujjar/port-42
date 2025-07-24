// 🚀 Complete Database Seed Script
// Seeds communities and sample resources for Port42

const mongoose = require('mongoose');
const Community = require('../models/Community');
const Resource = require('../models/Resource');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Sample resources for each community
const sampleResources = {
  'python': [
    {
      title: 'Python.org Official Tutorial',
      url: 'https://docs.python.org/3/tutorial/',
      description: 'The official Python tutorial - start here for learning Python fundamentals',
      type: 'tutorial',
      difficulty: 'beginner',
      tags: ['beginner', 'official', 'documentation']
    },
    {
      title: 'Real Python',
      url: 'https://realpython.com/',
      description: 'High-quality Python tutorials and articles for all skill levels',
      type: 'article',
      difficulty: 'intermediate',
      tags: ['tutorials', 'advanced', 'practical']
    }
  ],
  'javascript': [
    {
      title: 'MDN JavaScript Guide',
      url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      description: 'Comprehensive JavaScript guide from Mozilla Developer Network',
      type: 'documentation',
      difficulty: 'beginner',
      tags: ['beginner', 'reference', 'web']
    },
    {
      title: 'JavaScript.info',
      url: 'https://javascript.info/',
      description: 'Modern JavaScript tutorial with in-depth explanations',
      type: 'tutorial',
      difficulty: 'intermediate',
      tags: ['modern', 'comprehensive', 'es6']
    }
  ],
  'cybersecurity': [
    {
      title: 'OWASP Top 10',
      url: 'https://owasp.org/www-project-top-ten/',
      description: 'Top 10 most critical web application security risks',
      type: 'documentation',
      difficulty: 'intermediate',
      tags: ['web-security', 'vulnerabilities', 'owasp']
    },
    {
      title: 'Cybrary',
      url: 'https://www.cybrary.it/',
      description: 'Free cybersecurity training and certification courses',
      type: 'course',
      difficulty: 'beginner',
      tags: ['training', 'free', 'certification']
    }
  ],
  'ai': [
    {
      title: 'OpenAI',
      url: 'https://openai.com/',
      description: 'Leading AI research company and creator of GPT models',
      type: 'other',
      difficulty: 'intermediate',
      tags: ['research', 'gpt', 'language-models']
    },
    {
      title: 'Hugging Face',
      url: 'https://huggingface.co/',
      description: 'Platform for machine learning models and datasets',
      type: 'tool',
      difficulty: 'intermediate',
      tags: ['models', 'transformers', 'datasets']
    }
  ]
};

async function createSystemUser() {
  try {
    // Check if system user exists
    let systemUser = await User.findOne({ username: 'port42-system' });
    
    if (!systemUser) {
      console.log('👤 Creating system user...');
      
      const hashedPassword = await bcrypt.hash('system-user-password-' + Date.now(), 12);
      
      systemUser = new User({
        username: 'port42-system',
        email: 'system@port42.dev',
        password: hashedPassword,
        displayName: 'Port42 System',
        isVerified: true,
        role: 'admin',
        profile: {
          bio: 'System user for seeding initial content',
          avatar: '🤖'
        }
      });
      
      await systemUser.save();
      console.log('✅ System user created');
    } else {
      console.log('👤 System user already exists');
    }
    
    return systemUser;
  } catch (error) {
    console.error('❌ Error creating system user:', error);
    throw error;
  }
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    console.log('🔌 Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/port42', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Create system user first
    const systemUser = await createSystemUser();
    
    // Import communities from the seed file
    const { communities } = require('./seedCommunities');
    
    console.log('🏛️ Seeding communities...');
    let communitiesCreated = 0;
    const createdCommunities = {};
    
    for (const communityData of communities) {
      try {
        const existing = await Community.findOne({ slug: communityData.slug });
        
        if (!existing) {
          const community = new Community({
            ...communityData,
            creator: systemUser._id,
            isActive: true,
            isFeatured: ['python', 'javascript', 'cybersecurity', 'ai', 'web-development'].includes(communityData.slug),
            memberCount: Math.floor(Math.random() * 1000) + 50, // Random member count for demo
            resourceCount: 0,
            createdAt: new Date(),
            lastActivity: new Date()
          });
          
          await community.save();
          createdCommunities[communityData.slug] = community;
          communitiesCreated++;
          console.log(`✅ Created community: ${communityData.name}`);
        } else {
          createdCommunities[communityData.slug] = existing;
          console.log(`⚠️  Community "${communityData.name}" already exists`);
        }
      } catch (error) {
        console.error(`❌ Error creating community "${communityData.name}":`, error.message);
      }
    }
    
    console.log(`🎉 Communities: ${communitiesCreated} created`);
    
    // Seed sample resources
    console.log('📚 Seeding sample resources...');
    let resourcesCreated = 0;
    
    for (const [communitySlug, resources] of Object.entries(sampleResources)) {
      const community = createdCommunities[communitySlug];
      if (!community) continue;
      
      for (const resourceData of resources) {
        try {
          const existing = await Resource.findOne({ url: resourceData.url });
          
          if (!existing) {
            const resource = new Resource({
              ...resourceData,
              submittedBy: systemUser._id,
              community: community._id,
              upvotes: Math.floor(Math.random() * 50) + 5,
              downvotes: Math.floor(Math.random() * 5),
              views: Math.floor(Math.random() * 500) + 50,
              isApproved: true,
              createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
            });
            
            await resource.save();
            
            // Update community resource count
            await Community.findByIdAndUpdate(community._id, {
              $inc: { resourceCount: 1 },
              lastActivity: new Date()
            });
            
            resourcesCreated++;
            console.log(`✅ Created resource: ${resourceData.title} in ${community.name}`);
          }
        } catch (error) {
          console.error(`❌ Error creating resource "${resourceData.title}":`, error.message);
        }
      }
    }
    
    console.log(`🎉 Resources: ${resourcesCreated} created`);
    
    // Final statistics
    const totalCommunities = await Community.countDocuments();
    const totalResources = await Resource.countDocuments();
    const totalUsers = await User.countDocuments();
    
    console.log('\n📊 Database Seeding Complete!');
    console.log('═══════════════════════════════');
    console.log(`👥 Users: ${totalUsers}`);
    console.log(`🏛️  Communities: ${totalCommunities}`);
    console.log(`📚 Resources: ${totalResources}`);
    console.log('═══════════════════════════════');
    
    console.log('\n🚀 Your Port42 platform is ready!');
    console.log('Visit http://localhost:3000 to explore the communities');
    
  } catch (error) {
    console.error('💥 Database seeding failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase().catch(console.error);
}

module.exports = { seedDatabase };
