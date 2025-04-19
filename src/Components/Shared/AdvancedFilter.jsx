import React, { useState } from 'react';
import { 
  TextField, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Grid,
  Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const AdvancedFilter = ({ onFilter, fields }) => {
  const [filters, setFilters] = useState({});

  const handleChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter(filters);
  };

  const handleReset = () => {
    setFilters({});
    onFilter({});
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <Grid container spacing={2}>
        {fields.map((field) => (
          <Grid item xs={12} sm={6} md={4} key={field.name}>
            {field.type === 'date' ? (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label={field.label}
                  value={filters[field.name] || null}
                  onChange={(date) => handleChange(field.name, date)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            ) : field.type === 'select' ? (
              <FormControl fullWidth>
                <InputLabel>{field.label}</InputLabel>
                <Select
                  value={filters[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  label={field.label}
                >
                  {field.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                label={field.label}
                value={filters[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            )}
          </Grid>
        ))}
        <Grid item xs={12}>
          <Button type="submit" variant="contained" color="primary" className="mr-2">
            تطبيق الفلتر
          </Button>
          <Button variant="outlined" onClick={handleReset}>
            إعادة تعيين
          </Button>
        </Grid>
      </Grid>
    </form>
  );
};

export default AdvancedFilter; 