const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { createTokens, validateToken } = require('./JWT');
const mysql = require('mysql2/promise');

const app = express();

app.use(express.json());

app.use(cors({
  origin: 'http://192.168.1.133:3000',
  credentials: true,
}));

app.use(cookieParser());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'razvaN', 
  password: '021202', 
  database: 'rxl', 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.options('/login', cors({
  origin: 'http://192.168.1.133:3000',
  credentials: true,
  methods: 'POST',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.execute('SELECT * FROM user_info WHERE email = ?', [email]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    const user = rows[0];

    console.log('User retrieved from the database:', user);

    // Adaugă verificarea pentru a te asigura că user.password este o valoare validă
    if (!user.parola) {
      console.error('Invalid user data: password is missing');
      return res.status(500).json({ error: 'Invalid user data' });
    }

    const match = await bcrypt.compare(password, user.parola);
    console.log('Match:', match);

    if (match) {
      const accessToken = createTokens(user);
    
      res.cookie('access-token', accessToken, {
        maxAge: 3600000,
        httpOnly: true,
        secure: true,
        // sameSite: 'none'
      });      
    
      const isAdmin = user.isAdmin === 1;
      const userID = user.userID
      res.header('Access-Control-Allow-Credentials', true);
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');

      res.json({ message: "Logged in", isAdmin, userID, accessToken });
    } else {
      console.error('Wrong username and password');
      res.status(400).json({ error: "Wrong username and password" });
    }
    
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    // Verifică dacă există deja un utilizator cu același email
    const [existingUsers] = await pool.execute('SELECT * FROM user_info WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Dacă nu există un utilizator cu același email, creează unul nou
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO user_info (nume, email, parola, isAdmin) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 0]
    );

    const userId = result.insertId; // Mută această linie aici

    // Inserează datele în tabela user_address, asigurându-te că sunt specificate toate coloanele necesare
    await pool.execute(
      'INSERT INTO user_address (userID, address, phone, city, state, postalcode) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, null, null, null, null, null]
    );

    // Trimite un răspuns de succes și include detalii despre utilizatorul creat și coșul de cumpărături
    res.json({ message: 'User registered successfully', userId });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/profile/:userID', validateToken, async (req, res) => {
  const { userID } = req.params;

  try {
    const [userProfile] = await pool.execute('SELECT nume, email FROM user_info WHERE userID = ?', [userID]);
    const [userInfo] = await pool.execute('SELECT address, phone, city, state, postalcode FROM user_address WHERE userID= ?', [userID])

    if (userProfile.length > 0) {
      const { nume, email } = userProfile[0];
      const {address, phone, city, state, postalcode} = userInfo[0]
      res.json({ nume, email, address, phone, city, state, postalcode });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/userAddress/:userID', validateToken, async (req, res) => {
  try {
    const userID = req.params.userID; // Extract userID from params
    const {email, address, phone, city, state, postalcode } = req.body;

    console.log('Received data:', req.body);

    // Verificăm dacă există deja o înregistrare cu acel userID în user_address
    const existingData = await pool.execute('SELECT * FROM user_address WHERE userID = ?', [userID]);
    console.log('Existing data:', existingData);

    if (existingData.length > 0) {
      await pool.execute(
        'UPDATE user_address SET address=?, phone=?, city=?, state=?, postalcode=? WHERE userID=?',
        [address, phone, city, state, postalcode, userID],
      await pool.execute(
        'UPDATE user_info SET email=? WHERE userID=?',
        [email, userID]
      )
      );
    } else {
      // INSERT
      await pool.execute(
        'INSERT INTO user_address (userID, address, phone, city, state, postalcode) VALUES (?, ?, ?, ?, ?, ?)',
        [userID, address, phone, city, state, postalcode]
      );
    }

    console.log('Data successfully updated/inserted');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating user address:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/addToCart', validateToken, async (req, res) => {
  const { productID, item_name, price, userID, discount } = req.body;

  try {
    const [existingCart] = await pool.execute('SELECT * FROM cart WHERE userID = ?', [userID]);

    if (existingCart.length === 0) {
      await pool.execute(
        'INSERT INTO cart (userID, productID, item_name, price, amount, total, discount) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userID, productID, item_name, price, 1, discount === 0 ? price : price - (discount/100) * price, discount || null]
      );
    } else {
      const [existingCartItem] = await pool.execute(
        'SELECT * FROM cart WHERE userID = ? AND productID = ?',
        [userID, productID]
      );
    
      if (existingCartItem.length === 0) {
        await pool.execute(
          'INSERT INTO cart (userID, productID, item_name, price, amount, total, discount) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userID, productID, item_name, price, 1, discount === null ? 0 : price - (discount/100) * price, discount || null]
        );
      } else {
      await pool.execute('UPDATE cart SET amount = amount + 1 WHERE userID = ? AND productID = ?', [userID, productID]);
      await pool.execute('UPDATE cart SET total = (price - (COALESCE(discount, 0)/100) * price) * amount WHERE userID = ? AND productID = ?', 
        [userID, productID]
      );
      }
    }
    res.status(200).json({ message: 'Item added to cart successfully' });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/removeFromCart', validateToken, async (req, res) => {
  const { productID, userID } = req.body;

  try {
    // Verifică dacă produsul există în coșul utilizatorului
    const [existingCartItem] = await pool.execute('SELECT * FROM cart WHERE userID = ? AND productID = ?', 
    [userID, productID]);

    if (existingCartItem.length === 0) {
      // Dacă produsul nu există în coș, returnează o eroare
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    const currentAmount = existingCartItem[0].amount;

    if (currentAmount > 1) {
      // Dacă cantitatea este mai mare decât 1, decrementează cantitatea
      await pool.execute('UPDATE cart SET amount = amount - 1 WHERE userID = ? AND productID = ?', 
        [userID, productID]);
      await pool.execute('UPDATE cart SET total = (price - (COALESCE(discount, 0)/100) * price) * amount WHERE userID = ? AND productID = ?', 
        [userID, productID]);
    } else {
      // Dacă cantitatea este 1, șterge complet produsul din coș
      await pool.execute('DELETE FROM cart WHERE userID = ? AND productID = ?', 
        [userID, productID]);
    }

    res.status(200).json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/getProducts', async (req, res) => {
  try {
    // Face o interogare către baza de date pentru a obține produsele
    const [products] = await pool.execute('SELECT * FROM products');

    res.json({ products });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/getProduct/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const [product] = await pool.execute('SELECT * FROM products WHERE id = ?', [productId]);

    if (product.length > 0) {
      res.status(200).json({ product: product[0] });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/getUserProducts', async (req, res) => {
  try {
    const { userID } = req.body;

    if (!userID) {
      return res.status(400).json({ error: 'UserID is required' });
    }

    const [userProducts] = await pool.execute('SELECT * FROM cart WHERE userID = ?', [userID]);
    res.json({ userProducts });
  } catch (error) {
    console.error('Error getting user cart products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const host = process.env.HOST || '192.168.1.133';
const port = process.env.PORT || 3001;

app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});

