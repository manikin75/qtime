const getDaysInMonth = (year: number, month: number) => {
  const days: Date[] = [];

  const numberOfDays = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= numberOfDays; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
};

export { getDaysInMonth };
