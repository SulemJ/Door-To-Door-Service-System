import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import session from 'express-session';
// import passport from 'passport';
// import session from 'express-session';
import cookieParser from 'cookie-parser';
import axios from 'axios';

dotenv.config();

// Create Express App
const app = express();
const PORT = process.env.PORT || 5000;
const BASE_URL = 'http://localhost:5000';
// Set up PostgreSQL
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

app.use(cookieParser());
app.use(
  session({
    secret: 'your_secret_key', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { 
      secure: false, // Use `true` in production with HTTPS
      httpOnly: true, 
      maxAge: 60 * 60 * 1000, // 1 hour
    },
  })
);
// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Middleware for sessions
// app.use(
//   session({
//     secret: 'yourSecretKey', // Replace with a strong secret key
//     resave: false,
//     saveUninitialized: false,
//   })
// );
// Serve static files
const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));
// Initialize Passport and sessions
// app.use(passport.initialize());
// app.use(passport.session());

// Test DB connection
db.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err) => console.error('DB connection error:', err));

// API Routes
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);
// // Login Route
// app.post(
//   "/api/auth",
//   passport.authenticate("local", {
//     successRedirect: "/dashboard",
//     failureRedirect: "/sign-in",
//     failureFlash: true,
//   })
// );

// ejs routes
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public'));

// app.get('/postJob', (req, res) => {
//   const user = req.session.user;

//   if (!user) {
//     return res.render("sign-in.ejs")

//     // return res.status(401).json({ message: 'Unauthorized. Please log in.' });
//   }
//   res.render('postJob');
// });

// async function getMyJob(id){
//   const result = await db.query(`select * from jobs where id = ${id} ;`);
//   const jobs = [];
//   result.rows.forEach( element => {
//     jobs.push(element);
//   });
//   return jobs;
// }


app.get('/ne',(req,res)=>{
  res.render("sign-in.ejs");

})
app.get('/ap',(req,res)=>{
  res.render("adminProviders.ejs");

})

.get('/apply', async (req,res)=>{
  const categoriesResult = await db.query('SELECT * FROM job_categories');
  const subcategoriesResult = await db.query('SELECT * FROM job_subcategories');
  res.render("provRegistration.ejs", {
    categories: categoriesResult.rows,
    subcategories: subcategoriesResult.rows
  });

})

function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.redirect("/signin");
}

app.get("/adminDashboard.html", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/public/adminDashboard.html");
});

app.get("/providerDashboard.html", isAuthenticated, (req, res) => {
  res.sendFile(__dirname + "/public/providerDashboard.html");
});

app.get('/dashboard', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/ne');
  }

  const { role } = req.session.user;

  if (role === 'admin') {
    return res.redirect('/adminDashboard.html');
  } else if (role === 'serviceProvider') {
    return res.redirect('/providerDashboard.html');
  } else if (role === 'user') {
    return res.redirect('/bookings.html'); // Optional, if you have a user dashboard
  } else {
    return res.redirect('/ne');
  }
});




app.get('/view-provider/:id', async (req, res) => {
  const user = req.session.user;
  const providerId = req.params.id;

  if (!user) {
    // Save redirect after login
    req.session.redirectAfterLogin = `/view-provider/${providerId}`;
    return res.redirect('/ne');
  }
if (user.role != 'admin'){
  // Check if user has tokens
  const result = await db.query(
    'SELECT tokens FROM users WHERE id = $1',
    [user.id]
  );

  const tokens = result.rows[0]?.tokens || 0;

  if (tokens < 5) {
    return res.redirect('/pa'); // You can create a token purchase page
  }

  // Decrease token by 1
  await db.query(
    'UPDATE users SET tokens = tokens - 5 WHERE id = $1',
    [user.id]
  );
}
  // Redirect to actual profile page
  res.redirect(`/providerProfile.html?id=${providerId}`);
});


