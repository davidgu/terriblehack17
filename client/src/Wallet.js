import { randomBytes } from 'crypto'
import cryptoHash from 'crypto-hashing'
import bs58check from 'bs58check'
import secp256k1 from 'secp256k1'
import 'whatwg-fetch'

class Wallet {
  constructor (privKey = null) {
    if (!privKey) {
      do {
        privKey = randomBytes(32)
      } while (!secp256k1.privateKeyVerify(privKey))
    }
    this.privKey = privKey
    this.pubKey = secp256k1.publicKeyCreate(privKey, false)
    window.localStorage.setItem('privKey', this.privKey.toString('hex'))
    window.localStorage.setItem('address', this.address)
  }

  static inStorage () {
    return !!window.localStorage.getItem('privKey')
  }

  static loadFromStorage (password = null) {
    let privKey = Buffer.from(window.localStorage.getItem('privKey'), 'hex')
    return new Wallet(privKey)
  }

  get address () {
    let hash = cryptoHash('hash160', this.pubKey)
    return 'dab' + bs58check.encode(hash)
  }

  getBalance () {
    return fetch(`http://one.dabcoin.1lab.me:5000/balance/${this.address}`, {
      method: 'GET'
    }).then(response => response.text())
  }

  sign (data) {
    if (data.length > 32) throw new Error('data must be less than or equal to 32 bytes')
    let paddedData = Buffer.concat([
      Buffer.alloc(32 - data.length, 0),
      data
    ])
    console.log('padded: ' + paddedData.toString('hex'))
    return secp256k1.sign(paddedData, this.privKey)
  }

  send (recipient, amount) {
    fetch('http://one.dabcoin.1lab.me:5000/transactions/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'sender': this.address,
        'recipient': recipient,
        'amount': amount
      })
    })
  }

  startMining () {
    fetch('http://one.dabcoin.1lab.me:5000/mine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'address': this.address
      })
    })
  }
}

export default Wallet
