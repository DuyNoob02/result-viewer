import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kết quả cận lâm sàng",
  description: "Trang xem kết quả xét nghiệm PDF cho bệnh nhân"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-gray-100">{children}</body>
    </html>
  );
}
