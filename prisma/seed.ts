import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hayah-ai.com' },
    update: {},
    create: {
      email: 'admin@hayah-ai.com',
      name: 'Admin User',
      role: 'SUPER_ADMIN',
      passwordHash: await hash('admin123', 12),
      bio: 'Platform administrator',
      isActive: true,
      emailNotifications: true,
      theme: 'auto',
      language: 'en',
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create author user
  const authorUser = await prisma.user.upsert({
    where: { email: 'author@hayah-ai.com' },
    update: {},
    create: {
      email: 'author@hayah-ai.com',
      name: 'Content Author',
      role: 'AUTHOR',
      passwordHash: await hash('author123', 12),
      bio: 'Content creator specializing in technology and travel',
      website: 'https://hayah-ai.com',
      twitter: '@hayahai',
      github: 'hayahai',
      linkedin: 'hayahai',
      isActive: true,
      emailNotifications: true,
      theme: 'auto',
      language: 'en',
    },
  });

  console.log('✅ Created author user:', authorUser.email);

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@hayah-ai.com' },
    update: {},
    create: {
      email: 'demo@hayah-ai.com',
      name: 'Demo User',
      role: 'USER',
      bio: 'Demo user for testing',
      isActive: true,
      emailNotifications: false,
      theme: 'light',
      language: 'en',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { name: 'React' },
      update: {},
      create: {
        name: 'React',
        slug: 'react',
        color: '#61DAFB',
        usageCount: 5,
      },
    }),
    prisma.tag.upsert({
      where: { name: 'Next.js' },
      update: {},
      create: {
        name: 'Next.js',
        slug: 'nextjs',
        color: '#000000',
        usageCount: 8,
      },
    }),
    prisma.tag.upsert({
      where: { name: 'TypeScript' },
      update: {},
      create: {
        name: 'TypeScript',
        slug: 'typescript',
        color: '#3178C6',
        usageCount: 12,
      },
    }),
    prisma.tag.upsert({
      where: { name: 'Travel' },
      update: {},
      create: {
        name: 'Travel',
        slug: 'travel',
        color: '#FF6B6B',
        usageCount: 15,
      },
    }),
    prisma.tag.upsert({
      where: { name: 'Architecture' },
      update: {},
      create: {
        name: 'Architecture',
        slug: 'architecture',
        color: '#4ECDC4',
        usageCount: 7,
      },
    }),
    prisma.tag.upsert({
      where: { name: 'Photography' },
      update: {},
      create: {
        name: 'Photography',
        slug: 'photography',
        color: '#FFD93D',
        usageCount: 10,
      },
    }),
  ]);

  console.log('✅ Created tags:', tags.map(tag => tag.name).join(', '));

  // Create sample posts
  const techPost = await prisma.post.create({
    data: {
      title: 'Building Bulletproof Web Applications with Next.js 14',
      slug: 'building-bulletproof-web-applications-nextjs-14',
      excerpt: 'Learn how to create error-free, production-ready web applications using Next.js 14 with TypeScript and comprehensive error handling.',
      content: `# Building Bulletproof Web Applications with Next.js 14

In this comprehensive guide, we'll explore how to build production-ready web applications with zero-tolerance for errors using Next.js 14.

## The Foundation: TypeScript Strict Mode

TypeScript is the cornerstone of bulletproof applications. With strict mode enabled, we catch potential issues at compile time:

\`\`\`typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
\`\`\`

## Error Boundaries and Defensive Programming

Every component should be wrapped with error boundaries to prevent cascading failures:

\`\`\`tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error}: {error: Error}) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

export function MyComponent() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SomeComponent />
    </ErrorBoundary>
  );
}
\`\`\`

## Database Design with Prisma

Our database schema includes comprehensive validation and audit trails:

- Soft deletes with \`deletedAt\` timestamps
- Audit logs for all critical operations
- Performance indexes on frequently queried fields
- Constraint validation at the database level

## Conclusion

Building bulletproof applications requires a multi-layered approach to error prevention. By combining TypeScript, error boundaries, comprehensive testing, and defensive programming patterns, we can create applications that gracefully handle any scenario.`,
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      published: true,
      featured: true,
      readTime: 12,
      wordCount: 850,
      views: 1250,
      likes: 45,
      shares: 12,
      category: 'TECHNOLOGY',
      status: 'PUBLISHED',
      seoTitle: 'Building Bulletproof Web Apps with Next.js 14 | Hayah-AI',
      seoDescription: 'Learn to build error-free, production-ready web applications using Next.js 14, TypeScript, and comprehensive error handling strategies.',
      seoKeywords: 'Next.js,TypeScript,Error Handling,Web Development,React',
      hasCodeBlocks: true,
      authorId: authorUser.id,
      publishedAt: new Date(),
      tags: {
        connect: [
          { name: 'React' },
          { name: 'Next.js' },
          { name: 'TypeScript' },
        ],
      },
    },
  });

  // Create code blocks for the tech post
  await prisma.codeBlock.createMany({
    data: [
      {
        title: 'TypeScript Configuration',
        language: 'json',
        code: `{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}`,
        order: 1,
        postId: techPost.id,
      },
      {
        title: 'Error Boundary Component',
        language: 'tsx',
        code: `import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({error}: {error: Error}) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
    </div>
  );
}

export function MyComponent() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <SomeComponent />
    </ErrorBoundary>
  );
}`,
        order: 2,
        postId: techPost.id,
      },
    ],
  });

  console.log('✅ Created tech post with code blocks:', techPost.title);

  const travelPost = await prisma.post.create({
    data: {
      title: 'Digital Nomad Guide: Working from Bali\'s Hidden Gems',
      slug: 'digital-nomad-guide-bali-hidden-gems',
      excerpt: 'Discover the best remote work locations in Bali beyond the tourist hotspots. Complete with coworking spaces, internet speeds, and local insights.',
      content: `# Digital Nomad Guide: Working from Bali's Hidden Gems

Bali has become synonymous with digital nomadism, but most guides focus on the overcrowded areas of Canggu and Ubud. Let's explore some hidden gems that offer the perfect blend of productivity and paradise.

## Amed: The Tranquil East Coast

Amed offers crystal-clear waters and a peaceful environment perfect for deep work. The internet infrastructure has improved dramatically in recent years.

### Coworking Spaces
- **Amed Coworking**: Fast WiFi (50+ Mbps), ocean views
- **Blue Corner**: Affordable day passes, great coffee

### Accommodation
Most villas offer dedicated workspace areas with reliable internet.

## Munduk: Mountain Serenity

For those who prefer cooler temperatures and mountain views, Munduk is an excellent choice.

### Work Environment
- Cool climate (20-25°C)
- Minimal crowds
- Excellent coffee culture
- Reliable Starlink internet available

## Sanur: The Sophisticated Choice

Often overlooked by younger nomads, Sanur offers a more mature environment with excellent infrastructure.

### Benefits
- Consistent internet speeds
- Professional atmosphere
- Less party noise
- Easy access to airport

## Practical Tips

1. **Internet Backup**: Always have a mobile hotspot as backup
2. **Time Zone Management**: Bali is UTC+8, plan calls accordingly
3. **Visa Requirements**: B211A visa allows 30-day stays, extendable once
4. **Banking**: Wise and Revolut work well for international transfers

## Conclusion

Bali offers incredible opportunities for remote work beyond the typical tourist trails. These hidden gems provide the perfect balance of productivity, culture, and natural beauty.`,
      coverImage: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800',
      published: true,
      featured: false,
      readTime: 8,
      wordCount: 650,
      views: 890,
      likes: 67,
      shares: 23,
      category: 'TRAVEL',
      status: 'PUBLISHED',
      seoTitle: 'Digital Nomad Bali Guide: Hidden Remote Work Spots | Hayah-AI',
      seoDescription: 'Discover Bali\'s best hidden gems for digital nomads. Complete guide to remote work locations, coworking spaces, and local insights.',
      seoKeywords: 'Digital Nomad,Bali,Remote Work,Travel,Coworking',
      hasMap: true,
      authorId: authorUser.id,
      publishedAt: new Date(Date.now() - 86400000), // Yesterday
      tags: {
        connect: [
          { name: 'Travel' },
        ],
      },
    },
  });

  // Create travel locations for the travel post
  await prisma.travelLocation.createMany({
    data: [
      {
        name: 'Amed Coworking Space',
        latitude: -8.3442,
        longitude: 115.6647,
        address: 'Jl. I Ketut Natih, Amed, Karangasem, Bali',
        postId: travelPost.id,
      },
      {
        name: 'Munduk Village',
        latitude: -8.2644,
        longitude: 115.1239,
        address: 'Munduk, Banjar, Buleleng, Bali',
        postId: travelPost.id,
      },
      {
        name: 'Sanur Beach',
        latitude: -8.6882,
        longitude: 115.2636,
        address: 'Sanur, Denpasar Selatan, Denpasar, Bali',
        postId: travelPost.id,
      },
    ],
  });

  console.log('✅ Created travel post with locations:', travelPost.title);

  const sitesPost = await prisma.post.create({
    data: {
      title: 'Architectural Marvels: Singapore\'s Sustainable Skyline',
      slug: 'architectural-marvels-singapore-sustainable-skyline',
      excerpt: 'Explore how Singapore is redefining urban architecture with sustainable design principles and innovative green building technologies.',
      content: `# Architectural Marvels: Singapore's Sustainable Skyline

Singapore has emerged as a global leader in sustainable urban architecture, seamlessly blending cutting-edge design with environmental consciousness.

## The Green Building Revolution

### Gardens by the Bay
The iconic Supertrees are more than just architectural spectacle—they're functional ecosystems that:
- Collect rainwater
- Generate solar power
- Support plant growth
- Provide natural cooling

### Marina Bay Sands
Beyond its striking infinity pool, the integrated resort incorporates:
- Rainwater harvesting systems
- Energy-efficient building design
- Green roof technologies
- Smart lighting systems

## Sustainable Design Principles

### Vertical Gardens
Singapore's "City in a Garden" vision is realized through:
- Building-integrated vegetation
- Reduced urban heat island effect
- Improved air quality
- Enhanced biodiversity

### Passive Cooling
Traditional tropical architecture principles adapted for modern buildings:
- Natural ventilation systems
- Strategic building orientation
- Shading elements
- Reflective materials

## Timeline of Green Architecture

The evolution of Singapore's sustainable building practices showcases rapid innovation and government commitment to environmental goals.

## Future Innovations

Singapore continues to push boundaries with:
- Carbon-neutral building standards
- Integrated urban farming
- Smart building technologies
- Resilient climate adaptation

## Conclusion

Singapore's architectural landscape demonstrates that sustainability and stunning design can coexist, creating a blueprint for cities worldwide.`,
      coverImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
      published: true,
      featured: true,
      readTime: 10,
      wordCount: 720,
      views: 1120,
      likes: 89,
      shares: 34,
      category: 'SITES',
      status: 'PUBLISHED',
      seoTitle: 'Singapore Sustainable Architecture Guide | Green Buildings',
      seoDescription: 'Discover Singapore\'s innovative sustainable architecture and green building technologies shaping the future of urban design.',
      seoKeywords: 'Architecture,Singapore,Sustainable Design,Green Buildings,Urban Planning',
      hasTimeline: true,
      hasGallery: true,
      authorId: authorUser.id,
      publishedAt: new Date(Date.now() - 172800000), // 2 days ago
      tags: {
        connect: [
          { name: 'Architecture' },
          { name: 'Photography' },
        ],
      },
    },
  });

  // Create timeline events for the sites post
  await prisma.timelineEvent.createMany({
    data: [
      {
        title: 'Singapore Green Building Masterplan',
        description: 'Government launches comprehensive green building strategy',
        date: new Date('2005-01-01'),
        order: 1,
        postId: sitesPost.id,
      },
      {
        title: 'Gardens by the Bay Opens',
        description: 'Iconic sustainable landmark opens to public',
        date: new Date('2012-06-29'),
        order: 2,
        postId: sitesPost.id,
      },
      {
        title: 'Marina Bay Sands Completion',
        description: 'Integrated resort with advanced sustainable features',
        date: new Date('2010-04-27'),
        order: 3,
        postId: sitesPost.id,
      },
      {
        title: 'Green Building Incentive Scheme',
        description: 'Enhanced incentives for sustainable construction',
        date: new Date('2017-01-01'),
        order: 4,
        postId: sitesPost.id,
      },
      {
        title: 'Super Low Energy Buildings Program',
        description: 'Target for 80% energy reduction in new buildings',
        date: new Date('2020-01-01'),
        order: 5,
        postId: sitesPost.id,
      },
    ],
  });

  // Create media gallery for the sites post
  await prisma.mediaGallery.createMany({
    data: [
      {
        url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
        alt: 'Marina Bay Sands architectural view',
        caption: 'Marina Bay Sands showcasing integrated sustainable design',
        order: 1,
        type: 'image',
        postId: sitesPost.id,
      },
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
        alt: 'Gardens by the Bay Supertrees',
        caption: 'The iconic Supertrees at Gardens by the Bay',
        order: 2,
        type: 'image',
        postId: sitesPost.id,
      },
      {
        url: 'https://images.unsplash.com/photo-1514041179647-dcae53e2d68e?w=800',
        alt: 'Singapore skyline sustainable buildings',
        caption: 'Singapore\'s sustainable skyline at sunset',
        order: 3,
        type: 'image',
        postId: sitesPost.id,
      },
    ],
  });

  console.log('✅ Created sites post with timeline and gallery:', sitesPost.id);

  // Create some comments
  await prisma.comment.createMany({
    data: [
      {
        content: 'Excellent article! The error boundary examples are particularly helpful.',
        approved: true,
        postId: techPost.id,
        authorId: demoUser.id,
      },
      {
        content: 'Thanks for sharing these hidden gems in Bali. Munduk looks amazing!',
        approved: true,
        postId: travelPost.id,
        authorId: demoUser.id,
      },
      {
        content: 'Singapore\'s approach to sustainable architecture is truly inspiring.',
        approved: true,
        postId: sitesPost.id,
        authorName: 'Anonymous Reader',
        authorEmail: 'reader@example.com',
      },
    ],
  });

  console.log('✅ Created sample comments');

  // Create some analytics data
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const twoDaysAgo = new Date(today.getTime() - 172800000);

  await prisma.postAnalytics.createMany({
    data: [
      // Tech post analytics
      { postId: techPost.id, date: twoDaysAgo, views: 450, uniqueViews: 380 },
      { postId: techPost.id, date: yesterday, views: 520, uniqueViews: 420 },
      { postId: techPost.id, date: today, views: 280, uniqueViews: 240 },

      // Travel post analytics
      { postId: travelPost.id, date: yesterday, views: 320, uniqueViews: 280 },
      { postId: travelPost.id, date: today, views: 570, uniqueViews: 480 },

      // Sites post analytics
      { postId: sitesPost.id, date: twoDaysAgo, views: 380, uniqueViews: 320 },
      { postId: sitesPost.id, date: yesterday, views: 420, uniqueViews: 350 },
      { postId: sitesPost.id, date: today, views: 320, uniqueViews: 280 },
    ],
  });

  console.log('✅ Created analytics data');

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      {
        action: 'LOGIN',
        resource: 'USER',
        resourceId: adminUser.id,
        details: JSON.stringify({ method: 'email', success: true }),
        userId: adminUser.id,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      {
        action: 'CREATE',
        resource: 'POST',
        resourceId: techPost.id,
        details: JSON.stringify({ title: techPost.title, category: 'TECHNOLOGY' }),
        userId: authorUser.id,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      {
        action: 'PUBLISH',
        resource: 'POST',
        resourceId: travelPost.id,
        details: JSON.stringify({ title: travelPost.title, category: 'TRAVEL' }),
        userId: authorUser.id,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
    ],
  });

  console.log('✅ Created activity logs');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Seeded data summary:');
  console.log('- 3 users (admin, author, demo)');
  console.log('- 6 tags');
  console.log('- 3 posts (1 per category)');
  console.log('- Interactive content (code blocks, locations, timeline, gallery)');
  console.log('- 3 comments');
  console.log('- Analytics data for 3 days');
  console.log('- Activity logs');
  console.log('\n🔐 Login credentials:');
  console.log('Admin: admin@hayah-ai.com / admin123');
  console.log('Author: author@hayah-ai.com / author123');
  console.log('Demo: demo@hayah-ai.com (no password - OAuth only)');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });