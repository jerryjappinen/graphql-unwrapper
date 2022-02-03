import map from 'lodash/map'
import merge from 'lodash/merge'

import isEntry from './isEntry'
import isListOfEntries from './isListOfEntries'
import unwrapEntryList from './unwrapEntryList'

import treatOptions from './treatOptions'

// Takes in one data object with potentially nested objects
// Returns a flat map of entries, where every object is keyed by their ID
// Throws an error, if ID or type is missing
const unwrapEntry = (originalEntryData, options) => {
  const { idKey, typeKey } = treatOptions(options)

  if (!originalEntryData[idKey] || !originalEntryData[typeKey]) {
    throw new Error(`unwrapEntry requires ID and ${typeKey} for all objects`)
  }

  // 1. Naively pick all fields from root object as-is
  let entriesById = {}
  const mainEntry = {
    ...originalEntryData
  }

  // 2. Find potential nested entries in data
  for (const fieldName in mainEntry) {
    if (Object.hasOwnProperty.call(mainEntry, fieldName)) {
      const field = mainEntry[fieldName]

      // 2.1 Nested reference
      if (isEntry(field, options)) {
        // 2.1. Keep ID of nested object in field
        // NOTE: if ID is missing, we'll get an error in the next step, so we won't bother checking
        mainEntry[fieldName] = field[idKey]

        // 2.2. Move actual nested object data into entry map
        entriesById = merge(
          {},
          entriesById,
          unwrapEntry(field, options)
        )

      // 2.2 Nested reference list
      } else if (isListOfEntries(field, options)) {
        // 2.1. Keep IDs of nested objects in field
        // NOTE: if IDs are missing, we'll get errors in the next step, so we won't bother checking
        mainEntry[fieldName] = map(field, idKey)

        // 2.2. Move actual nested object data into entry map
        entriesById = merge(
          {},
          entriesById,
          unwrapEntryList(field, options)
        )
      }
    }
  }

  // Add main-level entry to the full list
  entriesById[mainEntry[idKey]] = mainEntry

  return entriesById
}

export default unwrapEntry
