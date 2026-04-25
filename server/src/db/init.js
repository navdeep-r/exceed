const pool = require('./pool');

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ
      )
    `);

    // Lectures table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lectures (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500) NOT NULL,
        audio_file_path VARCHAR(500),
        transcript TEXT,
        recorded_at TIMESTAMPTZ DEFAULT NOW(),
        duration INTEGER DEFAULT 0,
        status VARCHAR(30) DEFAULT 'completed' CHECK (status IN ('recording', 'transcribing', 'completed', 'failed'))
      )
    `);

    // Notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500),
        content TEXT,
        language VARCHAR(10) DEFAULT 'en',
        is_original BOOLEAN DEFAULT true,
        parent_notes_id UUID REFERENCES notes(id) ON DELETE SET NULL,
        published_at TIMESTAMPTZ,
        version INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Quizzes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        notes_id UUID REFERENCES notes(id) ON DELETE CASCADE,
        title VARCHAR(500),
        question_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options JSONB NOT NULL DEFAULT '[]',
        correct_answer INTEGER NOT NULL,
        explanation TEXT,
        difficulty VARCHAR(20) DEFAULT 'medium'
      )
    `);

    // Quiz results table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        answers JSONB NOT NULL DEFAULT '[]',
        score NUMERIC(5,2) NOT NULL DEFAULT 0,
        completed_at TIMESTAMPTZ DEFAULT NOW(),
        time_spent INTEGER DEFAULT 0
      )
    `);

    // Flashcards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS flashcards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        notes_id UUID REFERENCES notes(id) ON DELETE CASCADE,
        front TEXT NOT NULL,
        back TEXT NOT NULL,
        reviewed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Planner activities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS planner_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(30) DEFAULT 'custom' CHECK (type IN ('notes', 'quiz', 'flashcards', 'custom')),
        content_id UUID,
        title VARCHAR(500) NOT NULL,
        description TEXT,
        scheduled_date DATE NOT NULL,
        completed BOOLEAN DEFAULT false,
        completed_at TIMESTAMPTZ,
        xp_reward INTEGER DEFAULT 10,
        is_auto_generated BOOLEAN DEFAULT false
      )
    `);

    // Doubts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS doubts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES users(id) ON DELETE CASCADE,
        lecture_id VARCHAR(100),
        question_text TEXT NOT NULL,
        is_voice BOOLEAN DEFAULT false,
        audio_file_path VARCHAR(500),
        submitted_at TIMESTAMPTZ DEFAULT NOW(),
        response TEXT,
        responded_at TIMESTAMPTZ,
        responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'answered'))
      )
    `);

    // Progress table
    await client.query(`
      CREATE TABLE IF NOT EXISTS progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        total_xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        notes_viewed INTEGER DEFAULT 0,
        quizzes_completed INTEGER DEFAULT 0,
        flashcards_reviewed INTEGER DEFAULT 0,
        average_quiz_score NUMERIC(5,2) DEFAULT 0,
        last_activity_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query('COMMIT');
    console.log('Database initialized successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database init failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initDB();
