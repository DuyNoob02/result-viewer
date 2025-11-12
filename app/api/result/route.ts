import { NextResponse } from "next/server";

// Base64 PDF mẫu (rút gọn)
const samplePDF = '/pdfs/kq.pdf';

export async function GET() {
  const fakeData = {
    patientName: "Nguyễn Văn A",
    patientCode: "BN0001",
    gender: "Nam",
    birthDate: "12/04/1985",
    department: "Khoa Xét nghiệm",
    date: "10/11/2025 14:32",
    results: [
      { name: "Xét nghiệm máu", pdfUrl: samplePDF },
      { name: "X-quang ngực", pdfUrl: samplePDF },
      { name: "Siêu âm bụng", pdfUrl: samplePDF },
    ],
  };

  return NextResponse.json(fakeData);
}
