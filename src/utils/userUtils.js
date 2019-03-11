const users = []

const addUser = ({id, username, room}) => {

  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();

  if( !username || !room ){
    return { error : 'You missed something. Congrats, you have to be really dumb to try this kind of shit'}
  }

  const existingUser = users.find((user) => {
    return user.username === username && user.room === room
  })

  if(existingUser) {
    return { error : "No wonder such a primitive species has no unique identifier. Now go try another name, this one is taken up" }
  }

  const user = {id, username, room}
  users.push(user)
  return {user}
};

const removeUser = (id) => {

  var index = users.findIndex((user) => user.id === id);
  if(index !== -1){
    //splice returns the removed items in the form of an array.
    return users.splice(index, 1)[0]
  }
}

const getUser = (id) => {
  return users.find((user) => user.id === id );
}


const getUsersInRoom = (room) => {
  room = room.trim().toLowerCase()
  return users.filter((user) => user.room === room );
}

module.exports = { addUser, removeUser, getUser, getUsersInRoom }
