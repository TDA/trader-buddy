import Papa from 'papaparse'

interface RawTrade {
  [key: string]: string
}

interface NormalizedTrade {
  ticker: string
  asset_type: 'stock' | 'option' | 'future'
  side: 'buy' | 'sell'
  quantity: number
  price: number
  trade_date: string
  metadata?: Record<string, any>
}

interface ParseResult {
  trades: NormalizedTrade[]
  errors: string[]
}

// Helper function to find field value with flexible matching
function findFieldValue(rawTrade: RawTrade, possibleNames: string[]): string | undefined {
  for (const name of possibleNames) {
    if (rawTrade[name] !== undefined && rawTrade[name] !== '') {
      return rawTrade[name]
    }
  }
  return undefined
}

// Normalize trade data to our schema
function normalizeTrade(rawTrade: RawTrade, broker: string): NormalizedTrade | null {
  try {
    // Robinhood CSV format
    if (broker === 'robinhood') {
      // TODO: Handle the option expiry rows like "Option Expiration for CRWD 5/30/2025 Call $490.00"
      // TODO: Add support for more Robinhood transaction types (dividends, fees, etc.)
      // TODO: Improve ticker extraction for complex option descriptions
      console.log('Processing Robinhood format for row:', rawTrade)
      console.log('Available keys:', Object.keys(rawTrade))
      
      // More flexible field matching to handle whitespace and case variations
      const instrument = findFieldValue(rawTrade, ['Instrument', 'instrument', 'Instrument ', 'instrument '])
      const description = findFieldValue(rawTrade, ['Description', 'description', 'Description ', 'description '])
      const transCode = findFieldValue(rawTrade, ['Trans Code', 'trans code', 'TransCode', 'TransCode ', 'Trans Code '])
      const quantityStr = findFieldValue(rawTrade, ['Quantity', 'quantity', 'Quantity ', 'quantity ']) || '0'
      const priceStr = findFieldValue(rawTrade, ['Price', 'price', 'Price ', 'price ']) || '0'
      const date = findFieldValue(rawTrade, ['Activity Date', 'activity date', 'ActivityDate', 'Activity Date ', 'activity date '])
      
      const quantity = parseFloat(quantityStr)
      const price = parseFloat(priceStr.replace(/[$,]/g, ''))
      
      console.log('Extracted values:', { instrument, description, transCode, quantity, price, date })
      
      if (!instrument || !transCode || !quantity || !price || !date) {
        console.log('Missing required fields:', { instrument: !!instrument, transCode: !!transCode, quantity: !!quantity, price: !!price, date: !!date })
        return null
      }

      // Extract ticker from instrument or description
      let ticker = instrument
      if (description && description.includes(' ')) {
        // Try to extract ticker from description (e.g., "NOW 7/11/2025 Call $1,070.00" -> "NOW")
        const parts = description.split(' ')
        if (parts.length > 0) {
          ticker = parts[0]
        }
      }

      // Determine side from transaction code
      let side: 'buy' | 'sell' = 'buy'
      if (transCode === 'STC' || transCode === 'STO') {
        side = 'sell'
      } else if (transCode === 'BTC' || transCode === 'BTO') {
        side = 'buy'
      }

      // Determine asset type from description
      let asset_type: 'stock' | 'option' | 'future' = 'stock'
      if (description && (description.includes('Call') || description.includes('Put'))) {
        asset_type = 'option'
      } else if (description && description.includes('/')) {
        asset_type = 'future'
      }

      console.log('Final parsed trade:', { ticker, asset_type, side, quantity, price, trade_date: new Date(date).toISOString() })

      return {
        ticker: ticker.toUpperCase(),
        asset_type,
        side,
        quantity: Math.abs(quantity),
        price: Math.abs(price),
        trade_date: new Date(date).toISOString(),
        metadata: {
          broker: 'robinhood',
          trans_code: transCode,
          description,
          original_data: rawTrade
        }
      }
    }

    // TD Ameritrade CSV format
    if (broker === 'td') {
      const ticker = rawTrade['Symbol'] || rawTrade['symbol']
      const side = rawTrade['Buy/Sell'] || rawTrade['buy/sell']
      const quantity = parseFloat(rawTrade['Quantity'] || rawTrade['quantity'] || '0')
      const price = parseFloat(rawTrade['Price'] || rawTrade['price'] || '0')
      const date = rawTrade['Date'] || rawTrade['date']
      
      if (!ticker || !side || !quantity || !price || !date) {
        return null
      }

      return {
        ticker: ticker.toUpperCase(),
        asset_type: 'stock',
        side: side.toLowerCase().includes('buy') ? 'buy' : 'sell',
        quantity: Math.abs(quantity),
        price: Math.abs(price),
        trade_date: new Date(date).toISOString(),
        metadata: {
          broker: 'td',
          original_data: rawTrade
        }
      }
    }

    // Generic CSV format - try to guess columns
    const ticker = rawTrade['Symbol'] || rawTrade['symbol'] || rawTrade['Ticker'] || rawTrade['ticker']
    const side = rawTrade['Side'] || rawTrade['side'] || rawTrade['Type'] || rawTrade['type']
    const quantity = parseFloat(rawTrade['Quantity'] || rawTrade['quantity'] || rawTrade['Qty'] || rawTrade['qty'] || '0')
    const price = parseFloat(rawTrade['Price'] || rawTrade['price'] || '0')
    const date = rawTrade['Date'] || rawTrade['date'] || rawTrade['Time'] || rawTrade['time']
    
    if (!ticker || !side || !quantity || !price || !date) {
      return null
    }

    return {
      ticker: ticker.toUpperCase(),
      asset_type: 'stock',
      side: side.toLowerCase().includes('buy') ? 'buy' : 'sell',
      quantity: Math.abs(quantity),
      price: Math.abs(price),
      trade_date: new Date(date).toISOString(),
      metadata: {
        broker: 'generic',
        original_data: rawTrade
      }
    }
  } catch (error) {
    console.error('Error normalizing trade:', error, rawTrade)
    return null
  }
}

