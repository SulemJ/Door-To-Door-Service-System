import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../index.js';
                                    
const router = express.Router();


router.post('/sign-in', async (req, res) => {
  const { password, email } = req.body;

  if (!password || !email) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  try {
    const tables = [
      { table: 'admins', role: 'admin' },
      { table: 'providers', role: 'serviceProvider' },
      { table: 'users', role: 'user' }
    ];

    let user = null;
    let role = null;

    for (const { table, role: r } of tables) {
      const query = `SELECT * FROM ${table} WHERE email = $1 LIMIT 1`;
      const { rows } = await db.query(query, [email]);

      if (rows.length > 0) {
        const match = await bcrypt.compare(password, rows[0].password);
        if (match) {
          user = rows[0];
          role = r;
          break;
        }
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // If user is from 'users' table, check tokens before proceeding
    if (role === 'serviceProvider') {
      const tokenCheck = await db.query('SELECT tokens FROM providers WHERE id = $1', [user.id]);
      const tokens = tokenCheck.rows[0]?.tokens || 0;
      // console.log('User tokens:', user.id, tokens);

      if (tokens < 20) {
        
        return res.status(403).json({ success: false, redirect: '/pa', message: 'Insufficient tokens' });
      }
    }

    // Save session and respond
    req.session.user = { id: user.id, email: user.email, role };
    res.status(200).json({ success: true, user: { id: user.id, email: user.email, role } });
  } catch (error) {
    console.error('Error in sign-in route:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


router.get('/current-user', (req, res) => {
  if (req.session.user) {
    res.status(200).json(req.session.user);
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});

router.post("/logout", (req, res) => {
  if (req.session) {
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.error("Failed to destroy session:", err);
        return res.status(500).json({ message: "Failed to logout." });
      }
      // Clear the cookie
      res.clearCookie("connect.sid"); // Replace with your session cookie name if different
      return res.status(200).json({ message: "Logout successful." });
    });
  } else {
    res.status(200).json({ message: "No active session." });
  }
});

export default router;

