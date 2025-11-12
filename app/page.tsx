"use client";

import { useEffect, useState } from "react";



export default function ViewResultPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/result") // API trả JSON: thông tin bệnh nhân + mảng pdfUrl
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

        {/* Danh sách kết quả PDF */}
        <div className="space-y-8">
          {data.results.map((r: any, idx: number) => (
            <div key={idx}>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                {idx + 1}. {r.name}
              </h2>
              {r.pdfUrl ? (
                <iframe
                  src={r.pdfUrl}
                  width="100%"
                  height="600px"
                  className="border rounded-lg"
                />
              ) : (
                <p className="text-gray-500 text-center">
                  Không thể hiển thị PDF
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
