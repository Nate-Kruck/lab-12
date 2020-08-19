require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('routes', () => {
  let token;

  const new_todo = {
    id: 5,
    completed: true,
    todo: 'wash clothes',
    user_id: 1
  };

  beforeAll(async done => {
    execSync('npm run setup-db');

    client.connect();

    const signInData = await fakeRequest(app)
      .post('/auth/signup')
      .send({
        email: 'john@doofy.com',
        password: '1234'
      });

    token = signInData.body.token;
    return done();
      
  });

  afterAll(done => {
    return client.end(done);
  });

  test('returns new_todo', async(done) => {

    const data = await fakeRequest(app)
      .post('/api/todos')
      .send(new_todo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(new_todo);

    done();

  });

  test('returns all items in todo list for the user when hitting GET /todos', async(done) => {
    const expected = [{
      id: 1,
      todo: 'clean room',
      completed: true,
      user_id: 1
    },
    {
      id: 2,
      todo: 'clean car',
      completed: false,
      user_id: 1
    }, 
    {
      id: 3,
      todo: 'pick fruit',
      completed: true,
      user_id: 1
    },
    {
      id: 4,
      todo: 'powerwash house',
      completed: false,
      user_id: 1
    },
    {
      id: 5,
      todo: 'wash clothes',
      completed: true,
      user_id: 1
    }
    ];

    const data = await fakeRequest(app)
      .get('/api/todos')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expected);

    done();
  });

  test('updates an item on the todo list when hitting PUT /todos/:id', async(done) => {

    
    const new_todo = {
      id: 6,
      todo: 'clean car',
      completed: false,
      user_id: 1
    };
    
    const data = await fakeRequest(app)
      .put('/api/todos/6')
      .send(new_todo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(new_todo);

    done();
  });

});

