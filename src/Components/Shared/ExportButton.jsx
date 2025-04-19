import React from 'react';
import { Button } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';

const ExportButton = ({ data, filename }) => {
  const handleExport = () => {
    // ترتيب الأعمدة وتسميتها حسب الجدول المعروض
    const formattedData = data.map((appointment) => ({
      'الاسم': appointment.name, // اسم المستخدم
      'رقم الهاتف': appointment.phone, // رقم الهاتف
      'البريد الإلكتروني': appointment.email, // البريد الإلكتروني
      'المكان': `${appointment.type} ${appointment.clinicOrCenter}`, // المكان (عيادة/مركز)
      'المحافظة': appointment.province, // المحافظة
      'التخصص': appointment.service, // التخصص
      'الموعد': appointment.appointment, // الموعد
      'الرسالة': appointment.message, // الرسالة
    }));

    // إنشاء ورقة العمل والملف
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      className="mb-4"
    >
      تصدير إلى Excel
    </Button>
  );
};

export default ExportButton;