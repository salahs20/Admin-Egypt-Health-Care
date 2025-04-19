import React, { useState } from 'react';
import { 
  Paper, 
  Typography, 
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';

const Calendar = ({ appointments, onAddAppointment }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    title: '',
    description: '',
    time: ''
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setOpenDialog(true);
  };

  const handleAddAppointment = () => {
    if (selectedDate && newAppointment.title) {
      onAddAppointment({
        ...newAppointment,
        date: selectedDate
      });
      setOpenDialog(false);
      setNewAppointment({ title: '', description: '', time: '' });
    }
  };

  const getAppointmentsForDate = (date) => {
    return appointments.filter(appointment => 
      isSameDay(new Date(appointment.date), date)
    );
  };

  return (
    <Paper className="p-4 bg-gray-50 rounded-lg shadow-md">
      <Grid container alignItems="center" className="mb-4">
        <Grid item>
          <IconButton onClick={handlePrevMonth}>
            <ChevronRightIcon />
          </IconButton>
        </Grid>
        <Grid item xs>
          <Typography variant="h6" align="center" className="text-gray-800 font-semibold">
            {format(currentDate, 'MMMM yyyy', { locale: ar })}
          </Typography>
        </Grid>
        <Grid item>
          <IconButton onClick={handleNextMonth}>
            <ChevronLeftIcon />
          </IconButton>
        </Grid>
      </Grid>

      <Grid container spacing={1}>
        {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => (
          <Grid item xs key={day}>
            <Typography align="center" className="font-bold text-gray-700">
              {day}
            </Typography>
          </Grid>
        ))}

        {daysInMonth.map((date) => {
          const dayAppointments = getAppointmentsForDate(date);
          const isToday = isSameDay(date, new Date());
          return (
            <Grid item xs key={date.toString()} className="min-h-[100px]">
              <Paper
                className={`p-2 h-full cursor-pointer rounded-lg transition-colors ${
                  !isSameMonth(date, currentDate) ? 'bg-gray-100 text-gray-400' : 'bg-white'
                } ${isToday ? 'bg-blue-100 text-blue-800 border border-blue-300' : ''} hover:bg-blue-50`}
                onClick={() => handleDateClick(date)}
              >
                <Typography align="right" className="font-medium">
                  {format(date, 'd')}
                </Typography>
                {dayAppointments.map((appointment, i) => (
                  <Typography
                    key={i}
                    variant="body2"
                    className="text-sm bg-blue-100 text-blue-800 p-1 rounded mb-1 truncate"
                  >
                    {appointment.title}
                  </Typography>
                ))}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle className="text-gray-800 font-semibold">
          إضافة موعد جديد - {selectedDate && format(selectedDate, 'dd/MM/yyyy')}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="عنوان الموعد"
            fullWidth
            value={newAppointment.title}
            onChange={(e) => setNewAppointment({ ...newAppointment, title: e.target.value })}
            className="mb-4"
          />
          <TextField
            margin="dense"
            label="الوصف"
            fullWidth
            multiline
            rows={3}
            value={newAppointment.description}
            onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
            className="mb-4"
          />
          <TextField
            margin="dense"
            label="الوقت"
            type="time"
            fullWidth
            value={newAppointment.time}
            onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
            className="mb-4"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} className="text-gray-600 hover:text-gray-800">
            إلغاء
          </Button>
          <Button onClick={handleAddAppointment} variant="contained" color="primary">
            إضافة
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Calendar;