app.get('/myPosts', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/ne');


  // Pagination for jobs
  const limit = 5; // jobs per page
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

try {
  // Get total count for pagination
  const countResult = await db.query(
    `SELECT COUNT(*) FROM jobs WHERE user_id = $1;`,
    [user.id]
  );
  const totalJobs = parseInt(countResult.rows[0].count);
  const totalPages = Math.ceil(totalJobs / limit);

  // Get paginated jobs (use job_id instead of id)
  const jobResult = await db.query(
    `SELECT * FROM jobs WHERE user_id = $1 ORDER BY id DESC LIMIT $2 OFFSET $3;`,
    [user.id, limit, offset]
  );

  const jobs = jobResult.rows;

  // Get all proposals for these jobs
  const jobIds = jobs.map(j => j.id);
  let proposalsByJobId = {};

  if (jobIds.length > 0) {
    const proposalResult = await db.query(
      `SELECT * FROM proposals WHERE id = ANY($1::int[]) ORDER BY submitted_at;`,
      [jobIds]
    );

    proposalResult.rows.forEach(proposal => {
      if (!proposalsByJobId[proposal.job_id])
        proposalsByJobId[proposal.job_id] = [];
      proposalsByJobId[proposal.job_id].push(proposal);
    });
  }

  // Proposal pagination for each job
  const proposalPages = {};
  const proposalLimit = 3; // proposals per page
  jobs.forEach(job => {
    const param = req.query['proposalPage_' + job.id];
    const currentPage = param ? parseInt(param) : 1;
    proposalPages[job.id] = { currentPage, limit: proposalLimit };
  });

  // Attach proposals to each job
  const jobsWithProposals = jobs.map(job => ({
    ...job,
    proposals: proposalsByJobId[job.id] || []
  }));

  console.log(jobs);

  return res.render("myPosts.ejs", {
    jobs: jobsWithProposals,
    currentPage: page,
    totalPages,
    proposalPages // pass to EJS
  });
} catch (error) {
  console.error("Failed to make request:", error.message);
  return res.status(500).json({ message: 'Error fetching jobs and proposals' });
}

});


app.post('/delete-job/:id', async (req, res) => {
  const jobId = req.params.id;
  try {
    // First, delete all proposals related to the job
    await db.query('DELETE FROM proposals WHERE id = $1', [jobId]);

    // Then, delete the job
    await db.query('DELETE FROM jobs WHERE id = $1', [jobId]);

    res.redirect('/myPosts');
  } catch (err) {
    console.error("Error deleting job:", err.message);
    res.status(500).send('Server error');
  }
});


app.post('/update-proposal-status/:id', async (req, res) => {
  const proposalId = req.params.id;
  const { status } = req.body;
  const allowed = ['pending', 'accepted', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).send('Invalid status value');
  }
  try {
    await db.query('UPDATE proposals SET status = $1 WHERE id = $2', [status, proposalId]);
    res.redirect('/myPosts');
  } catch (err) {
    console.error("Error updating proposal:", err.message);
    res.status(500).send('Server error');
  }
});


