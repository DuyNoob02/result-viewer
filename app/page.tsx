"use client";

import { useEffect, useState } from "react";

type ResultItem = {
  name: string;
  content: string; // base64 string
  type: "pdf" | "image"; // loại file
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

  const handleDownload = (base64Content: string, name: string, type: string) => {
    // Xác định MIME type
    const mimeType = type === "pdf" ? "application/pdf" : "image/jpeg";
    
    // Chuyển base64 thành blob
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    
    // Tạo URL và download
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
                    // Hiển thị PDF trực tiếp
                    <div className="w-full border rounded-lg overflow-hidden bg-gray-50">
                      <iframe
                        src={`data:application/pdf;base64,${r.content}`}
                        className="w-full h-[500px] md:h-[700px]"
                        title={`PDF viewer for ${r.name}`}
                      />
                    </div>
                  ) : (
                    // Hiển thị hình ảnh trực tiếp
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