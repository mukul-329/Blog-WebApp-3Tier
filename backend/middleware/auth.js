import jwt from 'jsonwebtoken'

const auth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization
    if (!authorization?.startsWith('Bearer '))
      return res.status(401).json({ message: 'Authentication is required.' })

    const token = authorization.split(' ')[1]

    // check if custom token or socialAuth token
    const isCustomAuth = token.length < 500

    let decodedData

    if (token && isCustomAuth) {
      decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY)
      req.userId = decodedData?.id
    } else {
      decodedData = jwt.decode(token)

      req.userId = decodedData?.sub
    }

    next()
  } catch (error) {
    console.log('Auth Middleware Error...............', error)
    return res.status(401).json({ message: 'Your session is invalid or has expired.' })
  }
}

export default auth
