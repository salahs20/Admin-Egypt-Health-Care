import React from 'react';
import { Button } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import ExcelJS from 'exceljs';

const ExportButton = ({ data, filename, statistics }) => {
  const handleExport = async () => {
    // إنشاء ملف Excel جديد
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Admin System';
    workbook.lastModifiedBy = 'Admin System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // تنسيق العناوين
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    // إضافة ورقة المواعيد
    const appointmentsSheet = workbook.addWorksheet('المواعيد');
    appointmentsSheet.columns = [
      { header: '#', key: 'id', width: 5 },
      { header: 'الاسم', key: 'name', width: 20 },
      { header: 'رقم الهاتف', key: 'phone', width: 15 },
      { header: 'البريد الإلكتروني', key: 'email', width: 25 },
      { header: 'المكان', key: 'location', width: 20 },
      { header: 'المحافظة', key: 'province', width: 15 },
      { header: 'التخصص', key: 'service', width: 15 },
      { header: 'الموعد', key: 'appointment', width: 25 },
      { header: 'الرسالة', key: 'message', width: 30 },
      { header: 'حالة الإرسال', key: 'dataSent', width: 15 },
      { header: 'تاريخ التسجيل', key: 'registrationDate', width: 25 },
      { header: 'التعليقات', key: 'comments', width: 30 }
    ];

    // إضافة بيانات المواعيد
    data.forEach((item, index) => {
      appointmentsSheet.addRow({
        id: index + 1,
        name: item.name,
        phone: item.phone,
        email: item.email,
        location: `${item.type} ${item.clinicOrCenter}`,
        province: item.province,
        service: item.service,
        appointment: new Date(item.appointment).toLocaleString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        message: item.message,
        dataSent: item.dataSent ? 'تم الإرسال' : 'لم يتم الإرسال',
        registrationDate: new Date(item.registrationDate).toLocaleString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        comments: item.comments || ''
      });
    });

    // تطبيق التنسيق على العناوين
    appointmentsSheet.getRow(1).eachCell(cell => {
      cell.style = headerStyle;
    });

    // إذا كانت هناك إحصائيات، أضفها
    if (statistics) {
      // إحصائيات عامة
      const generalSheet = workbook.addWorksheet('إحصائيات عامة');
      generalSheet.columns = [
        { header: 'نوع الإحصائية', key: 'type', width: 20 },
        { header: 'القيمة', key: 'value', width: 15 }
      ];

      const generalStats = {
        'إجمالي المواعيد': statistics.totalAppointments,
        'إجمالي المستخدمين': statistics.totalUsers,
        'متوسط المواعيد اليومي': (statistics.totalAppointments / 30).toFixed(1),
        'المواعيد المحجوزة': statistics.bookedAppointments,
        'المواعيد المتاحة': statistics.availableSlots,
        'تم الإرسال': statistics.dataSent || 0,
        'لم يتم الإرسال': statistics.notDataSent || 0
      };

      Object.entries(generalStats).forEach(([key, value]) => {
        generalSheet.addRow({ type: key, value: value });
      });

      // إحصائيات المحافظات
      const provinceSheet = workbook.addWorksheet('إحصائيات المحافظات');
      provinceSheet.columns = [
        { header: 'المحافظة', key: 'province', width: 20 },
        { header: 'العدد', key: 'count', width: 15 },
        { header: 'النسبة المئوية', key: 'percentage', width: 15 }
      ];

      const provinceStats = Object.entries(statistics.appointmentsByProvince || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([province, count]) => ({
          province,
          count,
          percentage: `${((count / statistics.totalAppointments) * 100).toFixed(1)}%`
        }));

      provinceStats.forEach(stat => {
        provinceSheet.addRow(stat);
      });

      // إحصائيات التخصصات
      const serviceSheet = workbook.addWorksheet('إحصائيات التخصصات');
      serviceSheet.columns = [
        { header: 'التخصص', key: 'service', width: 20 },
        { header: 'العدد', key: 'count', width: 15 },
        { header: 'النسبة المئوية', key: 'percentage', width: 15 }
      ];

      const serviceStats = Object.entries(statistics.appointmentsByService || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([service, count]) => ({
          service,
          count,
          percentage: `${((count / statistics.totalAppointments) * 100).toFixed(1)}%`
        }));

      serviceStats.forEach(stat => {
        serviceSheet.addRow(stat);
      });

      // تطبيق التنسيق على العناوين
      [generalSheet, provinceSheet, serviceSheet].forEach(sheet => {
        sheet.getRow(1).eachCell(cell => {
          cell.style = headerStyle;
        });
      });
    }

    // حفظ الملف
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
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