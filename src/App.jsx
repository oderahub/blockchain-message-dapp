// import { useState } from 'react'
// import abi from './abi.json'
// import { ethers } from 'ethers'

// // const contractAddress = '0x9D1eb059977D71E1A21BdebD1F700d4A39744A70'

// const contractAddress = '0xce5eb186e2e838c177335200222d7ea762feaafe'

// function App() {
//   const [text, setText] = useState('')

//   async function requestAccount() {
//     await window.ethereum.request({ method: 'eth_requestAccounts' })
//   }

//   const handleSet = async () => {
//     try {
//       if (!text) {
//         alert('Please enter a message before setting.')
//         return
//       }

//       if (window.ethereum) {
//         await requestAccount()
//         const provider = new ethers.BrowserProvider(window.ethereum)
//         const signer = await provider.getSigner()
//         const contract = new ethers.Contract(contractAddress, abi, signer)

//         const tx = await contract.setMessage(text)
//         const txReceipt = await tx.wait()
//         console.log('Transaction successful:', txReceipt)
//       } else {
//         console.error('MetaMask not found. Please install MetaMask to use this application.')
//       }
//     } catch (error) {
//       console.error('Error setting message:', error)
//       alert(error.message || error)
//     }
//   }

//   return (
//     <div style={{ padding: '2rem' }}>
//       <h1>Set Message on Smart Contract</h1>
//       <input
//         type="text"
//         placeholder="Set message"
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//       />
//       <button onClick={handleSet}>Set Message</button>
//     </div>
//   )
// }

// export default App

import { useState, useEffect } from 'react'
import abi from './abi.json'
import { ethers } from 'ethers'
import './App.css'

const contractAddress = '0xce5eb186e2e838c177335200222d7ea762feaafe'

function App() {
  const [text, setText] = useState('')
  const [retrievedMessage, setRetrievedMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Check if MetaMask is available and disable other wallets
  useEffect(() => {
    const checkMetaMask = () => {
      if (window.ethereum) {
        // Disable other wallets by prioritizing MetaMask
        if (window.ethereum.providers?.length > 0) {
          // If multiple providers exist, find MetaMask
          const metamask = window.ethereum.providers.find((provider) => provider.isMetaMask)
          if (metamask) {
            window.ethereum = metamask
          }
        }
      }
    }

    checkMetaMask()
  }, [])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  async function requestAccount() {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' })
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      throw new Error('User rejected the request to connect wallet')
    }
  }

  const handleSet = async () => {
    try {
      setError('')
      setSuccess('')

      if (!text.trim()) {
        setError('Please enter a message before setting.')
        return
      }

      if (!window.ethereum) {
        setError('MetaMask not found. Please install MetaMask to use this application.')
        return
      }

      if (!window.ethereum.isMetaMask) {
        setError('Please use MetaMask wallet for this application.')
        return
      }

      setLoading(true)

      await requestAccount()
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)

      const tx = await contract.setMessage(text)
      setSuccess('Transaction submitted! Waiting for confirmation...')

      const txReceipt = await tx.wait()
      console.log('Transaction successful:', txReceipt)

      setSuccess('Message set successfully!')
      setText('') // Clear input after successful transaction

      // Automatically fetch the updated message
      await handleGet()
    } catch (error) {
      console.error('Error setting message:', error)

      // Handle specific error types
      if (error.code === 4001) {
        setError('Transaction was rejected by user.')
      } else if (error.code === -32603) {
        setError('Internal JSON-RPC error. Please check your network connection.')
      } else if (error.message?.includes('insufficient funds')) {
        setError('Insufficient funds for gas fees.')
      } else if (error.message?.includes('user rejected')) {
        setError('Transaction was rejected by user.')
      } else {
        setError(error.message || 'An error occurred while setting the message.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGet = async () => {
    try {
      setError('')

      if (!window.ethereum) {
        setError('MetaMask not found. Please install MetaMask to use this application.')
        return
      }

      if (!window.ethereum.isMetaMask) {
        setError('Please use MetaMask wallet for this application.')
        return
      }

      setLoading(true)

      await requestAccount()
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)

      const message = await contract.getMessage()
      setRetrievedMessage(message)
      setSuccess('Message retrieved successfully!')
    } catch (error) {
      console.error('Error getting message:', error)

      // Handle specific error types
      if (error.code === 4001) {
        setError('Request was rejected by user.')
      } else if (error.code === -32603) {
        setError('Internal JSON-RPC error. Please check your network connection.')
      } else if (error.message?.includes('user rejected')) {
        setError('Request was rejected by user.')
      } else {
        setError(error.message || 'An error occurred while getting the message.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container">
      <h1 className="app-title">Smart Contract Message App</h1>

      {/* Error Message */}
      {error && <div className="error-message">❌ {error}</div>}

      {/* Success Message */}
      {success && <div className="success-message">✅ {success}</div>}

      {/* Set Message Section */}
      <div className="section">
        <h2>Set Message</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter your message"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="message-input"
            disabled={loading}
          />
          <button
            onClick={handleSet}
            disabled={loading || !text.trim()}
            className={`btn btn-primary ${loading || !text.trim() ? 'btn-disabled' : ''}`}
          >
            {loading ? 'Processing...' : 'Set Message'}
          </button>
        </div>
      </div>

      {/* Get Message Section */}
      <div className="section">
        <h2>Get Message</h2>
        <button
          onClick={handleGet}
          disabled={loading}
          className={`btn btn-success ${loading ? 'btn-disabled' : ''}`}
        >
          {loading ? 'Loading...' : 'Get Message'}
        </button>

        {retrievedMessage && (
          <div className="message-display">
            <strong>Retrieved Message:</strong>
            <p className="retrieved-text">"{retrievedMessage}"</p>
          </div>
        )}
      </div>

      {/* MetaMask Check */}
      <div className="metamask-status">
        <p>🦊 Make sure you have MetaMask installed and connected to use this app.</p>
        {window.ethereum?.isMetaMask && <p className="status-success">✅ MetaMask detected</p>}
        {!window.ethereum && <p className="status-error">❌ MetaMask not detected</p>}
      </div>
    </div>
  )
}

export default App
