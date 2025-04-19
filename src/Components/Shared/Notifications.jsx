import React, { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import { 
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const Notifications = ({ appointments }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // تحويل المواعيد إلى إشعارات
    const newNotifications = appointments.map(appointment => ({
      id: appointment.id,
      title: `موعد جديد: ${appointment.name}`,
      message: `موعد في ${appointment.clinicOrCenter} بتاريخ ${appointment.appointment}`,
      type: 'info',
      date: new Date(appointment.appointment),
      read: false
    }));

    // إضافة إشعارات للمواعيد القريبة
    const today = new Date();
    const upcomingAppointments = appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment);
      const diffDays = Math.ceil((appointmentDate - today) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 7;
    });

    const upcomingNotifications = upcomingAppointments.map(appointment => ({
      id: `upcoming-${appointment.id}`,
      title: `تذكير بموعد: ${appointment.name}`,
      message: `لديك موعد غداً في ${appointment.clinicOrCenter}`,
      type: 'warning',
      date: new Date(appointment.appointment),
      read: false
    }));

    setNotifications([...newNotifications, ...upcomingNotifications]);
  }, [appointments]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (notificationId) => {
    setNotifications(notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    ));
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 360,
          },
        }}
      >
        <Typography variant="h6" className="p-4">
          الإشعارات
        </Typography>
        <Divider />
        <List>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText primary="لا توجد إشعارات" />
            </ListItem>
          ) : (
            notifications.map((notification) => (
              <ListItem
                key={notification.id}
                button
                onClick={() => handleMarkAsRead(notification.id)}
                className={notification.read ? 'bg-gray-50' : ''}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <>
                      <Typography variant="body2" component="span">
                        {notification.message}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="textSecondary">
                        {format(notification.date, 'PPP', { locale: ar })}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            ))
          )}
        </List>
      </Menu>
    </>
  );
};

export default Notifications; 