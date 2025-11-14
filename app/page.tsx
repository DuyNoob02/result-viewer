"use client";

import { useEffect, useState } from "react";

export default function ViewResultPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Xử lý base64 cho cả PDF và hình ảnh
  const processBase64ToUrl = (base64: string) => {
    try {
      if (!base64) return null;

      // Loại bỏ data URI prefix nếu có
      let cleanBase64 = base64;
      const dataUriMatch = base64.match(/^data:([^;]+);base64,/);
      
      if (dataUriMatch) {
        cleanBase64 = base64.replace(dataUriMatch[0], "");
      }

      // Loại bỏ khoảng trắng và ký tự xuống dòng
      cleanBase64 = cleanBase64.replace(/[\r\n\s]+/g, "").trim();

      // Phát hiện loại file từ magic bytes
      let fileType = "pdf";
      let mimeType = "application/pdf";

      try {
        // Đọc vài byte đầu để xác định loại file
        const binaryString = window.atob(cleanBase64.substring(0, 20));
        const header = Array.from(binaryString)
          .map(char => char.charCodeAt(0).toString(16).padStart(2, '0'))
          .join('').toUpperCase();

        // Phát hiện loại file
        if (header.startsWith('FFD8FF')) {
          fileType = "image";
          mimeType = "image/jpeg";
        } else if (header.startsWith('89504E47')) {
          fileType = "image";
          mimeType = "image/png";
        } else if (header.startsWith('47494638')) {
          fileType = "image";
          mimeType = "image/gif";
        } else if (header.startsWith('25504446')) {
          fileType = "pdf";
          mimeType = "application/pdf";
        }
      } catch (e) {
        console.log("Không thể phát hiện loại file, mặc định là PDF");
      }

      // Nếu là hình ảnh, trả về data URL trực tiếp
      if (fileType === "image") {
        return {
          url: `data:${mimeType};base64,${cleanBase64}`,
          type: "image"
        };
      }

      // Nếu là PDF, convert sang Blob URL
      const binaryString = window.atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: mimeType });
      return {
        url: URL.createObjectURL(blob),
        type: "pdf"
      };
    } catch (err) {
      console.error("Lỗi xử lý base64:", err);
      return null;
    }
  };

  useEffect(() => {
    fetch("/api/result")
      .then(async (res) => {
        if (!res.ok) throw new Error("Không thể tải kết quả");
        return res.json();
      })
      .then((res) => {
        // Xử lý base64 thành URL có thể hiển thị
        const results = res.results.map((r: any) => ({
          ...r,
          processed: processBase64ToUrl(r.pdfUrl), // pdfUrl có thể là PDF hoặc image
        }));

        setData({ ...res, results });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Cleanup blob URLs khi component unmount
    return () => {
      if (data?.results) {
        data.results.forEach((r: any) => {
          if (r.processed?.type === "pdf" && r.processed.url) {
            URL.revokeObjectURL(r.processed.url);
          }
        });
      }
    };
  }, []);

  const handleDownload = (result: any) => {
    if (!result.processed) return;

    const link = document.createElement("a");
    link.href = result.processed.url;
    
    // Xác định extension dựa trên loại file
    const extension = result.processed.type === "image" ? "jpg" : "pdf";
    link.download = `${result.name.replace(/\s+/g, "_")}.${extension}`;
    
    link.click();
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
          <h1 className="text-primary-title text-xl md:text-2xl font-bold">
            KẾT QUẢ CẬN LÂM SÀNG
          </h1>
        </div>

        {/* Thông tin bệnh nhân */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm md:text-base mb-4">
          <p><span className="font-semibold">Họ tên:</span> {data.patientName}</p>
          <p><span className="font-semibold">Mã BN:</span> {data.patientCode}</p>
          <p><span className="font-semibold">Giới tính:</span> {data.gender}</p>
          <p><span className="font-semibold">Ngày sinh:</span> {data.birthDate}</p>
          <p className="md:col-span-2">
            <span className="font-semibold">Khoa chỉ định:</span> {data.department}
          </p>
          <p className="md:col-span-2">
            <span className="font-semibold">Ngày thực hiện:</span> {data.date}
          </p>
        </div>

        {/* Danh sách kết quả */}
        <div className="space-y-10">
          {data.results.map((r: any, idx: number) => (
            <div key={idx}>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                {idx + 1}. {r.name}
              </h2>

              {r.processed ? (
                <>
                  {/* Hiển thị theo loại file */}
                  {r.processed.type === "image" ? (
                    // Hiển thị hình ảnh
                    <div className="border rounded-lg mb-4 p-4 bg-gray-50 flex justify-center">
                      <img
                        src={r.processed.url}
                        alt={r.name}
                        className="max-w-full h-auto rounded-lg shadow-md"
                        style={{ maxHeight: "800px" }}
                      />
                    </div>
                  ) : (
                    // Hiển thị PDF
                    <>
                      {/* Desktop: object tag */}
                      <div className="hidden md:block">
                        <object
                          data={r.processed.url}
                          type="application/pdf"
                          width="100%"
                          height="600px"
                          className="border rounded-lg mb-4"
                        >
                          <iframe
                            src={r.processed.url}
                            width="100%"
                            height="600px"
                            className="border rounded-lg"
                          />
                        </object>
                      </div>

                      {/* Mobile: iframe */}
                      <div className="md:hidden">
                        <iframe
                          src={r.processed.url}
                          width="100%"
                          height="500px"
                          className="border rounded-lg mb-4"
                        />
                      </div>
                    </>
                  )}

                  <div className="text-center">
                    <button
                      onClick={() => handleDownload(r)}
                      className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition"
                    >
                      Tải kết quả
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-500 text-center">
                  Không thể hiển thị file
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-6">
          © Bệnh viện ABC - Liên hệ 1900 1234 nếu cần hỗ trợ
        </div>
      </div>
    </div>
  );
}