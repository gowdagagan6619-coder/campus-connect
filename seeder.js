const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Announcement = require('../models/Announcement');
const StudyMaterial = require('../models/StudyMaterial');

// Ensure dummy files exist for study materials in /uploads/materials
const ensureDummyFiles = () => {
  const materialsDir = path.join(__dirname, '..', 'uploads', 'materials');
  if (!fs.existsSync(materialsDir)) {
    fs.mkdirSync(materialsDir, { recursive: true });
  }

  const sampleFiles = [
    { name: 'dsa_lecture_slides.pdf', content: '%PDF-1.4 Data Structures Lecture Notes' },
    { name: 'os_scheduling_notes.pdf', content: '%PDF-1.4 Operating Systems Scheduling Algorithms' },
    { name: 'dbms_cheatsheet.pdf', content: '%PDF-1.4 Database Management Systems SQL Cheatsheet' },
    { name: 'analog_circuits_manual.pdf', content: '%PDF-1.4 Analog Circuits Lab Manual' },
    { name: 'engineering_maths_notes.pdf', content: '%PDF-1.4 Engineering Mathematics Formulas' },
  ];

  for (const f of sampleFiles) {
    const filePath = path.join(materialsDir, f.name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, f.content, 'utf-8');
    }
  }
};

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campus_connect');
    console.log('[Seeder] MongoDB Connected...');
  } catch (error) {
    console.error(`[Seeder Error] Database connection failed: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async (skipExit = false) => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
    ensureDummyFiles();

    console.log('[Seeder] Clearing existing data...');
    await Promise.all([
      User.deleteMany(),
      Event.deleteMany(),
      EventRegistration.deleteMany(),
      Announcement.deleteMany(),
      StudyMaterial.deleteMany(),
    ]);

    console.log('[Seeder] Creating Admin and Student accounts...');
    // Create Admin
    const admin = await User.create({
      name: 'Dr. Arthur Mitchell',
      email: 'admin@campusconnect.edu',
      password: 'AdminPassword123!',
      role: 'admin',
      department: 'Administration',
      phone: '+1 (555) 019-2831',
    });

    // Create Students
    const student1 = await User.create({
      name: 'Alex Johnson',
      email: 'alex.johnson@campusconnect.edu',
      password: 'StudentPassword123!',
      role: 'student',
      studentId: 'CS2023-042',
      department: 'Computer Science & Engineering',
      semester: 6,
      phone: '+1 (555) 234-5678',
    });

    const student2 = await User.create({
      name: 'Sarah Williams',
      email: 'sarah.williams@campusconnect.edu',
      password: 'StudentPassword123!',
      role: 'student',
      studentId: 'IT2023-118',
      department: 'Information Technology',
      semester: 4,
      phone: '+1 (555) 876-5432',
    });

    const student3 = await User.create({
      name: 'Michael Chen',
      email: 'michael.chen@campusconnect.edu',
      password: 'StudentPassword123!',
      role: 'student',
      studentId: 'EC2024-009',
      department: 'Electronics & Communication',
      semester: 2,
      phone: '+1 (555) 345-6789',
    });

    console.log('[Seeder] Creating Events...');
    const now = new Date();
    const futureDate = (days) => new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const event1 = await Event.create({
      title: 'Campus Hackathon 2026: AI & Web Innovation',
      description: 'A 36-hour continuous build hackathon where student teams design, develop, and present cutting-edge web and AI applications. Industry mentors and prize pool of $10,000.',
      category: 'Technical',
      venue: 'Auditorium Hall B & Innovation Lab',
      eventDate: futureDate(14),
      eventTime: '09:00 AM',
      capacity: 150,
      registeredCount: 0,
      status: 'Upcoming',
      createdBy: admin._id,
    });

    const event2 = await Event.create({
      title: 'Annual Cultural Festival - Tarangini 2026',
      description: 'Celebrate our campus diversity with vibrant musical performances, dance battles, theatrical plays, and food stalls from across the country.',
      category: 'Cultural',
      venue: 'Main University Amphitheatre',
      eventDate: futureDate(25),
      eventTime: '05:00 PM',
      capacity: 500,
      registeredCount: 0,
      status: 'Upcoming',
      createdBy: admin._id,
    });

    const event3 = await Event.create({
      title: 'Inter-College Football Championship Finals',
      description: 'Cheer for the college champions as they face off against regional rivals in the high-stakes finals of the collegiate football tournament.',
      category: 'Sports',
      venue: 'Sports Complex Main Ground',
      eventDate: futureDate(7),
      eventTime: '04:30 PM',
      capacity: 100,
      registeredCount: 0,
      status: 'Upcoming',
      createdBy: admin._id,
    });

    const event4 = await Event.create({
      title: 'Hands-on Workshop: Building LLM Apps with Python',
      description: 'Deep dive into Retrieval-Augmented Generation (RAG), vector embeddings, and LangChain to build custom production AI assistants.',
      category: 'Workshop',
      venue: 'Computer Science Lab 3',
      eventDate: futureDate(4),
      eventTime: '02:00 PM',
      capacity: 40,
      registeredCount: 0,
      status: 'Upcoming',
      createdBy: admin._id,
    });

    const event5 = await Event.create({
      title: 'Global Career Horizons: Masters & Research Abroad',
      description: 'Distinguished alumni panel discussing scholarship opportunities, GRE/TOEFL strategies, and graduate research admissions in Europe and North America.',
      category: 'Seminar',
      venue: 'Virtual Zoom / Seminar Hall A',
      eventDate: futureDate(10),
      eventTime: '11:00 AM',
      capacity: 200,
      registeredCount: 0,
      status: 'Upcoming',
      createdBy: admin._id,
    });

    console.log('[Seeder] Registering sample students for events...');
    // Alex registers for Hackathon & Workshop
    await EventRegistration.create({
      event: event1._id,
      student: student1._id,
      status: 'confirmed',
    });
    await Event.findByIdAndUpdate(event1._id, { $inc: { registeredCount: 1 } });

    await EventRegistration.create({
      event: event4._id,
      student: student1._id,
      status: 'confirmed',
    });
    await Event.findByIdAndUpdate(event4._id, { $inc: { registeredCount: 1 } });

    // Sarah registers for Hackathon & Cultural
    await EventRegistration.create({
      event: event1._id,
      student: student2._id,
      status: 'confirmed',
    });
    await Event.findByIdAndUpdate(event1._id, { $inc: { registeredCount: 1 } });

    await EventRegistration.create({
      event: event2._id,
      student: student2._id,
      status: 'confirmed',
    });
    await Event.findByIdAndUpdate(event2._id, { $inc: { registeredCount: 1 } });

    // Michael registers for Football & Workshop
    await EventRegistration.create({
      event: event3._id,
      student: student3._id,
      status: 'confirmed',
    });
    await Event.findByIdAndUpdate(event3._id, { $inc: { registeredCount: 1 } });

    await EventRegistration.create({
      event: event4._id,
      student: student3._id,
      status: 'confirmed',
    });
    await Event.findByIdAndUpdate(event4._id, { $inc: { registeredCount: 1 } });

    console.log('[Seeder] Creating Announcements...');
    await Announcement.create([
      {
        title: 'Urgent: Mid-Semester Examination Timetable & Seating Matrix Published',
        content: 'All undergraduate students must download their individual examination hall tickets from the student portal before Friday. Strictly no electronic devices are permitted inside examination halls.',
        priority: 'urgent',
        category: 'Exam',
        targetAudience: 'all',
        isPinned: true,
        author: admin._id,
      },
      {
        title: 'Campus Placements 2026: Tier-1 Tech Companies Slotting Finalized',
        content: 'Registration for Google, Microsoft, and Amazon campus rounds is now live for all 6th and 8th semester students. Ensure your resume and CGPA certifications are uploaded by Wednesday 5 PM.',
        priority: 'high',
        category: 'Placement',
        targetAudience: 'students',
        isPinned: true,
        author: admin._id,
      },
      {
        title: 'Central Library Extended 24x7 Study Room Access',
        content: 'To support preparation for upcoming exams, the Central Digital Library reading rooms on floors 2 and 3 will remain open 24 hours a day with high-speed WiFi and coffee vending facilities.',
        priority: 'medium',
        category: 'Academic',
        targetAudience: 'students',
        isPinned: false,
        author: admin._id,
      },
      {
        title: 'Annual Cultural Fest: Auditions for Music & Dance Society',
        content: 'Auditions for the university rock band, classical ensemble, and contemporary dance crew will be held this Saturday from 10 AM at Room 204. Open to all branches.',
        priority: 'low',
        category: 'Event',
        targetAudience: 'students',
        isPinned: false,
        author: admin._id,
      },
      {
        title: 'Scheduled Campus Network Maintenance - Sunday 02:00 AM - 05:00 AM',
        content: 'IT Infrastructure team will be upgrading core switches and campus fiber links. Brief intermittent connectivity drops may occur during this maintenance window.',
        priority: 'medium',
        category: 'General',
        targetAudience: 'all',
        isPinned: false,
        author: admin._id,
      },
    ]);

    console.log('[Seeder] Creating Study Materials...');
    await StudyMaterial.create([
      {
        title: 'Data Structures & Algorithms - Complete Master Slides & Complexity Notes',
        description: 'Comprehensive slides covering Trees, Graphs, Dynamic Programming, and Amortized Time Complexity.',
        subject: 'Data Structures and Algorithms',
        department: 'Computer Science & Engineering',
        semester: 3,
        fileUrl: '/uploads/materials/dsa_lecture_slides.pdf',
        originalFileName: 'dsa_lecture_slides.pdf',
        fileType: 'application/pdf',
        fileSize: 4210000,
        uploadedBy: admin._id,
      },
      {
        title: 'Operating Systems - Process Scheduling, Semaphores & Memory Paging',
        description: 'Official department lecture notes with code snippets in C and solved concurrency problems.',
        subject: 'Operating Systems',
        department: 'Computer Science & Engineering',
        semester: 4,
        fileUrl: '/uploads/materials/os_scheduling_notes.pdf',
        originalFileName: 'os_scheduling_notes.pdf',
        fileType: 'application/pdf',
        fileSize: 3150000,
        uploadedBy: admin._id,
      },
      {
        title: 'Database Management Systems - Relational Algebra & Normalization Cheatsheet',
        description: 'Covers 1NF, 2NF, 3NF, BCNF proofs, transaction ACID properties, and complex SQL joins.',
        subject: 'Database Systems',
        department: 'Information Technology',
        semester: 4,
        fileUrl: '/uploads/materials/dbms_cheatsheet.pdf',
        originalFileName: 'dbms_cheatsheet.pdf',
        fileType: 'application/pdf',
        fileSize: 1850000,
        uploadedBy: admin._id,
      },
      {
        title: 'Analog Electronic Circuits - Lab Manual & Circuit Simulations',
        description: 'Laboratory experiments for BJT amplifiers, OP-AMP filters, and oscilloscope waveform analysis.',
        subject: 'Analog Electronics',
        department: 'Electronics & Communication',
        semester: 2,
        fileUrl: '/uploads/materials/analog_circuits_manual.pdf',
        originalFileName: 'analog_circuits_manual.pdf',
        fileType: 'application/pdf',
        fileSize: 2600000,
        uploadedBy: admin._id,
      },
      {
        title: 'Engineering Mathematics IV - Probability Distributions & Numerical Methods',
        description: 'Formula handbook with past 5 years solved university question papers.',
        subject: 'Engineering Mathematics IV',
        department: 'General',
        semester: 4,
        fileUrl: '/uploads/materials/engineering_maths_notes.pdf',
        originalFileName: 'engineering_maths_notes.pdf',
        fileType: 'application/pdf',
        fileSize: 5120000,
        uploadedBy: admin._id,
      },
    ]);

    console.log('====================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY! ');
    console.log('====================================================');
    console.log('Demo Credentials for Testing:');
    console.log('  Admin Account:');
    console.log('    Email:    admin@campusconnect.edu');
    console.log('    Password: AdminPassword123!');
    console.log('  Student Accounts:');
    console.log('    Email:    alex.johnson@campusconnect.edu');
    console.log('    Password: StudentPassword123!');
    console.log('    Email:    sarah.williams@campusconnect.edu');
    console.log('    Password: StudentPassword123!');
    console.log('    Email:    michael.chen@campusconnect.edu');
    console.log('    Password: StudentPassword123!');
    console.log('====================================================');

    if (!skipExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error(`[Seeder Error] Failed to seed data: ${error.message}`);
    if (!skipExit) {
      process.exit(1);
    }
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await Promise.all([
      User.deleteMany(),
      Event.deleteMany(),
      EventRegistration.deleteMany(),
      Announcement.deleteMany(),
      StudyMaterial.deleteMany(),
    ]);
    console.log('[Seeder] All database records destroyed.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error] Failed to destroy data: ${error.message}`);
    process.exit(1);
  }
};

if (require.main === module) {
  if (process.argv[2] === '-d') {
    destroyData();
  } else {
    connectDB().then(() => seedData(false));
  }
}

module.exports = {
  seedDatabase: () => seedData(true),
  destroyData,
};
