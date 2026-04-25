const pool = require('./pool');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const teacherHash = await bcrypt.hash('password123', 10);
    const studentHash = await bcrypt.hash('password123', 10);

    // Create teacher
    const { rows: [teacher] } = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET first_name = $4
       RETURNING id`,
      ['teacher@exceed.com', teacherHash, 'teacher', 'Dr. Sarah', 'Chen']
    );

    // Create students
    const students = [];
    const studentData = [
      ['student@exceed.com', 'Alex', 'Johnson'],
      ['student2@exceed.com', 'Maria', 'Garcia'],
      ['student3@exceed.com', 'Raj', 'Patel'],
    ];

    for (const [email, first, last] of studentData) {
      const { rows: [s] } = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name)
         VALUES ($1, $2, 'student', $3, $4)
         ON CONFLICT (email) DO UPDATE SET first_name = $3
         RETURNING id`,
        [email, studentHash, first, last]
      );
      students.push(s);
    }

    // Create lectures
    const { rows: [lecture1] } = await client.query(
      `INSERT INTO lectures (teacher_id, title, transcript, status, duration)
       VALUES ($1, $2, $3, 'completed', 2400)
       RETURNING id`,
      [teacher.id, 'Introduction to Machine Learning',
       'Machine learning is a subset of artificial intelligence that focuses on building systems that learn from data. There are three main types: supervised learning, unsupervised learning, and reinforcement learning. Supervised learning uses labeled data to train models. Common algorithms include linear regression, decision trees, and neural networks.']
    );

    const { rows: [lecture2] } = await client.query(
      `INSERT INTO lectures (teacher_id, title, transcript, status, duration)
       VALUES ($1, $2, $3, 'completed', 1800)
       RETURNING id`,
      [teacher.id, 'Data Structures: Trees and Graphs',
       'Trees are hierarchical data structures with a root node and child nodes. Binary trees have at most two children per node. Binary search trees maintain ordering. Graphs consist of vertices and edges, and can be directed or undirected. Common traversal methods include BFS and DFS.']
    );

    // Create notes
    const { rows: [notes1] } = await client.query(
      `INSERT INTO notes (lecture_id, teacher_id, title, content, language, published_at)
       VALUES ($1, $2, $3, $4, 'en', NOW())
       RETURNING id`,
      [lecture1.id, teacher.id, 'Introduction to Machine Learning',
       '# Introduction to Machine Learning\n\n## What is Machine Learning?\nMachine learning is a **subset of artificial intelligence** that focuses on building systems that learn from data.\n\n## Types of Machine Learning\n\n### 1. Supervised Learning\n- Uses labeled training data\n- Maps input to output\n- Examples: classification, regression\n\n### 2. Unsupervised Learning\n- Works with unlabeled data\n- Finds hidden patterns\n- Examples: clustering, dimensionality reduction\n\n### 3. Reinforcement Learning\n- Learns through trial and error\n- Agent interacts with environment\n- Uses rewards and penalties\n\n## Key Algorithms\n- **Linear Regression**: For continuous predictions\n- **Decision Trees**: For classification tasks\n- **Neural Networks**: For complex pattern recognition\n\n## Key Concepts\n- Training data vs test data\n- Overfitting and underfitting\n- Feature engineering\n- Model evaluation metrics']
    );

    const { rows: [notes2] } = await client.query(
      `INSERT INTO notes (lecture_id, teacher_id, title, content, language, published_at)
       VALUES ($1, $2, $3, $4, 'en', NOW())
       RETURNING id`,
      [lecture2.id, teacher.id, 'Data Structures: Trees and Graphs',
       '# Data Structures: Trees and Graphs\n\n## Trees\nTrees are **hierarchical data structures** with a root node and child nodes.\n\n### Binary Trees\n- At most two children per node\n- Left child and right child\n\n### Binary Search Tree (BST)\n- Left subtree values < parent\n- Right subtree values > parent\n- O(log n) average search time\n\n## Graphs\nGraphs consist of **vertices** (nodes) and **edges** (connections).\n\n### Types\n- **Directed**: Edges have direction\n- **Undirected**: Edges are bidirectional\n- **Weighted**: Edges have values\n\n### Traversal Methods\n- **BFS** (Breadth-First Search): Level by level\n- **DFS** (Depth-First Search): Deep first, then backtrack']
    );

    // Create quizzes with questions
    const { rows: [quiz1] } = await client.query(
      `INSERT INTO quizzes (notes_id, title, question_count) VALUES ($1, $2, 4) RETURNING id`,
      [notes1.id, 'Machine Learning Quiz']
    );

    const q1Questions = [
      ['What is machine learning?', '["A programming language","A subset of AI that learns from data","A database system","A web framework"]', 1, 'Machine learning is a subset of artificial intelligence focused on learning from data.'],
      ['Which type of ML uses labeled data?', '["Unsupervised","Reinforcement","Supervised","None of these"]', 2, 'Supervised learning uses labeled training data to learn mappings.'],
      ['What is overfitting?', '["Too simple model","Model memorizes training data","Fast training","Low accuracy"]', 1, 'Overfitting occurs when a model learns noise in training data and performs poorly on new data.'],
      ['Which algorithm is best for complex patterns?', '["Linear Regression","Decision Trees","Neural Networks","K-means"]', 2, 'Neural networks excel at recognizing complex patterns in data.'],
    ];

    for (const [text, opts, correct, explanation] of q1Questions) {
      await client.query(
        `INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES ($1, $2, $3, $4, $5)`,
        [quiz1.id, text, opts, correct, explanation]
      );
    }

    const { rows: [quiz2] } = await client.query(
      `INSERT INTO quizzes (notes_id, title, question_count) VALUES ($1, $2, 3) RETURNING id`,
      [notes2.id, 'Trees & Graphs Quiz']
    );

    const q2Questions = [
      ['How many children can a binary tree node have?', '["1","2","3","Unlimited"]', 1, 'Binary trees have at most 2 children per node.'],
      ['What does BFS stand for?', '["Binary Find Search","Breadth-First Search","Best-First Sort","Backward Full Scan"]', 1, 'BFS = Breadth-First Search, explores level by level.'],
      ['In a BST, left subtree values are?', '["Greater than parent","Equal to parent","Less than parent","Random"]', 2, 'In a BST, left child values are always less than the parent.'],
    ];

    for (const [text, opts, correct, explanation] of q2Questions) {
      await client.query(
        `INSERT INTO questions (quiz_id, question_text, options, correct_answer, explanation) VALUES ($1, $2, $3, $4, $5)`,
        [quiz2.id, text, opts, correct, explanation]
      );
    }

    // Create flashcards
    const flashcards1 = [
      ['What is supervised learning?', 'A type of ML that uses labeled data to train models to map inputs to outputs.'],
      ['What is overfitting?', 'When a model learns the training data too well, including noise, and performs poorly on new data.'],
      ['Name three ML algorithms', 'Linear Regression, Decision Trees, Neural Networks'],
      ['What is reinforcement learning?', 'ML approach where an agent learns through trial and error using rewards and penalties.'],
    ];

    for (const [front, back] of flashcards1) {
      await client.query(`INSERT INTO flashcards (notes_id, front, back) VALUES ($1, $2, $3)`, [notes1.id, front, back]);
    }

    const flashcards2 = [
      ['What is a binary search tree?', 'A binary tree where left subtree values < parent and right subtree values > parent.'],
      ['Difference between BFS and DFS?', 'BFS explores level by level (breadth). DFS goes deep first, then backtracks.'],
      ['What is a directed graph?', 'A graph where edges have direction, meaning they go from one vertex to another.'],
    ];

    for (const [front, back] of flashcards2) {
      await client.query(`INSERT INTO flashcards (notes_id, front, back) VALUES ($1, $2, $3)`, [notes2.id, front, back]);
    }

    // Create progress for students
    for (const s of students) {
      const xp = Math.floor(Math.random() * 300) + 50;
      await client.query(
        `INSERT INTO progress (student_id, total_xp, level, notes_viewed, quizzes_completed, flashcards_reviewed, average_quiz_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (student_id) DO UPDATE SET total_xp = $2`,
        [s.id, xp, Math.floor(xp / 500) + 1, Math.floor(Math.random() * 5), Math.floor(Math.random() * 3), Math.floor(Math.random() * 10), Math.floor(Math.random() * 40) + 50]
      );
    }

    // Create planner activities
    const today = new Date().toISOString().split('T')[0];
    for (const s of students) {
      await client.query(
        `INSERT INTO planner_activities (student_id, type, title, scheduled_date, xp_reward, is_auto_generated)
         VALUES ($1, 'notes', 'Review: Machine Learning', $2, 15, true)`,
        [s.id, today]
      );
      await client.query(
        `INSERT INTO planner_activities (student_id, type, title, scheduled_date, xp_reward, is_auto_generated)
         VALUES ($1, 'quiz', 'Take ML Quiz', $2, 25, true)`,
        [s.id, today]
      );
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
