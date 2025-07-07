'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTrades } from '../../context/TradesContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { parseCSV } from '../../lib/csvParser'

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 })
  const { session, loading: authLoading } = useAuth()
  const { addTrade } = useTrades()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login')
    }
  }, [session, authLoading, router])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file)
        setMessage('')
      } else {
        setMessage('Please select a CSV file')
      }
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file)
        setMessage('')
      } else {
        setMessage('Please select a CSV file')
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a file first')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      // Read the file content
      const text = await selectedFile.text()
      console.log('File content:', text.substring(0, 500) + '...')
      
      // Parse CSV directly
      const result = parseCSV(text)
      console.log('Parsed trades:', result.trades)
      console.log('Parse errors:', result.errors)
      
      // Reset uploading state since parsing is complete
      setUploading(false)
      
      if (result.trades.length > 0) {
        setMessage(`Successfully parsed ${result.trades.length} trades! ${result.errors.length > 0 ? `(${result.errors.length} errors)` : ''}`)
        
        // Save trades to database
        setSaving(true)
        setSaveProgress({ current: 0, total: result.trades.length })
        try {
          let savedCount = 0
          let skippedCount = 0
          
          for (let i = 0; i < result.trades.length; i++) {
            const trade = result.trades[i]
            try {
              // Create external_id from trade data to prevent duplicates
              const externalId = `${trade.ticker}_${trade.trade_date}_${trade.side}_${trade.quantity}_${trade.price}`
              
              // TODO: Check for existing trades with same external_id before saving
              // TODO: Add better duplicate detection logic
              // TODO: Add progress indicator for large files
              // TODO: Add option to preview trades before saving
              // TODO: Add support for batch operations
              // TODO: Add duplicate detection before saving (show user which trades are duplicates)
              // TODO: Add preview modal to review trades before saving (allow user to edit/remove trades)
              
              await addTrade({
                ...trade,
                external_id: externalId
              })
              savedCount++
            } catch (error) {
              console.error('Error saving trade:', error)
              // Continue with other trades even if one fails
            }
            
            // Update progress
            setSaveProgress({ current: i + 1, total: result.trades.length })
          }
          
          setMessage(`Successfully saved ${savedCount} trades to your journal! ${skippedCount > 0 ? `(${skippedCount} duplicates skipped)` : ''} You can view them in your dashboard.`)
          setUploadSuccess(true)
          
        } catch (error) {
          console.error('Error saving trades:', error)
          setMessage('Error saving trades to database. Please try again.')
        } finally {
          setSaving(false)
        }
      } else {
        setMessage('No trades found in the file. Please check the CSV format.')
      }
      
    } catch (error) {
      console.error('Error reading file:', error)
      setMessage('Error reading file. Please try again.')
      setUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setMessage('')
    setUploadSuccess(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upload Trading Statement
            </h1>
            <p className="text-gray-600">
              Upload your broker's CSV statement to import your trades
            </p>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : selectedFile 
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div>
                <div className="text-green-600 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  File Selected
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
                <div className="space-x-3">
                  <button
                    onClick={handleUpload}
                    disabled={uploading || saving}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {uploading ? 'Processing...' : saving ? 'Saving...' : 'Process File'}
                  </button>
                  <button
                    onClick={removeFile}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your CSV file here
                </h3>
                <p className="text-gray-600 mb-4">
                  or click to browse
                </p>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Choose File
                  </span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded ${
              message.includes('Error') 
                ? 'bg-red-100 text-red-700' 
                : message.includes('successfully')
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
            }`}>
              {message}
            </div>
          )}

          {/* Progress Bar */}
          {saving && saveProgress.total > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Saving trades...</span>
                <span>{saveProgress.current} / {saveProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(saveProgress.current / saveProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* View Trades Button */}
          {uploadSuccess && (
            <div className="mt-4 text-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                View Your Trades
              </button>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Supported Formats
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Robinhood CSV statements</li>
              <li>• TD Ameritrade CSV statements</li>
              <li>• Other broker CSV formats (coming soon)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 