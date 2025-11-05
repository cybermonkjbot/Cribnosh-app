/**
 * Format date for display in order cards
 * @param date Date string or timestamp
 * @returns Formatted date string (e.g., "6 Jun, 7:18 PM")
 */
export function formatOrderDate(date: string | number | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : 
                  date;
  
  const day = dateObj.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[dateObj.getMonth()];
  
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${day} ${month}, ${hours}:${minutesStr} ${ampm}`;
}

/**
 * Format date for display with full date
 * @param date Date string or timestamp
 * @returns Formatted date string (e.g., "6 June 2024, 7:18 PM")
 */
export function formatFullDate(date: string | number | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : 
                  date;
  
  const day = dateObj.getDate();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const month = monthNames[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  let hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${day} ${month} ${year}, ${hours}:${minutesStr} ${ampm}`;
}