// Detect broker format from CSV headers
function detectBroker(headers: string[]): string {
  const headerStr = headers.join(' ').toLowerCase()
  console.log('Headers:', headers)
  console.log('Header string:', headerStr)
  
  if (headerStr.includes('robinhood') || headers.some(h => h.toLowerCase().includes('robinhood'))) {
    return 'robinhood'
  }
  
  // Check for Robinhood-specific headers
  if (headers.some(h => h.toLowerCase().includes('activity date')) || 
      headers.some(h => h.toLowerCase().includes('trans code')) ||
      headers.some(h => h.toLowerCase().includes('instrument'))) {
    console.log('Detected Robinhood format by headers')
    return 'robinhood'
  }
  
  // TODO: Add TD Ameritrade header detection
  if (headerStr.includes('td') || headerStr.includes('ameritrade') || headers.some(h => h.toLowerCase().includes('td'))) {
    return 'td'
  }
  
  // TODO: Add support for more brokers (Fidelity, Schwab, etc.)
  // Default to generic
  console.log('Defaulting to generic format')
  return 'generic'
}

// Main parsing function
export function parseCSV(csvText: string): ParseResult {
  const result: ParseResult = {
    trades: [],
    errors: []
  }

  try {
    console.log('Starting CSV parsing...')
    console.log('CSV text preview:', csvText.substring(0, 200))
    
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: 'greedy', // Skip completely empty lines
      transformHeader: (header) => header.trim(),
      transform: (value) => value.trim(),
      dynamicTyping: false, // Keep everything as strings for now
      complete: (results) => {
        console.log('Papa parse completed with results:', results)
      }
    })

    console.log('Papa parse result:', parsed)
    console.log('Parsed data length:', parsed.data.length)
    console.log('First row:', parsed.data[0])

    if (parsed.errors.length > 0) {
      result.errors.push(`CSV parsing errors: ${parsed.errors.map(e => e.message).join(', ')}`)
    }

    if (!parsed.data || parsed.data.length === 0) {
      result.errors.push('No data found in CSV file')
      return result
    }

    // Detect broker format
    const broker = detectBroker(parsed.meta.fields || [])
    console.log('Detected broker format:', broker)

    // Process each row
    parsed.data.forEach((row: any, index: number) => {
      console.log(`Processing row ${index + 1}:`, row)
      const normalizedTrade = normalizeTrade(row as RawTrade, broker)
      if (normalizedTrade) {
        result.trades.push(normalizedTrade)
      } else {
        result.errors.push(`Row ${index + 1}: Could not parse trade data`)
      }
    })

    console.log(`Parsed ${result.trades.length} trades from ${parsed.data.length} rows`)
    
  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error}`)
  }

  return result
} 