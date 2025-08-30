"use client";

import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ExternalHyperlink,
} from "docx";
import { saveAs } from "file-saver";

export default function Home() {
  const [query, setQuery] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [size, setSize] = useState(10);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchArticles = async () => {
    if (!query) {
      toast.error("⚠️ Please enter a topic before searching.");
      return;
    }

    setLoading(true);
    setArticles([]);

    const loadingToast = toast.loading("Fetching articles...");

    try {
      const res = await fetch(
        `/api/search?query=${query}&year_from=${yearFrom}&year_to=${yearTo}&size=${size}`
      );

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();

      toast.dismiss(loadingToast);

      if (data.length === 0) {
        toast("No results found 🚫", { icon: "🔍" });
      } else {
        setArticles(data);
        toast.success(`✅ Found ${data.length} articles`);
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error("❌ Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  // 📄 Generate Word Doc
  const downloadWord = async () => {
    if (articles.length === 0) {
      toast.error("⚠️ No articles to export.");
      return;
    }

    const headerRow = new TableRow({
      children: [
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Journal", bold: true })],
            }),
          ],
          shading: { fill: "E5E7EB" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Title", bold: true })],
            }),
          ],
          shading: { fill: "E5E7EB" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Authors", bold: true })],
            }),
          ],
          shading: { fill: "E5E7EB" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "Year", bold: true })],
            }),
          ],
          shading: { fill: "E5E7EB" },
        }),
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: "URL", bold: true })],
            }),
          ],
          shading: { fill: "E5E7EB" },
        }),
      ],
    });

    const tableRows = [
      headerRow,
      ...articles.map(
        (a) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(a.Journal || "—")] }),
              new TableCell({ children: [new Paragraph(a.Title || "—")] }),
              new TableCell({
                children: [
                  new Paragraph(
                    Array.isArray(a.Authors)
                      ? a.Authors.join(", ")
                      : a.Authors || "—"
                  ),
                ],
              }),
              new TableCell({
                children: [new Paragraph(a.Year?.toString() || "—")],
              }),
              new TableCell({
                children: [
                  a.URL
                    ? new Paragraph({
                        children: [
                          new ExternalHyperlink({
                            children: [
                              new TextRun({
                                text: "View",
                                style: "Hyperlink",
                              }),
                            ],
                            link: a.URL,
                          }),
                        ],
                      })
                    : new Paragraph("—"),
                ],
              }),
            ],
          })
      ),
    ];

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "DOAJ Articles Export",
              heading: "Heading1",
            }),
            new Paragraph(""),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
              borders: {
                top: { style: "single", size: 1, color: "000000" },
                bottom: { style: "single", size: 1, color: "000000" },
                left: { style: "single", size: 1, color: "000000" },
                right: { style: "single", size: 1, color: "000000" },
                insideHorizontal: { style: "single", size: 1, color: "000000" },
                insideVertical: { style: "single", size: 1, color: "000000" },
              },
            }),
          ],
        },
      ],
    });

    // 📂 Dynamic file name
    const safeQuery = query.replace(/[^a-z0-9]/gi, "_");
    const fileName = `${safeQuery}_${yearFrom || "XXXX"}-${
      yearTo || "XXXX"
    }.docx`;

    const blob = await Packer.toBlob(doc);
    saveAs(blob, fileName);
    toast.success(`📥 Downloaded Word document: ${fileName}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-right" />

      <h1 className="text-3xl font-bold mb-6 text-center">
        📚 DOAJ Scraper UI
      </h1>

      {/* Search Form */}
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-2xl p-6 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Enter topic (e.g. African Studies)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <input
            type="number"
            placeholder="Start Year (e.g. 2021)"
            value={yearFrom}
            onChange={(e) => setYearFrom(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <input
            type="number"
            placeholder="End Year (e.g. 2025)"
            value={yearTo}
            onChange={(e) => setYearTo(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
          <input
            type="number"
            placeholder="No. of results (e.g. 20)"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        <button
          onClick={fetchArticles}
          disabled={loading}
          className="mt-4 w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition cursor-pointer"
        >
          {loading ? "Loading..." : "Search Articles"}
        </button>
      </div>

      {/* Results */}
      <div className="max-w-6xl mx-auto">
        {articles.length > 0 ? (
          <div className="overflow-x-auto shadow-lg rounded-2xl">
            <table className="w-full border-collapse bg-white rounded-2xl">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-3 text-left">Journal</th>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">Authors</th>
                  <th className="p-3 text-left">Year</th>
                  <th className="p-3 text-left">URL</th>
                </tr>
              </thead>
              <tbody>
                {articles.map((a, i) => (
                  <tr
                    key={i}
                    className="border-b hover:bg-gray-50 transition text-sm"
                  >
                    <td className="p-3">{a.Journal || "—"}</td>
                    <td className="p-3">{a.Title}</td>
                    <td className="p-3">
                      {Array.isArray(a.Authors)
                        ? a.Authors.join(", ")
                        : a.Authors || "—"}
                    </td>
                    <td className="p-3">{a.Year || "—"}</td>
                    <td className="p-3">
                      {a.URL ? (
                        <a
                          href={a.URL}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* 📄 Download button */}
            <button
              onClick={downloadWord}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              ⬇️ Download as Word
            </button>
          </div>
        ) : (
          !loading && (
            <p className="text-center text-gray-400 italic mt-6">
              🔍 Start by searching for a topic above...
            </p>
          )
        )}
      </div>
    </div>
  );
}
