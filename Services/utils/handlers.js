const formatDataFromMessage = (message) => {
  let parsedMessage = message

  const urlRegex = /(https?:\/\/[^\s]+)/g
  const match = message.match(urlRegex)

  let data = match ? match[0] : ''
  return { message: parsedMessage, data }
}

module.exports = {
  formatDataFromMessage
}
