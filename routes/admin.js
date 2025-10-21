import express from 'express';
import { db } from '../index.js';
import bcrypt from "bcryptjs";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';


const router = express.Router();


// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Or your preferred email provider
  auth: {
    user: 'jsulem14@gmail.com', // Replace with your email
    pass: 'ponn ljdi wrut fdzi', // Replace with your email password or app password
  },
});


// Route to add a new provider with an image
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads')); // Save inside 'public/uploads'
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// const upload = multer({ storage: storage });
const upload = multer({ storage });





router.get('/provider/:id/professions', async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    `SELECT c.name FROM provider_professions pp JOIN job_categories c ON pp.category_id = c.category_id WHERE pp.provider_id = $1`,
    [id]
  );
  res.json(result.rows);
});

router.get('/provider/:id/skills', async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    `SELECT s.name FROM provider_skills ps JOIN job_subcategories s ON ps.subcategory_id = s.category_id WHERE ps.provider_id = $1`,
    [id]
  );
  res.json(result.rows);
});







router.get('/applicants', async (req, res) => {
  try {
    const providers = await db.query(
      `SELECT * FROM providers WHERE registered = false ORDER BY id DESC`
    );

    const fullProviders = [];

    for (const provider of providers.rows) {
      const professions = await db.query(
        `SELECT c.name FROM provider_professions pp
         JOIN job_categories c ON pp.category_id = c.category_id
         WHERE pp.provider_id = $1`,
        [provider.id]
      );

      const skills = await db.query(
        `SELECT s.name FROM provider_skills ps
         JOIN job_subcategories s ON ps.subcategory_id = s.subcategory_id
         WHERE ps.provider_id = $1`,
        [provider.id]
      );

      fullProviders.push({
        ...provider,
        professions: professions.rows.map(p => p.name).join(', '),
        skills: skills.rows.map(s => s.name).join(', ')
      });
    }

    res.render('adminProviders', { providers: fullProviders });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.post('/providers/approve/:id', async (req, res) => {
  const providerId = req.params.id;

  // Generate a 6-digit registration code
  const registrationCode = crypto.randomInt(100000, 999999).toString();

  // Set expiration time to 72 minutes from now
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000 * 72); // 72 hours

  try {
    // Update provider with registration code, expiration, and set registered = true
    const result = await db.query(
      `UPDATE providers 
       SET registered = true, registration_code = $1, code_expires_at = $2 
       WHERE id = $3 
       RETURNING name, email`,
      [registrationCode, expiresAt, providerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).send('Provider not found');
    }

    const { name, email } = result.rows[0];

    const mailOptions = {
      from: 'jsulem14@gmail.com',
      to: email,
      subject: 'MaintainanceHub - Registration Code',
      text: `Hello ${name}!\n\nYou've been approved as a provider on MaintainanceHub.\n\nHere is your registration code:\n\n- Code: ${registrationCode}\n- Expires In: 72 Hours\n- Complete your registration here: http://localhost:5000/providerRegistration.html\n\nThank you!`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Email send error:', err);
      } else {
        console.log('Email sent:', info.response);
      }
    });

    res.redirect('/api/admin/applicants');
  } catch (err) {
    console.error('Approval failed:', err);
    res.status(500).send('Approval failed');
  }
});
router.post('/providers/decline/:id', async (req, res) => {
  const providerId = req.params.id;
  try {
    // First delete from join tables
    await db.query('DELETE FROM provider_professions WHERE id = $1', [providerId]);
    await db.query('DELETE FROM provider_skills WHERE id = $1', [providerId]);

    // Then delete from providers
    await db.query('DELETE FROM providers WHERE id = $1', [providerId]);

    res.redirect('/api/admin/applicants');
  } catch (err) {
    console.error(err);
    res.status(500).send('Decline failed');
  }
});



router.get('/providersProf', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.*,
        ARRAY(
          SELECT c.name
          FROM provider_professions pp
          JOIN job_categories c 
            ON pp.category_id = c.category_id
          WHERE pp.provider_id = p.id
        ) AS professions
      FROM providers p
      WHERE p.registered = true
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});


