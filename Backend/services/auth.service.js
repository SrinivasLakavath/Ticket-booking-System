const crypto = require('crypto')
const axios = require('axios')
const JWT = require('jsonwebtoken')
const User = require('../models/user.model')
const { hashPassword, comparePassword } = require('../utils/hash')
const AppError = require('../errors/app.error')

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '7d'
const FIREBASE_WEB_API_KEY =
  process.env.FIREBASE_WEB_API_KEY || process.env.VITE_REACT_APP_FIREBASE_API_KEY

if (!JWT_SECRET || JWT_SECRET === '')
  throw new Error(`JWT_SECRET env is required`)

class AuthService {
  /**
   * @function generateUserToken
   * @param {{ _id: string; role: 'admin' | 'user' }} payload
   * @returns { string } JWT signed token
   */
  static generateUserToken(payload) {
    const token = JWT.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION })
    return token
  }

  /**
   * @function signupWithEmailAndPassword
   * @param {{ firstname: string, lastname?: string, email: string, password: string }} data
   * @returns { Promise<string> } JWT signed token
   */
  static async signupWithEmailAndPassword(data) {
    const { firstname, lastname, email, password } = data

    try {
      const hashedPassword = await hashPassword(password)
      
      const user = await User.create({
        firstname,
        lastname,
        email,
        password: hashedPassword,
      })

      const token = AuthService.generateUserToken({
        _id: user._id,
        role: user.role,
      })

      return token
    } catch (err) {
      console.log(`Error creating user`, err)
      throw err
    }
  }

  /**
   * @function signinWithEmailAndPassword
   * @param {{ email: string, password: string }} data
   * @returns { Promise<string> } JWT signed token
   */
  static async signinWithEmailAndPassword(data) {
    const { email, password } = data
    const user = await User.findOne({ email })

    if (!user) throw new AppError(`User with email ${email} does not exists!`)

    const isPasswordValid = await comparePassword(password, user.password)
    
    if (!isPasswordValid)
      throw new AppError(`Invalid email id or password`)

    const token = AuthService.generateUserToken({
      _id: user._id,
      role: user.role,
    })

    return token
  }

  /**
   *
   * @param {string} token
   * @returns {{ _id: string; role: 'admin' | 'user' }} payload
   */
  static decodeUserToken(token) {
    try {
      const payload = JWT.verify(token, JWT_SECRET)
      return payload
    } catch (err) {
      return false
    }
  }

  /**
   * Verify a Firebase ID token via Identity Toolkit (Spark/free — no Admin SDK needed)
   * and sync the user into MongoDB, then issue our app JWT.
   */
  static async signInWithFirebaseIdToken({
    idToken,
    firstname,
    lastname,
  } = {}) {
    if (!FIREBASE_WEB_API_KEY) {
      throw new AppError(
        'FIREBASE_WEB_API_KEY is not configured on the server',
        500
      )
    }
    if (!idToken) throw new AppError('Firebase idToken is required', 400)

    let firebaseUser
    try {
      const { data } = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_WEB_API_KEY}`,
        { idToken },
        { timeout: 10000 }
      )
      firebaseUser = data?.users?.[0]
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        'Invalid or expired Firebase token'
      throw new AppError(message, 401)
    }

    if (!firebaseUser?.localId || !firebaseUser?.email) {
      throw new AppError('Unable to resolve Firebase user from token', 401)
    }

    const email = String(firebaseUser.email).toLowerCase()
    const firebaseUid = firebaseUser.localId
    const provider =
      Array.isArray(firebaseUser.providerUserInfo) &&
      firebaseUser.providerUserInfo.some((p) => p.providerId === 'google.com')
        ? 'google'
        : 'firebase'

    const displayName = firebaseUser.displayName || ''
    const nameParts = displayName.trim().split(/\s+/).filter(Boolean)
    const resolvedFirst =
      firstname || nameParts[0] || email.split('@')[0] || 'User'
    const resolvedLast =
      lastname || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : '')

    let user = await User.findOne({
      $or: [{ firebaseUid }, { email }],
    })

    if (!user) {
      user = await User.create({
        firstname: resolvedFirst,
        lastname: resolvedLast,
        email,
        firebaseUid,
        authProvider: provider,
        password: await hashPassword(crypto.randomBytes(24).toString('hex')),
      })
    } else {
      const updates = {}
      if (!user.firebaseUid) updates.firebaseUid = firebaseUid
      if (!user.authProvider || user.authProvider === 'local') {
        updates.authProvider = provider
      }
      if ((!user.firstname || user.firstname === 'User') && resolvedFirst) {
        updates.firstname = resolvedFirst
      }
      if (!user.lastname && resolvedLast) updates.lastname = resolvedLast
      if (Object.keys(updates).length > 0) {
        Object.assign(user, updates)
        await user.save()
      }
    }

    return AuthService.generateUserToken({
      _id: user._id,
      role: user.role,
    })
  }
}

module.exports = AuthService
