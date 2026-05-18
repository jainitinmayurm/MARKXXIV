const bcrypt = require('bcrypt');
const express = require('express');
const pool = require('./db'); 
const app = express();
const PORT = 3000;

app.use(express.json());


pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
  } else {
    console.log('Connected to database at:', res.rows[0].now);
  }
});



app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'super_secret_hackathon_key';

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/meetings', async (req, res) => {
  try {
    const { title, room_id, start_time, end_time, participant_ids } = req.body;

    if (room_id) {
      const roomConflict = await pool.query(
        `SELECT id FROM meetings 
         WHERE room_id = $1 
         AND status != 'Cancelled'
         AND (start_time < $3 AND end_time > $2)`,
        [room_id, start_time, end_time]
      );

      if (roomConflict.rows.length > 0) {
        return res.status(409).json({ error: "Room is already booked for this time." });
      }
    }

    if (participant_ids && participant_ids.length > 0) {
      const userConflict = await pool.query(
        `SELECT mp.user_id FROM meeting_participants mp
         JOIN meetings m ON mp.meeting_id = m.id
         WHERE mp.user_id = ANY($1::int[])
         AND m.status != 'Cancelled'
         AND (m.start_time < $3 AND m.end_time > $2)`,
        [participant_ids, start_time, end_time]
      );

      if (userConflict.rows.length > 0) {
        return res.status(409).json({ error: "One or more participants are double-booked." });
      }
    }

    const newMeeting = await pool.query(
      `INSERT INTO meetings (title, room_id, start_time, end_time) 
       VALUES ($1, $2, $3, $4) RETURNING id, title, start_time, end_time`,
      [title, room_id || null, start_time, end_time]
    );

    const meetingId = newMeeting.rows[0].id;

    if (participant_ids && participant_ids.length > 0) {
      for (let userId of participant_ids) {
        await pool.query(
          `INSERT INTO meeting_participants (meeting_id, user_id) VALUES ($1, $2)`,
          [meetingId, userId]
        );
      }
    }

    res.status(201).json(newMeeting.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.get('/api/meetings', async (req, res) => {
  try {
    const allMeetings = await pool.query(
      'SELECT * FROM meetings ORDER BY start_time ASC'
    );
    
    res.json(allMeetings.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});