var generateMsg = (username, text) => {
  return { username, text : text, createdAt : new Date().getTime() }
};

var generateLocationMsg = (username, url) => {
  return { username, locationURL : url, createdAt : new Date().getTime() }
}

module.exports = {generateMsg, generateLocationMsg}
