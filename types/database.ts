export type AssetType = 'stock' | 'option' | 'future'
export type TradeSide = 'buy' | 'sell'

export interface Trade {
  id?: number
  user_id: string
  ticker: string
  asset_type: AssetType
  side: TradeSide
  quantity: number
  price: number
  trade_date: string
  metadata?: Record<string, any> // JSONB for instrument-specific data
  external_id?: string // Broker-specific ID or hash (optional, for sync)
  created_at?: string
  modified_at?: string
}

export interface Tag {
  id?: number
  trade_id: number
  tag: string
  created_at?: string
}

export interface Note {
  id?: number
  trade_id: number
  text: string
  created_at?: string
  updated_at?: string
}

export interface Database {
  trades: Trade
  tags: Tag
  notes: Note
} 