"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Download, Search, BookOpen } from "lucide-react"

interface BookResult {
  year: number
  authors: string
  title: string
  url: string
}

interface SearchParams {
  subject: string
  startYear: number
  endYear: number
  globalLimit: number
}

export default function DOABScraperPage() {
  const [searchParams, setSearchParams] = useState<SearchParams>({
    subject: "",
    startYear: 2020,
    endYear: 2024,
    globalLimit: 50,
  })
  const [results, setResults] = useState<BookResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }

      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const downloadCSV = () => {
    if (results.length === 0) return

    const headers = ["Year", "Authors/Contributors", "Title", "URL"]
    const csvContent = [
      headers.join(","),
      ...results.map((row) =>
        [row.year, `"${row.authors.replace(/"/g, '""')}"`, `"${row.title.replace(/"/g, '""')}"`, row.url].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `doab-books-${searchParams.subject || "search"}-${Date.now()}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">DOAB Book Scraper</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Search and discover open access books from the Directory of Open Access Books
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Parameters
              </CardTitle>
              <CardDescription>Enter your search criteria to find relevant open access books</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject/Course</Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="e.g., Computer Science, Mathematics"
                      value={searchParams.subject}
                      onChange={(e) => setSearchParams((prev) => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="globalLimit">Global Limit</Label>
                    <Input
                      id="globalLimit"
                      type="number"
                      min="1"
                      max="1000"
                      value={searchParams.globalLimit}
                      onChange={(e) =>
                        setSearchParams((prev) => ({ ...prev, globalLimit: Number.parseInt(e.target.value) || 50 }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startYear">Start Year</Label>
                    <Input
                      id="startYear"
                      type="number"
                      min="1900"
                      max="2024"
                      value={searchParams.startYear}
                      onChange={(e) =>
                        setSearchParams((prev) => ({ ...prev, startYear: Number.parseInt(e.target.value) || 2020 }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endYear">End Year</Label>
                    <Input
                      id="endYear"
                      type="number"
                      min="1900"
                      max="2024"
                      value={searchParams.endYear}
                      onChange={(e) =>
                        setSearchParams((prev) => ({ ...prev, endYear: Number.parseInt(e.target.value) || 2024 }))
                      }
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching Books...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Books
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Search Results</CardTitle>
                      <CardDescription>
                        {results.length > 0
                          ? `Found ${results.length} book${results.length === 1 ? "" : "s"}`
                          : "No books found for your search criteria"}
                      </CardDescription>
                    </div>
                    {results.length > 0 && (
                      <Button
                        onClick={downloadCSV}
                        variant="outline"
                        className="flex items-center gap-2 bg-transparent"
                      >
                        <Download className="h-4 w-4" />
                        Download CSV
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <span className="ml-3 text-lg">Scraping books...</span>
                    </div>
                  ) : results.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Year</TableHead>
                            <TableHead>Authors/Contributors</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead className="w-24">URL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {results.map((book, index) => (
                            <motion.tr
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className={index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800/50" : ""}
                            >
                              <TableCell className="font-medium">{book.year}</TableCell>
                              <TableCell className="max-w-xs">
                                <div className="truncate" title={book.authors}>
                                  {book.authors}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-md">
                                <div className="truncate font-medium" title={book.title}>
                                  {book.title}
                                </div>
                              </TableCell>
                              <TableCell>
                                <a
                                  href={book.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                                >
                                  View
                                </a>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : hasSearched && !isLoading ? (
                    <div className="text-center py-12">
                      <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No books found</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Try adjusting your search parameters or expanding the year range.
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
