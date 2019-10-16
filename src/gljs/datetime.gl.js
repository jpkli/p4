
// Calculate the current day of the week as an integer
//   now - Unix timestamp like that from time(NULL)
//   tz_offset - Number of hours off from UTC; i.e. PST = -8
//   Return value: Sunday=0, Monday=1, ... Saturday=6
// int dayofweek(time_t now, int tz_offset) {
// 	// Calculate number of seconds since midnight 1 Jan 1970 local time
// 	time_t localtime = now + (tz_offset * 60 * 60);
// 	// Convert to number of days since 1 Jan 1970
// 	int days_since_epoch = localtime / 86400;
// 	// 1 Jan 1970 was a Thursday, so add 4 so Sunday is day 0, and mod 7
// 	int day_of_week = (days_since_epoch + 4) % 7; 

// 	return day_of_week;
// }

// function getDateTime(s) {
//   let z = Math.floor(s / 86400) + 719468;
//   let era = Math.floor(z >= 0 ? z : z - 146096) / 146097;
//   let doe = Math.floor((z - era * 146097));
//   let yoe = Math.floor((doe - doe / 1460 + doe / 36524 - doe / 146096) / 365);
//   let year = Math.floor((yoe) + era * 400);
//   let doy = Math.floor(doe - (365 * yoe + yoe / 4 - yoe / 100));
//   let mp = Math.floor(( 5 * doy + 2) / 153);
//   let day = Math.floor(doy - (153 * mp + 2) / 5 + 1);
//   let month = Math.floor(mp + (mp < 10 ? 3 : -9));
//   year += (month <= 2);
//   return {year, month, day};
// }

function getDateTime(s) {
  let second = s % 60
  let minute = Math.floor(s / 60) % 60
  let hour = Math.floor(s / 3600) % 24
  let days = Math.floor(s / 3600 / 24) 
  let years = Math.floor(days / 365.25)
  let year = 1970 + years;
  let dayOfWeek = (days + 4) % 7

  // let leapDays = 0
  // for (var i = 1970; i < year; i++) {
  //   if ((i % 4 === 0 && i % 100 !== 0) || (i % 400 == 0)) {
  //     leapDays += 1;
  //   }
  // }
  // days = days - (years * 365 + leapDays);
  days = days - Math.ceil(years * 365.25);
  let isLeapYear = ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0));
  let month = 1
  let daysInMonth
  while (month <= 12) {
    
    if(month === 2) {
      daysInMonth = 28 + isLeapYear;
    } else {
      daysInMonth = 30 + (month + (month < 7)) % 2
    }

    if (days > daysInMonth) {
      days -= daysInMonth
      month += 1
    } else {
      break;
    }
  }

  return {year, month, days, hour, minute, second, dayOfWeek}
}


export function getHour({ts = 'float'}) {
  var hours = floor(ts / 3600.0);
  return hours - (24.0 * floor(hours / 24.0)) + 1.0;
}

export function getYear({ts = 'float'}) {
  var days = floor(ts / 3600.0 / 24.0);
  var years = floor(days / 365.25);
  return 1970.0 + years;
}

export function floatMod({a = "float", b = "float"}) {
  return a - (b * floor(a / b));
}

// export function getMonth({ts = 'float'}) {
//   var days = floor(ts / 3600.0 / 24.0);
//   var years = floor(days / 365.25) + 1970.0;
//   var months = floor(days / 30.5);
//   return months - floor(months / 12.0);
// }

export function getDayOfWeek({ts = 'float'}) {
  var days = floor(ts / 3600.0 / 24.0) + 4.0;
  return days - (7.0 * floor(days / 7.0)) + 1.0;
} 

export function getMonth({ts = 'float'}) {
  var days = floor(ts / 3600.0 / 24.0);
  var years = floor(days / 365.25);
  days = days - ceil(years * 365.25);
  var month = new int();
  var daysInMonth;
  var year = 1970.0 + years;
  var isLeapYear = 0.0;
  if( (year - (4.0 * floor(year/4.0)) == 0.0 
    && year - (100.0 * floor(year/100.0)) != 0.0)
    || (year - (100.0 * floor(year/400.0)) == 0.0)
  ) {
    isLeapYear = 1.0;
  }
  month = 1;
  for (var i = 1; i<=12; i++) {
    if(month == 2) {
      daysInMonth = 28.0 + isLeapYear;
    } else if( month == 4 || month == 6 || month == 9 || month == 11) {
      daysInMonth = 30.0;
    } else {
      daysInMonth = 31.0;
    }
    if (days > daysInMonth) {
      days -= daysInMonth;
      month += 1;
    }
  }
  return float(month);
}