app.get('/postJob', async (req, res) => {
  const user = req.session.user;
  if (!user) return res.redirect('/ne');

  try {
    const categoriesResult = await db.query('SELECT * FROM job_categories');
    const subcategoriesResult = await db.query('SELECT * FROM job_subcategories');
    console.log(
      "Categories:", categoriesResult.rows,
      "Subcategories:", subcategoriesResult.rows
    )
    res.render('postJob', {
      categories: categoriesResult.rows,
      subcategories: subcategoriesResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching categories');
  }
});

app.post("/post", async (req, res) => {   
  const user = req.session.user;
  if (!user) return res.redirect('/ne');

  try {
    // Get user's current token balance
    const result = await db.query('SELECT tokens FROM users WHERE id = $1', [user.id]);
    const userTokens = result.rows[0].tokens;

    // Extract estimated job price
    const { money, time, address, doc, desc } = req.body;

    // Calculate required tokens: 5% of money (in birr) / 10 birr per token
    const estimatedBirr = parseFloat(money);
    const costInBirr = estimatedBirr * 0.05;
    const requiredTokens = Math.floor(costInBirr / 10); // 1 token = 10 birr

    if (requiredTokens < 1) {
      return res.render("postJob.ejs", {
        message: "Estimated price too low. Please enter a higher price.",
        categories: (await db.query('SELECT * FROM job_categories')).rows,
        subcategories: (await db.query('SELECT * FROM job_subcategories')).rows
      });
    }

    if (userTokens < requiredTokens) {
      return res.redirect('/pa'); // Not enough tokens, go to payment
    }

    // Deduct tokens
    await db.query('UPDATE users SET tokens = tokens - $1 WHERE id = $2', [requiredTokens, user.id]);

    // Determine category and subcategory
    let category, subcategory;

    if (req.body.category === 'other') {
      category = req.body.otherCategory;
    } else {
      category = req.body.categoryName;
    }

    if (req.body.subcategory === 'other') {
      subcategory = req.body.otherSubcategory;
    } else {
      subcategory = req.body.subcategoryName || null;
    }

    console.log('req.body:', req.body); 

    // Insert job post
    await db.query(`
      INSERT INTO jobs (price, category, subcategory, duration, Address, Description, Doc, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [money, category, subcategory, time, address, desc, doc, user.id]);

    res.redirect("/myPosts");

  } catch (error) {
    console.error("Failed to make request:", error.message);

    const categoriesResult = await db.query('SELECT * FROM job_categories');
    const subcategoriesResult = await db.query('SELECT * FROM job_subcategories');

    res.render("postJob.ejs", {
      message: "Please check your inputs and try again.",
      categories: categoriesResult.rows,
      subcategories: subcategoriesResult.rows
    });
  }
});


async function getJobs(){
  const result = await db.query("select * from jobs order by id DESC ;");
  const jobs = [];
  result.rows.forEach( element => {
    jobs.push(element);
  });
  return jobs;
}
app.get('/allJobs',async (req, res) => {
  const jobs = await getJobs();
  res.render('allJobs', {
    jobs:jobs
  });
});



app.get('/jobs/:id', async (req, res) => {
  const  {id } = req.params;
  console.log(id)
  try {
    const result = await db.query(`SELECT * FROM jobs WHERE id = '${id}'`);
    if (result.rows.length === 0) {
      return res.status(404).send("Job not found");
    }

    const job = result.rows[0]; 
    // assuming you're fetching a single job

    res.render('jobDetails', { job });
  } catch (err) {
    res.status(500).send("Error fetching job");
  }
});


// ROUTE: Proposal Form
app.get('/jobs/:id/proposal', async (req, res) => {
    const user = req.session.user;

   if (!user) return res.redirect('/ne');
   if (user.role == 'admin' || user.role == 'user') return res.redirect('/ne');
  const { id } = req.params;
  try {
  const result = await db.query(`SELECT * FROM jobs WHERE id = '${id}'`);
    if (result.rows.length === 0) {
      return res.status(404).send("Job not found");
    }

    const job = result.rows[0]; 
  res.render('submitProposal', { job: job });
} catch (err) {
  res.status(500).send("Error fetching job");
}
});




app.post('/jobs/:id/proposal', async (req, res) => {
  const { id } = req.params;
  const { coverLetter, expectedPay, availability , timeline, additionalNotes} = req.body;
  const user = req.session.user;
  
  if (!user) return res.redirect('/ne');
  
  try {
  // Check token balance
  const result = await db.query('SELECT tokens FROM providers WHERE id = $1', [user.id]);
  const userTokens = result.rows[0].tokens;

  if (userTokens <= 0) {
    return res.redirect('/pa'); // Redirect to token purchase page
    // return res.send('Not enough tokens. Please purchase more.');
  }

  // Deduct one token and insert proposal
  await db.query('UPDATE providers SET tokens = tokens - 1 WHERE id = $1', [user.id]);


    //getting job titles
    const resul = await db.query('SELECT * FROM jobs WHERE id = $1', [id]);
    
    if (resul.rows.length === 0) {
      return res.status(404).send("Job not found");
    }
    
    const user_id = resul.rows[0].id;
    const jobTitle = resul.rows[0].title;
    console.log("Job Title:", jobTitle);
    
    await db.query(
      `INSERT INTO proposals (id, job_title, user_id, message, price, availability, timeline, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, jobTitle, user_id, coverLetter, expectedPay, availability, timeline, additionalNotes]
    );
    
    res.redirect('/myProposals');
  } catch (err) {
    console.error("Proposal insertion error:", err);
    res.status(500).send("Error inserting proposal");
  }
});











// ROUTE: View Proposals
app.get('/jobs/:id/proposals', async (req, res) => {
  const { id } = req.params;
  const proposals = await db.query(
    `SELECT proposals.*, users.name as user_name
     FROM proposals JOIN users ON proposals.user_id = users.id
     WHERE id = $1`,
    [id]
  );
  res.render('reviewProposals', { jobId: id, proposals: proposals.rows });
});




import adminRoutes from './routes/admin.js';
// Use admin routes
app.use('/api/admin', adminRoutes);

app.get('/pa', (req, res) => {
  res.render('index.ejs');  // Renders views/index.ejs
});

// Route: Handle form submission to initiate payment
app.post('/api/initiate-payment', async (req, res) => {
  // Step 1: Get payment details from request body
  const { name, email, amount } = req.body;
  const currency = 'ETB';  // or 'USD'
  // const tx_ref = `demo-${Date.now()}`;  // Unique transaction reference
const tx_ref = `token-18-${Date.now()}`;
// const return_url = `${process.env.SERVER_URL}/chapa/return`;

const return_url = `${process.env.SERVER_URL}/chapa/return?tx_ref=${tx_ref}`;
const callback_url = `${process.env.SERVER_URL}/chapa/callback?tx_ref=${tx_ref}`;
console.log('Generated tx_ref:', tx_ref);
console.log('Return URL:', return_url);
// In your payment initiation endpoint

const payload = {
  amount,
  currency,
  email,
  first_name: name,
  last_name: name,
  tx_ref,
  return_url,
  callback_url,
  meta: { tx_ref }
};
console.log('Payload being sent to Chapa:', payload);

console.log('Return URL:', payload.return_url);

  console.log('Sending to Chapa:', payload);
  try {
    // Step 3: Call Chapa initialize transaction API

    const response = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`,  // Bearer auth with secret key
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (data && data.data && data.data.checkout_url) {
      // Step 4: Store initial payment record in DB (status = pending)
      await db.query(
        `INSERT INTO payments(name, email, amount, currency, tx_ref, status)
         VALUES($1, $2, $3, $4, $5, $6)`,
        [name, email, amount, currency, tx_ref, 'pending']
      );

      // Step 5: Send checkout URL to front end to redirect user
      res.json({ checkout_url: data.data.checkout_url });
    } else {
      console.error('Error initializing Chapa payment:', data);
      res.status(500).json({ error: 'Failed to initialize payment' });
    }
  } catch (err) {
    console.error('Request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/chapa/callback', async (req, res) => {

  const { tx_ref } = req.body; // Chapa sends POST with JSON body
  
  try {
    // 1. Verify with Chapa API firsts
    const result = await verifyPayment(tx_ref);
    
    // 2. Only update if verification succeeds
    if (result.status === 'success') {
      await db.query(
        `UPDATE payments 
         SET status='success', ref_id=$1 
         WHERE tx_ref=$2`,
        [result.data.id, tx_ref]
      );
      
      // 3. Add your token logic here
      const payment = await db.query(
        `SELECT * FROM payments WHERE tx_ref=$1`, 
        [tx_ref]
      );
      
      if (payment.rows[0].type === 'token') {
        await db.query(
          `UPDATE users SET tokens = tokens + $1 
           WHERE id = $2`,
          [payment.rows[0].tokens, payment.rows[0].user_id]
        );
      }
    }
    
    res.status(200).send('OK'); // Required for Chapa
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).send('Error');
  }
});


app.get('/chapa/return', async (req, res) => {
  const { tx_ref } = req.query;

  // 1. Get current payment state
  const payment = await db.query(
    `SELECT * FROM payments WHERE tx_ref=$1`,
    [tx_ref]
  );

  // 2. If still pending, force verification
  if (payment.rows[0].status === 'pending') {
    const result = await verifyPayment(tx_ref);
    
    if (result.status === 'success') {
      await db.query(
        `UPDATE payments 
         SET status='success', ref_id=$1 
         WHERE tx_ref=$2`,
        [result.data.id, tx_ref]
      );
    }
  }

  // 3. Get fresh data
  const updatedPayment = await db.query(
    `SELECT * FROM payments WHERE tx_ref=$1`,
    [tx_ref]
  );

  res.render('success', { payment: updatedPayment.rows[0] });
});








app.post('/buy-tokens', async (req, res) => {
  const user = req.session.user;
  const { packag } = req.body;
  const priceMap = { '10': 50, '25': 120, '50': 200 };
  if (!user) {
    return res.redirect('/ne');
  } 
  const amount = priceMap[packag];
  const tx_ref = `token-${user.id}-${Date.now()}`;

  // Save pending transaction
  await db.query(
    `INSERT INTO payments (user_id, tx_ref, amount, status, type, tokens) 
     VALUES ($1, $2, $3, 'pending', 'token', $4)`,
    [user.id, tx_ref, amount, packag]
  );

  // Redirect to Chapa checkout
  const payload = {
    amount: amount,
    currency: 'ETB',
    email: user.email,
    tx_ref,
    callback_url: `${process.env.SERVER_URL}/chapa/callback?tx_ref=${tx_ref}`,
    // const return_url = `${BASE_URL}/chapa/return?tx_ref=${tx_ref}`;
// const callback_url = `${BASE_URL}/chapa/callback?tx_ref=${tx_ref}`;
    return_url: `${process.env.SERVER_URL}/chapa/return?tx_ref=${tx_ref}`,
    customization: {
      title: 'Token Purchase',
      description: `${packag} token package`,
    },
  };

  try {
    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      payload,
      {
        headers: {
          // Authorization: `Bearer ${CHAPA_SECRET}`,
          Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
        },
      }
    );

    res.redirect(response.data.data.checkout_url);
  } catch (error) {
    console.error(error.message);
    res.send('Payment initialization failed.');
  }
});



async function verifyPayment(tx_ref) {
  try {
    const response = await fetch(
      `https://api.chapa.co/v1/transaction/verify/${tx_ref}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.CHAPA_SECRET_KEY}`
        }
      }
    );
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    return await response.json();
  } catch (err) {
    console.error('Verification failed:', err);
    throw err;
  }
}

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

export { db };
