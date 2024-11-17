import { atom } from 'jotai'
import React from 'react'

export const isSearchingAtom = atom(false)
export const searchValueAtom = atom('')

const SearchBar = () => {
  return (
    <div>SearchBar</div>
  )
}

export default SearchBar