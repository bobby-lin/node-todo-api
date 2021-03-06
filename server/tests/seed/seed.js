const {ObjectID} = require('mongodb');
const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');
const jwt = require('jsonwebtoken');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const users = [{
  _id: userOneId,
  email: "socrates@abc.com",
  password: "123456",
  tokens: [{
    access: "auth",
    token: jwt.sign({_id: userOneId, access: "auth"}, process.env.JWT_SECRET).toString()
  }]
}, {
  _id: userTwoId,
  email: "plato@gmail.com",
  password: "platonicworld",
  tokens: [{
    access: "auth",
    token: jwt.sign({_id: userTwoId, access: "auth"}, process.env.JWT_SECRET).toString()
  }]
}];

const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo]);
  }).then(() => done());
};

const todos = [{
  _id: new ObjectID(),
  text: "First text",
  _creator: userOneId
},
  {
    _id: new ObjectID(), //For testing PATCH
    text: "Second text",
    completed: true,
    completedAt: 18888,
    _creator: userTwoId
  }
  ]; // dummy values

  const populateTodos = (done) => {
    Todo.remove({}).then(() => {
      return Todo.insertMany(todos);
    }).then(() => done()); // empty db
  };

module.exports = {todos, populateTodos, users, populateUsers};
