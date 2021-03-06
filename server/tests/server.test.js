const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

// https://www.npmjs.com/package/supertest
//https://github.com/mjackson/expect

const {app} = require('../server');
const {Todo} = require('../models/todo');
const {User} = require('../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST/todos', () => {
  it('should create a new todo', (done) => {
    var text = 'Test todo text';

    request(app)
    .post('/todos')
    .set('x-auth', users[0].tokens[0].token)
    .send({text})
    .expect(200)
    .expect((res) => {
      expect(res.body.text).toBe(text);
    })
    .end((err, res) => {
      if (err) {
        return done(err);
      }

      Todo.find({text}).then((todos) => {
        expect(todos.length).toBe(1);
        expect(todos[0].text).toBe(text);
        done();
      }).catch((e) => done(e));
    });
  });

  it('should not create a new todo with invalid data', (done) => {
    var text = "";
    request(app)
    .post('/todos')
    .set('x-auth', users[0].tokens[0].token)
    .send({text})
    .expect(400)
    .end((err, res) => {
      if (err) {
        return done(err);
      }

      Todo.find().then((todos) => {
        expect(todos.length).toBe(2); // expect db to be only two docs (added)
        done();
      }).catch((e) => done(e));
    });
  });

});

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
    .get('/todos')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.todos.length).toBe(1); // custom expect only one item for user
    })
    .end(done);
  })
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
    .get(`/todos/${todos[0]._id.toHexString()}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe(todos[0].text);
    })
    .end(done);
  });

  it('should not return todo doc by other user', (done) => {
    request(app)
    .get(`/todos/${todos[1]._id.toHexString()}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);
  });

  it('should return 404 if todo not found in db', (done) => {
    var id = new ObjectID();
    request(app)
    .get(`/todos/${id.toHexString()}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);
  });

  it('should return 404 if id is invalid', (done) => {
    var invalid_id = "12345";
    request(app)
    .get(`/todos/${invalid_id}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);
  })
});

describe('DELETE /todos/:id', () => {

  it('should delete todo doc and return doc', (done) => {
    var hexId = todos[1]._id.toHexString();
    request(app)
    .delete(`/todos/${hexId}`)
    .set('x-auth', users[1].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe(todos[1].text);
    })
    .end((err, res) => {
      if (err) {
        return done(err);
      }

      // Query database to find the document using id
      Todo.findById(hexId).then((todo) => {
        expect(todo).toNotExist('Document cannot be found');
        done();
      }).catch((e) => done(e));
    });
  });

  it('should not delete todo doc by other user', (done) => {
    var hexId = todos[1]._id.toHexString();
    request(app)
    .delete(`/todos/${hexId}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end((err, res) => {
      if (err) {
        return done(err);
      }

      // Query database to find the document using id
      Todo.findById(hexId).then((todo) => {
        expect(todo).toExist();
        done();
      }).catch((e) => done(e));
    });
  });

  it('should return 404 as doc does not exist', (done)=> {
    var hexId = new ObjectID().toHexString();
    request(app)
    .delete(`/todos/${hexId}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);
  });

  it('should return 404 for invalid id', (done) => {
    request(app)
    .delete('/todos/abcde')
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);
  })
});

describe('PATCH /todos/:id', ()=> {
  it('should update the todo by user 1', (done) => {
    // Obtain id of first dummy document
    var hexId = todos[0]._id.toHexString();
    var text = "This is the updated text";

    // text is changed, completed is true, completedAt is a number
    request(app)
    .patch(`/todos/${hexId}`)
    .set('x-auth', users[0].tokens[0].token)
    .send({
      text,
      completed: true,
    })
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.completed).toBe(true);
      expect(res.body.todo.text).toBe(text);
      expect(res.body.todo.completedAt).toBeA('number');
    })
    .end(done);
  });

  it('should update the todo (from user 1) by user 2', (done) => {
    // Obtain id of first dummy document
    var hexId = todos[0]._id.toHexString();
    var text = "This is the updated text";

    // text is changed, completed is true, completedAt is a number
    request(app)
    .patch(`/todos/${hexId}`)
    .set('x-auth', users[1].tokens[0].token)
    .send({
      text,
      completed: true,
    })
    .expect(404)
    .end(done);
  });

  it('should clear completedAt when todo is not completed by user 2', (done) => {
    var hexId = todos[1]._id.toHexString();
    var text = "This is the updated text";

    request(app)
    .patch(`/todos/${hexId}`)
    .set('x-auth', users[1].tokens[0].token)
    .send({
      text,
      completed: false
    })
    .expect(200)
    .expect((res) => {
      expect(res.body.todo.text).toBe(text);
      expect(res.body.todo.completed).toBe(false);
      expect(res.body.todo.completedAt).toNotExist();
    })
    .end(done);
  });
});

describe('GET /users/me', ()=> {
  it('should return user if authenticated', (done) => {
    request(app)
    .get('/users/me')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body._id).toBe(users[0]._id.toHexString());
      expect(res.body.email).toBe(users[0].email);
    })
    .end(done);
  });

  it('should return 401 if not authenticated', (done) => {
    request(app)
    .get('/users/me')
    .set('x-auth', 'abcdefg')
    .expect(401)
    .expect((res) => {
      expect(res.body).toEqual({});
    })
    .end(done);
  });

});

describe('POST /users', () => {
  it('should create a user', (done)=> {
    var email = "example@gmail.com";
    var password ="123456abc";

    request(app)
    .post('/users')
    .send({email, password})
    .expect(200)
    .expect((res) => {
      expect(res.headers['x-auth']).toExist();
      expect(res.body._id).toExist();
      expect(res.body.email).toBe(email);
    })
    .end((err) => {
      if (err) {
        done(err);
      }

      User.findOne({email}).then((user) => {
        expect(user).toExist();
        expect(user.password).toNotBe(password); // expected to be hashed
        done();
      }).catch((e) => done(e));;

    });

  });

  it('should return validation error if request is invalid', (done) => {
    var email = "adadlajd";
    var password = "12";

    request(app)
    .post('/users')
    .send({email, password})
    .expect(400)
    .end(done);
  });

  it('should not create user if email is in use', (done) => {
    var email = users[0].email;
    var password = "123456abc";

    request(app)
    .post('/users')
    .send({email, password})
    .expect(400)
    .end(done);

  });

});

describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
    .post('/users/login')
    .send({
      email: users[1].email,
      password: users[1].password
    })
    .expect(200)
    .expect((res) => {
      expect(res.headers['x-auth']).toExist();
    })
    .end((err, res) => {
      if (err) {
        return done(err);
      }

      User.findById(users[1]._id).then((user) => {
        expect(user.tokens[1]).toInclude({
          access: 'auth',
          token: res.headers['x-auth']
        });
        done();
      }).catch((e) => done(e));
    })
  });

  it('should reject invalid login', (done) => {
    request(app)
    .post('/users/login')
    .send({
      email: users[1].email,
      password: users[1].password + '1'
    })
    .expect(400)
    .expect((res) => {
      expect(res.headers['x-auth']).toNotExist();
    })
    .end((err, res) => {
      if (err) {
        return done(err);
      }

      User.findById(users[1]._id).then((user) => {
        expect(user.tokens.length).toBe(1);
        done();
      }).catch((e) => done(e));
    })
  });

});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
    .delete('/users/me/token')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .end((err, res) => {
      if (err) {
        return done(err);
      }

      User.findById(users[0]._id).then((user) => {
        expect(user.tokens.length).toBe(0);
        done();
      }).catch((e) => done(e));
    })
  });

})