router.post('/addProvider', async (req, res) => {
  console.log(req.body);
  const { name, email, phone, address, personalInfo, professions, skills } = req.body;

  try {
    // Insert into providers
    const result = await db.query(
  'INSERT INTO providers (name, email, contact_phone, contact_address, personal_info) VALUES ($1, $2, $3, $4, $5) RETURNING id',
  [name, email, phone, address, personalInfo]
);

const providerId = result.rows[0].id; // ✅ Correct way for PostgreSQL

// Normalize array types
const professionsArray = Array.isArray(professions) ? professions : [professions];
const skillsArray = Array.isArray(skills) ? skills : [skills];

console.log("Professions:", professionsArray);
console.log("Skills:", skillsArray);

// Insert professions
for (const catId of professionsArray) {
  await db.query(
    'INSERT INTO provider_professions (provider_id, category_id) VALUES ($1, $2)',
    [providerId, parseInt(catId)]
  );
}

// Insert skills
for (const subId of skillsArray) {
  await db.query(
    'INSERT INTO provider_skills (provider_id, subcategory_id) VALUES ($1, $2)',
    [providerId, parseInt(subId)]
  );
}


    res.json({ message: 'Provider registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});




// Route to fetch providers
router.get('/providers', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM providers where registered = true ');
    const providers = result.rows.map((provider) => {
      
      return provider;
    });
    res.status(200).json(providers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Route to fetch providers
router.get('/allProviders', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM providers');
    const providers = result.rows.map((provider) => {
      
      return provider;
    });
    res.status(200).json(providers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// Get provider by ID
router.get('/providers/:id', async (req, res) => {
  const { id } = req.params;

  try {
      const result = await db.query('SELECT * FROM providers WHERE id = $1', [id]);

    
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Provider not found' });
      }
  
      const provider = result.rows[0];
  
  
      res.status(200).json(provider);
  } catch (error) {
      console.error('Error fetching provider:', error);
      res.status(500).json({ success: false, message: 'Server error' });
  }
});


// Route to update provider status
router.patch('/providers/:id/status', async (req, res) => {
  const { id } = req.params;
  const { availability } = req.body;

  try {
    const query = `
      UPDATE providers SET availability = $1 WHERE id = $2
      RETURNING *;
    `;
    const values = [availability, id];
    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update provider status' });
  }
});


// Route to add a new user
router.post('/addUser', async (req, res) => {
  const {
    name,
    email,
    password,
  } = req.body;
console.log(req.body);

  try {
  const hashedPassword = await bcrypt.hash(password, 10); // Hash password

    const query = `
      INSERT INTO users 
      (name, email, password, tokens)
      VALUES ($1, $2, $3, $4)
      RETURNING id;
    `;
    const values = [
      name,
      email,
      hashedPassword,
      10,
    ];
    const result = await db.query(query, values);

    res.status(201).json({
      message: 'user added successfully',
      userId: result.rows[0].id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add user' });
  }
});


// Route to delete a provider
router.delete('/providers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM providers WHERE id = $1', [id]);
    res.status(200).json({ message: 'Provider deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete provider' });
  }
});


  
  router.post("/register", async (req, res) => {
  const { registrationCode, username, password } = req.body;

  try {
    const providerResult = await db.query(
      "SELECT * FROM providers WHERE registration_code = $1 AND registered = false",
      [registrationCode]
    );

    if (providerResult.rowCount === 0) {
      return res.status(400).json({ message: "Invalid or already used registration code!" });
    }

    const provider = providerResult.rows[0];

    const usernameResult = await db.query(
      "SELECT id FROM providers WHERE name = $1",
      [username]
    );

    if (usernameResult.rowCount > 0) {
      return res.status(400).json({ message: "Username is already taken!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check the user's token balance before updating availability
    const tokenResult = await db.query("SELECT tokens FROM users WHERE email = $1", [provider.email]);

    const tokens = tokenResult.rows[0]?.tokens || 0;
    const availability = tokens >= 200 ? "available" : "unavailable";

    // Update provider info
    await db.query(
      `UPDATE providers SET 
        registered = true,
        name = $1,
        availability = $2,
        password = $3
      WHERE id = $4`,
      [username, availability, hashedPassword, provider.id]
    );

    res.status(201).json({ message: "Registration completed successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

  router.post('/bookings', async (req, res) => {
    const { userId, providerId, serviceType, date, time, description } = req.body;
    
    if (!userId || !providerId || !serviceType || !date || !time || !description) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    try {
      // Insert booking into the database
      const result = await db.query(
        `INSERT INTO bookings (user_id, provider_id, service_type, date, time, description, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [userId, providerId, serviceType, date, time, description, 'pending']
      );
      
      const booking = result.rows[0];
      
      // Fetch provider email using providerId
      const providerResult = await db.query(
        'SELECT email FROM providers WHERE id = $1',
        [providerId]
      );
      
      const userResult = await db.query(
        'SELECT email FROM users WHERE id = $1',
        [userId]
      );
      
      if (providerResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Provider not found' });
      }
      
      const providerEmail = providerResult.rows[0].email;
      const userEmail = userResult.rows[0].email;
      
      // Send email to the provider
      const mailOptions = {
      from: 'jsulem14@gmail.com',
      to: providerEmail,
      subject: 'New Booking Received',
      text: `You have a new booking:
      - Service Type: ${serviceType}
      - User Email: ${userEmail}
      - Date: ${date}
      - Time: ${time}
      - Description: ${description}
      `,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
      } else {
        console.log('Email sent:', info.response);
      }
    });
    
    res.status(201).json({ success: true, booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});




// Get all bookings for the current user
router.get('/bookings/:userId', async (req, res) => {
  const { userId } = req.params;
  
  console.log(userId);
  console.log(req.params);
  
  try {
    const result = await db.query(
      "SELECT * FROM bookings WHERE id = $1 AND status != 'cancelled' ORDER BY date DESC",
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});
// Get all bookings for the current provider
router.get('/bookings/:providerId', async (req, res) => {
  const { providerId } = req.params;
  
  console.log(providerId);

  try {
    const result = await db.query(
      "SELECT * FROM bookings WHERE id = $1 AND status != 'cancelled' ORDER BY date DESC",
      [providerId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});
// Get all bookings for the current provider
router.get('/allBookings', async (req, res) => {
  
  
  try {
    const result = await db.query(
      "SELECT * FROM bookings ORDER BY date DESC"
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

router.delete('/bookings/:id', async (req, res) => {
  const { id } = req.params;
  console.log("Booking ID received for cancellation:", id);
  
  try {
    const result = await db.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *",
      [id]
    );
    console.log("Query result:", result);
    
    if (result.rowCount === 0) {
      console.warn("No booking found for ID:", id);
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

// Get provider details
router.get("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM providers WHERE id = $1", [id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update provider profile
router.put("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, profession } = req.body;
    await db.query(
      "UPDATE providers SET name = $1, profession = $2 WHERE id = $3",
      [name, profession, id]
    );
    res.json({ message: "Profile updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all bookings for a provider
router.get('/provider-bookings/:providerId', async (req, res) => {
  const { providerId } = req.params;
  
  try {
    const result = await db.query(
      `SELECT 
      b.*,
      u.name as user_name
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      WHERE b.user_id = $1 
      ORDER BY b.date DESC`,
      [providerId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings" });
  }
});

router.delete('/bookings/:id', async (req, res) => {
  const { id } = req.params;
  console.log("Booking ID received for cancellation:", id);
  
  try {
    const result = await db.query(
      "UPDATE bookings SET status = 'cancelled' WHERE id = $1 RETURNING *",
      [id]
    );
    console.log("Query result:", result);
    
    if (result.rowCount === 0) {
      console.warn("No booking found for ID:", id);
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Failed to cancel booking" });
  }
});

// Get provider details
router.get("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("SELECT * FROM providers WHERE id = $1", [id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update provider profile
router.put("/providers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, profession } = req.body;
    await db.query(
      "UPDATE providers SET name = $1, profession = $2 WHERE id = $3",
      [name, profession, id]
    );
    res.json({ message: "Profile updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update booking status
router.put('/bookings/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const result = await db.query(
      "UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Fetch user id using booking id
    const userResult = await db.query(
      'SELECT id FROM bookings WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'user not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Fetch provider email using providerId
    const userIdResult = await db.query(
      'SELECT email FROM users WHERE id = $1',
      [userId]
    );
    const userEmail = userIdResult.rows[0].email;
    
    // Send email to the provider
    const mailOptions = {
      from: 'jsulem14@gmail.com',
      to: userEmail,
      subject: 'Update on your booking',
      text: `your booking status was changed contact us if you have any feedback,
      - Booking Status: ${status}
      `,
    };
    
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
      } else {
        console.log('Email sent:', info.response);
      }
    });
    
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ message: "Failed to update booking" });
  }
});


// calander events 
router.get("/events/:providerId", async (req, res) => {
  const { providerId } = req.params;
  
  try {
    const result = await db.query(
      "SELECT event_id, title, start_time AS start, end_time AS end, background_color AS backgroundColor, border_color AS borderColor, status FROM provider_events WHERE provider_id = $1",
      [providerId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Error fetching events");
  }
});

// Endpoint to add a new event
router.post("/events", async (req, res) => {
  const { title, start, end, providerId, status, backgroundColor, borderColor } = req.body;
  
  try {
    const result = await db.query(
      "INSERT INTO provider_events (title, start_time, end_time, provider_id, status, background_color, border_color) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [title, start, end, providerId, status, backgroundColor, borderColor]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).send("Error adding event");
  }
});

// Endpoint to delete an event
router.delete("/events/:id", async (req, res) => {
  const { id } = req.params;
  
  try {
    await db.query("DELETE FROM provider_events WHERE event_id = $1", [id]);
    res.sendStatus(204); // No Content
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).send("Error deleting event");
  }
});



// GET /jobs/:id
router.get('/jobs/:id', async (req, res) => {
  const { id } = req.params;
  const result = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
  const job = result.rows[0];
  res.render('jobDetails', { job });
});


// GET proposal form
router.get('/jobs/:id/propose', async (req, res) => {
  console.log('whatisthis', req.params.id);
  const job = await db.query('SELECT * FROM jobs WHERE id = $1', [req.params.id]);
  res.render('submitProposal', { job: job.rows[0] });
});

// POST proposal submission
router.post('/jobs/:id/propose', async (req, res) => {
  const { coverLetter, expectedPay } = req.body;
  const user = req.session.user;
  const jobId = req.params.id;

  if (!user) return res.status(401).send('Please log in.');

  await db.query(
    `INSERT INTO proposals (id, job_id, cover_letter, expected_pay)
     VALUES ($1, $2, $3, $4)`,
    [user.id, jobId, coverLetter, expectedPay]
  );
  res.redirect('/my-proposals');
});

router.get('/jobs/:id/proposals', async (req, res) => {
  const jobId = req.params.id;
  const user = req.session.user;

  // Ensure the logged in user is the owner of the job
  const job = await db.query('SELECT * FROM jobs WHERE id = $1 AND user_id = $2', [jobId, user.id]);
  if (job.rows.length === 0) return res.status(403).send('Unauthorized');

  const proposals = await db.query('SELECT * FROM proposals WHERE id = $1', [jobId]);
  res.render('viewProposals', { job: job.rows[0], proposals: proposals.rows });
});



// Get all services with category and subcategory names
router.get('/services', async (req, res) => {
  try {
    const services = await db.query(`
      SELECT 
        s.subcategory_id AS id,
        s.name AS subcategory,
        c.name AS category
      FROM job_subcategories s
      JOIN job_categories c 
        ON s.category_id = c.category_id
      ORDER BY c.name, s.name
    `);
    res.json(services.rows); // adjust `.rows` if you're not using pg
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});



router.get('/provider/:id/professions', async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    `SELECT c.name FROM provider_professions pp JOIN job_categories c ON pp.category_id = c.id WHERE pp.id = $1`,
    [id]
  );
  res.json(result.rows);
});

router.get('/provider/:id/skills', async (req, res) => {
  const { id } = req.params;
  const result = await db.query(
    `SELECT s.name FROM provider_skills ps JOIN job_subcategories s ON ps.subcategory_id = s.id WHERE ps.id = $1`,
    [id]
  );
  res.json(result.rows);
});
// Optionally, get categories list
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.query(`SELECT DISTINCT name FROM job_categories`);
    res.json(categories.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});


export default router;
