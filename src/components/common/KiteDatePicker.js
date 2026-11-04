import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  CalendarMonthOutlined,
  ChevronLeft,
  ChevronRight,
  Close,
} from "@mui/icons-material";
import "./KiteDatePicker.css";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const KiteDatePicker = ({
  value, // format: "YYYY-MM-DD"
  onChange,
  placeholder = "Select Date of Birth (DD-MM-YYYY)",
  maxDate = new Date().toISOString().split("T")[0], // default max is today for DOB
  minDate = "1930-01-01",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse existing value or fallback to 25 years ago for DOB convenience
  const parsedValue = useMemo(() => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    return null;
  }, [value]);

  // Current view year & month in calendar
  const [viewYear, setViewYear] = useState(() => {
    if (parsedValue) return parsedValue.getFullYear();
    return new Date().getFullYear() - 25; // convenient default for adult nominee
  });

  const [viewMonth, setViewMonth] = useState(() => {
    if (parsedValue) return parsedValue.getMonth();
    return 0; // January
  });

  // Keep view aligned if value changes
  useEffect(() => {
    if (parsedValue) {
      setViewYear(parsedValue.getFullYear());
      setViewMonth(parsedValue.getMonth());
    }
  }, [parsedValue]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Calculate age if date is selected
  const calculatedAge = useMemo(() => {
    if (!parsedValue) return null;
    const today = new Date();
    let age = today.getFullYear() - parsedValue.getFullYear();
    const m = today.getMonth() - parsedValue.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < parsedValue.getDate())) {
      age--;
    }
    return age;
  }, [parsedValue]);

  // Generate Year options (1930 to current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear; y >= 1930; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Days in month calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Prev month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: viewMonth - 1,
        year: viewMonth === 0 ? viewYear - 1 : viewYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        day: i,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        month: viewMonth + 1,
        year: viewMonth === 11 ? viewYear + 1 : viewYear,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleSelectDate = (item) => {
    const m = String(item.month + 1).padStart(2, "0");
    const d = String(item.day).padStart(2, "0");
    const isoString = `${item.year}-${m}-${d}`;

    // Validate bounds
    if (maxDate && isoString > maxDate) return;
    if (minDate && isoString < minDate) return;

    onChange(isoString);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
  };

  // Formatted display: e.g. "15 Aug 1994"
  const formattedDisplay = useMemo(() => {
    if (!parsedValue) return "";
    const d = parsedValue.getDate();
    const m = MONTH_NAMES[parsedValue.getMonth()].slice(0, 3);
    const y = parsedValue.getFullYear();
    return `${d} ${m} ${y}`;
  }, [parsedValue]);

  return (
    <div className="kite-datepicker-wrapper" ref={containerRef}>
      {/* Clickable Custom Input Box */}
      <div
        className={`kite-datepicker-input-box ${isOpen ? "focused" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <CalendarMonthOutlined className="calendar-prefix-icon" fontSize="small" />

        <span className={`date-text-display ${!formattedDisplay ? "placeholder" : ""}`}>
          {formattedDisplay || placeholder}
        </span>

        {calculatedAge !== null && (
          <span className={`age-pill ${calculatedAge < 18 ? "minor" : "adult"}`}>
            {calculatedAge} yrs {calculatedAge < 18 ? "• Minor" : ""}
          </span>
        )}

        {value ? (
          <button
            type="button"
            className="clear-date-btn"
            onClick={handleClear}
            title="Clear date"
          >
            <Close fontSize="inherit" />
          </button>
        ) : (
          <span className="dropdown-indicator">▾</span>
        )}
      </div>

      {/* Floating Custom Kite Calendar Flyout */}
      {isOpen && (
        <div className="kite-calendar-flyout" onClick={(e) => e.stopPropagation()}>
          {/* Header Controls (Month & Year Selectors) */}
          <div className="calendar-header-bar">
            <button
              type="button"
              className="calendar-nav-arrow"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft fontSize="small" />
            </button>

            <div className="calendar-jump-selectors">
              <select
                className="calendar-select month-select"
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                className="calendar-select year-select"
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="calendar-nav-arrow"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight fontSize="small" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="calendar-weekdays-row">
            {DAYS_OF_WEEK.map((d, i) => (
              <span key={i} className="weekday-col">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="calendar-days-grid">
            {calendarDays.map((item, idx) => {
              const m = String(item.month + 1).padStart(2, "0");
              const d = String(item.day).padStart(2, "0");
              const iso = `${item.year}-${m}-${d}`;

              const isSelected = value === iso;
              const isFuture = maxDate && iso > maxDate;
              const isTooOld = minDate && iso < minDate;
              const isDisabled = isFuture || isTooOld;

              let cellClass = "calendar-day-cell";
              if (!item.isCurrentMonth) cellClass += " outside-month";
              if (isSelected) cellClass += " selected";
              if (isDisabled) cellClass += " disabled";

              return (
                <button
                  key={idx}
                  type="button"
                  className={cellClass}
                  disabled={isDisabled}
                  onClick={() => handleSelectDate(item)}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Calendar Footer Bar */}
          <div className="calendar-footer-bar">
            {calculatedAge !== null ? (
              <span className="footer-age-info">
                Age: <strong>{calculatedAge} years</strong> ({calculatedAge < 18 ? "Minor" : "Adult"})
              </span>
            ) : (
              <span className="footer-hint">Select birth date above</span>
            )}

            <div className="footer-btn-actions">
              {value && (
                <button
                  type="button"
                  className="cal-btn-text danger"
                  onClick={handleClear}
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                className="cal-btn-text primary"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KiteDatePicker;
