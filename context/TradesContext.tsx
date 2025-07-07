'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Trade, Tag, Note } from '../types/database'
import { dbHelpers } from '../lib/db'
import { useAuth } from './AuthContext'

interface TradesContextType {
  trades: Trade[]
  tags: Tag[]
  notes: Note[]
  loading: boolean
  addTrade: (trade: Omit<Trade, 'id' | 'created_at' | 'modified_at' | 'user_id'>) => Promise<number>
  updateTrade: (tradeId: number, updates: Partial<Omit<Trade, 'id' | 'created_at'>>) => Promise<void>
  deleteTrade: (tradeId: number) => Promise<void>
  addTag: (tag: Omit<Tag, 'id' | 'created_at'>) => Promise<number>
  deleteTag: (tagId: number) => Promise<void>
  addNote: (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<number>
  updateNote: (noteId: number, text: string) => Promise<void>
  deleteNote: (noteId: number) => Promise<void>
  loadTrades: () => Promise<void>
  getTagsByTrade: (tradeId: number) => Tag[]
  getNoteByTrade: (tradeId: number) => Note | undefined
}

const TradesContext = createContext<TradesContextType | undefined>(undefined)

export function TradesProvider({ children }: { children: React.ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Load all trades, tags, and notes for the current user
  const loadTrades = async () => {
    if (!user) {
      setTrades([])
      setTags([])
      setNotes([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Load trades
      const userTrades = await dbHelpers.getTradesByUser(user.id)
      setTrades(userTrades)

      // Load all tags for these trades
      const allTags: Tag[] = []
      for (const trade of userTrades) {
        const tradeTags = await dbHelpers.getTagsByTrade(trade.id!)
        allTags.push(...tradeTags)
      }
      setTags(allTags)

      // Load all notes for these trades
      const allNotes: Note[] = []
      for (const trade of userTrades) {
        const tradeNote = await dbHelpers.getNoteByTrade(trade.id!)
        if (tradeNote) {
          allNotes.push(tradeNote)
        }
      }
      setNotes(allNotes)
    } catch (error) {
      console.error('Error loading trades:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load trades when user changes
  useEffect(() => {
    loadTrades()
  }, [user])

  // Trade operations
  const addTrade = async (trade: Omit<Trade, 'id' | 'created_at' | 'modified_at' | 'user_id'>): Promise<number> => {
    if (!user) throw new Error('User not authenticated')
    
    const tradeWithUser = { ...trade, user_id: user.id }
    const tradeId = await dbHelpers.addTrade(tradeWithUser)
    
    // Reload trades to update state
    await loadTrades()
    return tradeId
  }

  const updateTrade = async (tradeId: number, updates: Partial<Omit<Trade, 'id' | 'created_at'>>): Promise<void> => {
    await dbHelpers.updateTrade(tradeId, updates)
    await loadTrades()
  }

  const deleteTrade = async (tradeId: number): Promise<void> => {
    await dbHelpers.deleteTrade(tradeId)
    await loadTrades()
  }

  // Tag operations
  const addTag = async (tag: Omit<Tag, 'id' | 'created_at'>): Promise<number> => {
    const tagId = await dbHelpers.addTag(tag)
    await loadTrades() // Reload to get updated tags
    return tagId
  }

  const deleteTag = async (tagId: number): Promise<void> => {
    await dbHelpers.deleteTag(tagId)
    await loadTrades()
  }

  // Note operations
  const addNote = async (note: Omit<Note, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
    const noteId = await dbHelpers.addNote(note)
    await loadTrades() // Reload to get updated notes
    return noteId
  }

  const updateNote = async (noteId: number, text: string): Promise<void> => {
    await dbHelpers.updateNote(noteId, text)
    await loadTrades()
  }

  const deleteNote = async (noteId: number): Promise<void> => {
    await dbHelpers.deleteNote(noteId)
    await loadTrades()
  }

  // Helper functions
  const getTagsByTrade = (tradeId: number): Tag[] => {
    return tags.filter(tag => tag.trade_id === tradeId)
  }

  const getNoteByTrade = (tradeId: number): Note | undefined => {
    return notes.find(note => note.trade_id === tradeId)
  }

  const value = {
    trades,
    tags,
    notes,
    loading,
    addTrade,
    updateTrade,
    deleteTrade,
    addTag,
    deleteTag,
    addNote,
    updateNote,
    deleteNote,
    loadTrades,
    getTagsByTrade,
    getNoteByTrade,
  }

  return (
    <TradesContext.Provider value={value}>
      {children}
    </TradesContext.Provider>
  )
}

export function useTrades() {
  const context = useContext(TradesContext)
  if (context === undefined) {
    throw new Error('useTrades must be used within a TradesProvider')
  }
  return context
} 