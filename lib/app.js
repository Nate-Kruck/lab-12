const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/api/todos', async(req, res) => {

  try {
    const userId = req.userId;

    const data = await client.query(`
  SELECT *
  FROM todos
  WHERE todos.user_id = ${userId}`);

    res.json(data.rows);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/todos/:id', async(req, res) => {
  try {
    const toDoId = req.params.id;
    const userId = req.userId;

    const data = await client.query(`
  SELECT id, todo, completed, user_id
    FROM todos
    WHERE todos.user_id =$1
    AND todos.id = $2
    `, [userId, toDoId]);
    
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/todos/:id', async(req, res) => {
  const toDoId = req.params.id;
  const data = await client.query('DELETE FROM todos WHERE id=$1 AND user_id=$2;' [toDoId, req.userId]);

  res.json(data.rows[0]);
});

app.post('/api/todos', async(req, res) => {
  
  const new_todo = {
    completed: req.body.completed,
    todo: req.body.todo,
    user_id: req.body.user_id
  };

  const data = await client.query(`
    INSERT INTO todos(completed, todo, user_id)
    VALUES($1, $2, $3)
    RETURNING *
    `, [new_todo.completed, new_todo.todo, new_todo.user_id]);

  res.json(data.rows[0]);
});

app.put('/api/todos/:id', async(req, res) => {
  const todo_id = req.params.id;

  try {
    const updated_todo_list = {
      completed: req.body.completed,
      todo: req.body.todo,
      user_id: req.body.user_id
    };

    const data = await client.query(`
    UPDATE todos
      SET completed=$1, todo=$2, user_id=$3
      WHERE todos.id = $4
      RETURNING *
      `, [updated_todo_list.completed, updated_todo_list.todo, updated_todo_list.user_id, todo_id]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;
