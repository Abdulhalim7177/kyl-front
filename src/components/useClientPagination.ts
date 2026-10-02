import { useState, useMemo } from 'react'

export function useClientPagination<T>(data: T[], initialItemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage)

  const totalItems = data.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  // Ensure current page is valid when data length or itemsPerPage changes
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages)
  }

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return data.slice(startIndex, startIndex + itemsPerPage)
  }, [data, currentPage, itemsPerPage])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items)
    setCurrentPage(1) // Reset to first page
  }

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange
  }
}
