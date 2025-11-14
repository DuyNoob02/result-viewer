"use client";

import { useEffect, useState, useRef } from "react";

type ResultItem = {
  name: string;
  content: string;
  type: "pdf" | "image";
};

type ResultData = {
  patientName: string;
  patientCode: string;
  gender: string;
  birthDate: string;
  department: string;
  date: string;
  results: ResultItem[];
};

export default function ViewResultPage() {
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  useEffect(() => {
    fetch("/api/result")
      .then(async (res) => {
        if (!res.ok) throw new Error("Không thể tải kết quả");
        return res.json();
      })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!data) return;

    // Load PDF.js từ CDN
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.async = true;
    script.onload = () => {
      renderAllPDFs();
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [data]);

  const renderAllPDFs = async () => {
    if (!data) return;
    
    // @ts-ignore
    const pdfjsLib = window.pdfjsLib;
    if (!pdfjsLib) return;

    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    for (let idx = 0; idx < data.results.length; idx++) {
      const result = data.results[idx];
      if (result.type !== "pdf") continue;

      const canvas = canvasRefs.current[idx];
      if (!canvas) continue;

      try {
        const pdfData = atob(result.content);
        const loadingTask = pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        
        // Render all pages
        const container = canvas.parentElement;
        if (!container) continue;
        
        container.innerHTML = ""; // Clear loading
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const pageCanvas = document.createElement("canvas");
          const context = pageCanvas.getContext("2d");
          if (!context) continue;
          
          pageCanvas.width = viewport.width;
          pageCanvas.height = viewport.height;
          pageCanvas.className = "w-full border-b border-gray-200 last:border-b-0";
          
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
          
          container.appendChild(pageCanvas);
        }
      } catch (err) {
        console.error("Error rendering PDF:", err);
        if (canvas.parentElement) {
          canvas.parentElement.innerHTML = 
            '<p class="text-red-500 text-center py-8">Không thể hiển thị PDF</p>';
        }
      }
    }
  };

  const handleDownload = (base64Content: string, name: string, type: string) => {
    const mimeType = type === "pdf" ? "application/pdf" : "image/jpeg";
    
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name.replace(/\s+/g, "_")}.${type === "pdf" ? "pdf" : "jpg"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Đang tải kết quả...
      </div>
    );

  if (error || !data)
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        {error || "Không tìm thấy kết quả"}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <div className="bg-white w-full max-w-4xl shadow-lg rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <img
            src="/logo-new.png"
            alt="logo"
            className="mb-2"
            width={130}
            height={130}
          />
          <h1 className="text-blue-600 text-xl md:text-2xl font-bold">
            KẾT QUẢ CẬN LÂM SÀNG
          </h1>
        </div>

        {/* Thông tin bệnh nhân */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm md:text-base mb-4 bg-gray-50 p-4 rounded-lg">
          <p>
            <span className="font-semibold">Họ tên:</span> {data.patientName}
          </p>
          <p>
            <span className="font-semibold">Mã BN:</span> {data.patientCode}
          </p>
          <p>
            <span className="font-semibold">Giới tính:</span> {data.gender}
          </p>
          <p>
            <span className="font-semibold">Ngày sinh:</span> {data.birthDate}
          </p>
          <p className="md:col-span-2">
            <span className="font-semibold">Khoa chỉ định:</span>{" "}
            {data.department}
          </p>
          <p className="md:col-span-2">
            <span className="font-semibold">Ngày thực hiện:</span> {data.date}
          </p>
        </div>

        {/* Danh sách kết quả */}
        <div className="space-y-8">
          {data.results.map((r, idx) => (
            <div key={idx} className="border-t pt-6 first:border-t-0 first:pt-0">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                {idx + 1}. {r.name}
              </h2>
              
              {r.content ? (
                <>
                  {r.type === "pdf" ? (
                    <div className="w-full border rounded-lg overflow-hidden bg-gray-50">
                      <div 
                        ref={(el) => {
                          if (el) canvasRefs.current[idx] = el as any;
                        }}
                        className="flex flex-col items-center"
                      >
                        <canvas ref={(el) => {
                          if (el) canvasRefs.current[idx] = el;
                        }} className="hidden" />
                        <p className="text-gray-500 py-8">Đang tải PDF...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full border rounded-lg overflow-hidden bg-gray-50 flex justify-center">
                      <img
                        src={`data:image/jpeg;base64,${r.content}`}
                        alt={r.name}
                        className="max-w-full h-auto"
                      />
                    </div>
                  )}

                  <div className="text-center mt-4">
                    <button
                      onClick={() => handleDownload(r.content, r.name, r.type)}
                      className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition shadow-md"
                    >
                      📥 Tải kết quả
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Không có dữ liệu hiển thị
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-6 pt-6 border-t">
          © Bệnh viện ABC - Liên hệ 1900 1234 nếu cần hỗ trợ
        </div>
      </div>
    </div>
  );
}