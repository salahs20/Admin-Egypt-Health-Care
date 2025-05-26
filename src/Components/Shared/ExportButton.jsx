import React from 'react';
import { Button } from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import ExcelJS from 'exceljs';

const ExportButton = ({ data, filename, statistics }) => {
  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Admin System';
    workbook.lastModifiedBy = 'Admin System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // تنسيق العناوين الرئيسية
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFF' }, size: 12 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      }
    };

    // تنسيق الخلايا العادية
    const cellStyle = {
      alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } }
      }
    };

    // تنسيق الخلايا البديلة
    const alternateCellStyle = {
      ...cellStyle,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } }
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
      const row = appointmentsSheet.addRow({
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

      // تطبيق التنسيق البديل على الصفوف
      row.eachCell(cell => {
        cell.style = index % 2 === 0 ? cellStyle : alternateCellStyle;
      });
    });

    // تطبيق التنسيق على العناوين
    appointmentsSheet.getRow(1).eachCell(cell => {
      cell.style = headerStyle;
    });

    // إضافة الفلتر التلقائي لورقة المواعيد
    appointmentsSheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: appointmentsSheet.columnCount }
    };

    // إذا كانت هناك إحصائيات، أضفها
    if (statistics) {
      // إحصائيات عامة
      const generalSheet = workbook.addWorksheet('إحصائيات عامة');
      generalSheet.columns = [
        { header: 'نوع الإحصائية', key: 'type', width: 25 },
        { header: 'القيمة', key: 'value', width: 20 }
      ];

      const generalStats = {
        'إجمالي المواعيد': statistics.totalAppointments,
        'إجمالي المستخدمين': statistics.totalUsers,
        'عدد التخصصات': statistics.totalSpecialties,
        'عدد العيادات': statistics.totalClinics,
        'عدد المراكز': statistics.totalCenters,
        'متوسط المواعيد اليومي': (statistics.totalAppointments / 30).toFixed(1),
        'المواعيد المحجوزة': statistics.bookedAppointments,
        'المواعيد المتاحة': statistics.availableSlots,
        'تم الإرسال': statistics.dataSent || 0,
        'لم يتم الإرسال': statistics.notDataSent || 0
      };

      Object.entries(generalStats).forEach(([key, value], index) => {
        const row = generalSheet.addRow({ type: key, value: value });
        row.eachCell(cell => {
          cell.style = index % 2 === 0 ? cellStyle : alternateCellStyle;
        });
      });

      // تطبيق التنسيق على العناوين
      generalSheet.getRow(1).eachCell(cell => {
        cell.style = headerStyle;
      });

      // إحصائيات المحافظات
      const provinceSheet = workbook.addWorksheet('إحصائيات المحافظات');
      provinceSheet.columns = [
        { header: 'المحافظة', key: 'province', width: 25 },
        { header: 'العدد', key: 'count', width: 15 },
        { header: 'النسبة المئوية', key: 'percentage', width: 15 }
      ];

      const provinceStats = Object.entries(statistics.appointmentsByProvince || {})
        .sort((a, b) => b[1] - a[1])
        .map(([province, count]) => ({
          province,
          count,
          percentage: `${((count / statistics.totalAppointments) * 100).toFixed(1)}%`
        }));

      provinceStats.forEach((stat, index) => {
        const row = provinceSheet.addRow(stat);
        row.eachCell(cell => {
          cell.style = index % 2 === 0 ? cellStyle : alternateCellStyle;
        });
      });

      // تطبيق التنسيق على العناوين
      provinceSheet.getRow(1).eachCell(cell => {
        cell.style = headerStyle;
      });

      // إضافة الفلتر التلقائي لورقة المحافظات
      provinceSheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: provinceSheet.columnCount }
      };

      // إحصائيات التخصصات
      const serviceSheet = workbook.addWorksheet('إحصائيات التخصصات');
      serviceSheet.columns = [
        { header: 'التخصص', key: 'service', width: 25 },
        { header: 'العدد', key: 'count', width: 15 },
        { header: 'النسبة المئوية', key: 'percentage', width: 15 }
      ];

      const serviceStats = Object.entries(statistics.appointmentsByService || {})
        .sort((a, b) => b[1] - a[1])
        .map(([service, count]) => ({
          service,
          count,
          percentage: `${((count / statistics.totalAppointments) * 100).toFixed(1)}%`
        }));

      serviceStats.forEach((stat, index) => {
        const row = serviceSheet.addRow(stat);
        row.eachCell(cell => {
          cell.style = index % 2 === 0 ? cellStyle : alternateCellStyle;
        });
      });

      // تطبيق التنسيق على العناوين
      serviceSheet.getRow(1).eachCell(cell => {
        cell.style = headerStyle;
      });

      // إضافة الفلتر التلقائي لورقة التخصصات
      serviceSheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: serviceSheet.columnCount }
      };

      // إحصائيات العيادات والمراكز
      const locationSheet = workbook.addWorksheet('إحصائيات العيادات والمراكز');
      locationSheet.columns = [
        { header: 'المكان', key: 'location', width: 35 },
        { header: 'العدد', key: 'count', width: 15 },
        { header: 'النسبة المئوية', key: 'percentage', width: 15 }
      ];

      const locationStats = Object.entries(statistics.appointmentsByLocation || {})
        .sort((a, b) => b[1] - a[1])
        .map(([location, count]) => ({
          location,
          count,
          percentage: `${((count / statistics.totalAppointments) * 100).toFixed(1)}%`
        }));

      locationStats.forEach((stat, index) => {
        const row = locationSheet.addRow(stat);
        row.eachCell(cell => {
          cell.style = index % 2 === 0 ? cellStyle : alternateCellStyle;
        });
      });

      // تطبيق التنسيق على العناوين
      locationSheet.getRow(1).eachCell(cell => {
        cell.style = headerStyle;
      });

      // إضافة الفلتر التلقائي لورقة العيادات والمراكز
      locationSheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: locationSheet.columnCount }
      };

      // تجميد الصف الأول في جميع الأوراق
      [generalSheet, provinceSheet, serviceSheet, locationSheet].forEach(sheet => {
        sheet.views = [
          { state: 'frozen', xSplit: 0, ySplit: 1 }
        ];
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