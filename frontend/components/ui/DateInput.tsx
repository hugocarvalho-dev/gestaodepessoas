'use client';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { parseISO, format, isValid } from 'date-fns';
import { SxProps, Theme } from '@mui/material';

interface DateInputProps {
  label: string;
  value: string;                           // ISO string (yyyy-MM-dd) or ''
  onChange: (isoDate: string) => void;      // emits '' | 'yyyy-MM-dd'
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Modern date input using MUI X DatePicker.
 * Replaces native `<TextField type="date" />` throughout the app.
 *
 * Receives and emits plain ISO date strings (yyyy-MM-dd)
 * to stay compatible with existing form state.
 */
export default function DateInput({
  label,
  value,
  onChange,
  required = false,
  error = false,
  helperText,
  disabled = false,
  size = 'small',
  fullWidth = true,
  sx,
}: DateInputProps) {
  const dateValue = value ? parseISO(value) : null;

  const handleChange = (date: Date | null) => {
    if (date && isValid(date)) {
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      onChange('');
    }
  };

  return (
    <DatePicker
      label={label}
      value={dateValue}
      onChange={handleChange}
      disabled={disabled}
      format="dd/MM/yyyy"
      slotProps={{
        textField: {
          size,
          fullWidth,
          required,
          error,
          helperText,
          sx,
        },
        actionBar: { actions: ['clear', 'today'] },
      }}
    />
  );
}
