import Dexie, { Table } from 'dexie'
import { Trade, Tag, Note } from '../types/database'

export class TraderJournalDB extends Dexie {
  trades!: Table<Trade>
  tags!: Table<Tag>
  notes!: Table<Note>

  constructor() {
    super('TraderJournalDB')
    
    this.version(1).stores({
      trades: '++id, user_id, ticker, asset_type, side, trade_date, external_id',
      tags: '++id, trade_id, tag',
      notes: '++id, trade_id'
    })
  }
}

export const db = new TraderJournalDB()

// Helper functions for common operations
export const dbHelpers = {
  // Trade operations
  async addTrade(trade: Omit<Trade, 'id' | 'created_at' | 'modified_at'>): Promise<number> {
    const now = new Date().toISOString()
    return await db.trades.add({
      ...trade,
      created_at: now,
      modified_at: now
    })
  },

  async getTradesByUser(userId: string): Promise<Trade[]> {
    return await db.trades
      .where('user_id')
      .equals(userId)
      .reverse()
      .sortBy('trade_date')
  },

  async getTradesByAssetType(userId: string, assetType: string): Promise<Trade[]> {
    return await db.trades
      .where(['user_id', 'asset_type'])
      .equals([userId, assetType])
      .reverse()
      .sortBy('trade_date')
  },

  async updateTrade(tradeId: number, updates: Partial<Omit<Trade, 'id' | 'created_at'>>): Promise<void> {
    const now = new Date().toISOString()
    await db.trades.update(tradeId, {
      ...updates,
      modified_at: now
    })
  },

  async deleteTrade(tradeId: number): Promise<void> {
    // Delete related tags and notes first
    await db.tags.where('trade_id').equals(tradeId).delete()
    await db.notes.where('trade_id').equals(tradeId).delete()
    // Delete the trade
    await db.trades.delete(tradeId)
  },

  async findTradeByExternalId(userId: string, externalId: string): Promise<Trade | undefined> {
    return await db.trades
      .where(['user_id', 'external_id'])
      .equals([userId, externalId])
      .first()
  },

  // Tag operations
  async addTag(tag: Omit<Tag, 'id' | 'created_at'>): Promise<number> {
    const now = new Date().toISOString()
    return await db.tags.add({
      ...tag,
      created_at: now
    })
  },

  async getTagsByTrade(tradeId: number): Promise<Tag[]> {
    return await db.tags
      .where('trade_id')
      .equals(tradeId)
      .toArray()
  },

  async deleteTag(tagId: number): Promise<void> {
    await db.tags.delete(tagId)
  },

  // Note operations
  async addNote(note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
    const now = new Date().toISOString()
    return await db.notes.add({
      ...note,
      created_at: now,
      updated_at: now
    })
  },

  async updateNote(noteId: number, text: string): Promise<void> {
    const now = new Date().toISOString()
    await db.notes.update(noteId, {
      text,
      updated_at: now
    })
  },

  async getNoteByTrade(tradeId: number): Promise<Note | undefined> {
    return await db.notes
      .where('trade_id')
      .equals(tradeId)
      .first()
  },

  async deleteNote(noteId: number): Promise<void> {
    await db.notes.delete(noteId)
  }
} 