import React from 'react';
import { Paper, Typography, Grid } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Statistics = ({ appointments, users }) => {
  // إحصائيات المواعيد حسب المحافظة
  const appointmentsByProvince = appointments.reduce((acc, appointment) => {
    acc[appointment.province] = (acc[appointment.province] || 0) + 1;
    return acc;
  }, {});

  // إحصائيات المواعيد حسب التخصص
  const appointmentsByService = appointments.reduce((acc, appointment) => {
    acc[appointment.service] = (acc[appointment.service] || 0) + 1;
    return acc;
  }, {});

  const provinceData = {
    labels: Object.keys(appointmentsByProvince),
    datasets: [
      {
        label: 'عدد المواعيد حسب المحافظة',
        data: Object.values(appointmentsByProvince),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
    ],
  };

  const serviceData = {
    labels: Object.keys(appointmentsByService),
    datasets: [
      {
        label: 'عدد المواعيد حسب التخصص',
        data: Object.values(appointmentsByService),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper className="p-4">
          <Typography variant="h6" className="mb-4">
            إحصائيات المواعيد حسب المحافظة
          </Typography>
          <Bar data={provinceData} options={options} />
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper className="p-4">
          <Typography variant="h6" className="mb-4">
            إحصائيات المواعيد حسب التخصص
          </Typography>
          <Pie data={serviceData} options={options} />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper className="p-4">
          <Typography variant="h6" className="mb-4">
            ملخص الإحصائيات
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper className="p-3 bg-blue-50">
                <Typography variant="subtitle1">إجمالي المواعيد</Typography>
                <Typography variant="h4">{appointments.length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper className="p-3 bg-green-50">
                <Typography variant="subtitle1">إجمالي المستخدمين</Typography>
                <Typography variant="h4">{users.length}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper className="p-3 bg-purple-50">
                <Typography variant="subtitle1">متوسط المواعيد اليومي</Typography>
                <Typography variant="h4">
                  {(appointments.length / 30).toFixed(1)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Statistics; 